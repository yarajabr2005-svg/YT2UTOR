from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.bookings.models import Booking
from apps.availability.models import Availability
from apps.skills.models import Skill

# Added Import
from apps.notifications.services import NotificationService

User = get_user_model()

# -----------------------------
# Domain Exceptions
# -----------------------------

class BookingNotFoundError(Exception):
    pass

class SlotNotAvailableError(Exception):
    pass

class SlotAlreadyBookedError(Exception):
    pass

class InvalidStateTransitionError(Exception):
    pass

class CancellationWindowExpiredError(Exception):
    pass

class NoAvailabilityError(Exception):
    pass

# -----------------------------
# STATE PATTERN
# -----------------------------

class BookingState:
    def confirm(self, booking: Booking, actor: User) -> None:
        raise InvalidStateTransitionError("Confirm not allowed in current state.")

    def reject(self, booking: Booking, actor: User) -> None:
        raise InvalidStateTransitionError("Reject not allowed in current state.")

    def cancel(self, booking: Booking, actor: User) -> None:
        raise InvalidStateTransitionError("Cancel not allowed in current state.")

    def complete(self, booking: Booking, actor: User) -> None:
        raise InvalidStateTransitionError("Complete not allowed in current state.")


class PendingState(BookingState):
    def confirm(self, booking: Booking, actor: User) -> None:
        if actor.id != booking.tutor_id:
            raise InvalidStateTransitionError("Only tutor can confirm this booking.")
        booking.status = "confirmed"
        booking.confirmed_at = timezone.now()

    def reject(self, booking: Booking, actor: User) -> None:
        if actor.id != booking.tutor_id:
            raise InvalidStateTransitionError("Only tutor can reject this booking.")
        booking.status = "rejected"

    def cancel(self, booking: Booking, actor: User) -> None:
        if actor.id != booking.student_id:
            raise InvalidStateTransitionError("Only student can cancel this pending booking.")
        booking.status = "cancelled"


class ConfirmedState(BookingState):
    def cancel(self, booking: Booking, actor: User) -> None:
        now = timezone.now()
        session_datetime = datetime.combine(booking.booking_date, booking.start_time)
        session_datetime = timezone.make_aware(session_datetime)

        if session_datetime - now < timedelta(hours=24):
            raise CancellationWindowExpiredError(
                "Confirmed bookings cannot be canceled within 24 hours of the session."
            )

        if actor.id not in (booking.student_id, booking.tutor_id):
            raise InvalidStateTransitionError("Only student or tutor can cancel this booking.")

        booking.status = "cancelled"

    def complete(self, booking: Booking, actor: User) -> None:
        if actor.id != booking.tutor_id:
            raise InvalidStateTransitionError("Only tutor can complete this booking.")

        now = timezone.localtime(timezone.now())
        session_end_naive = datetime.combine(booking.booking_date, booking.end_time)
        session_end = timezone.make_aware(session_end_naive, timezone.get_current_timezone())

        if now < session_end:
            raise InvalidStateTransitionError(
                f"You cannot complete a session before it has ended. "
                f"Current Local Time: {now.strftime('%H:%M')}, "
                f"Session End Time: {session_end.strftime('%H:%M')}"
            )

        booking.status = "completed"


class RejectedState(BookingState):
    pass


class CancelledState(BookingState):
    pass


class CompletedState(BookingState):
    pass


def get_state_for_booking(booking: Booking) -> BookingState:
    if booking.status == "pending":
        return PendingState()
    if booking.status == "confirmed":
        return ConfirmedState()
    if booking.status == "rejected":
        return RejectedState()
    if booking.status == "cancelled":
        return CancelledState()
    if booking.status == "completed":
        return CompletedState()
    raise InvalidStateTransitionError("Unknown booking status.")

# -----------------------------
# SERVICE LAYER
# -----------------------------

@dataclass
class BookingService:
    availability_service: "AvailabilityServicePort"
    # Updated to use NotificationService concrete class
    notification_service: Optional[NotificationService] = None

    @transaction.atomic
    def create_booking(self, student: User, tutor_id, skill_id, availability_id) -> Booking:
        if student.role != "student":
            raise PermissionError("Only students can create bookings.")

        try:
            tutor = User.objects.get(id=tutor_id, role="tutor")
        except User.DoesNotExist:
            raise BookingNotFoundError("Tutor not found.")

        try:
            skill = Skill.objects.get(id=skill_id)
        except Skill.DoesNotExist:
            raise BookingNotFoundError("Skill not found.")

        try:
            availability = Availability.objects.select_for_update().get(
                id=availability_id,
                tutor=tutor,
            )
        except Availability.DoesNotExist:
            raise NoAvailabilityError("This tutor is not available at this time.")

        if not self.availability_service.check_slot_available(availability):
            raise SlotNotAvailableError("Slot no longer available. Please choose another time.")

        if Booking.objects.filter(availability=availability, status="confirmed").exists():
            raise SlotAlreadyBookedError("This slot is already booked.")

        actual_booking_date = availability.week_start_date + timedelta(days=availability.day_of_week)

        booking = Booking.objects.create(
            student=student,
            tutor=tutor,
            skill=skill,
            availability=availability,
            booking_date=actual_booking_date,
            start_time=availability.start_time,
            end_time=availability.end_time,
            status="pending",
        )

        # Trigger Notification
        if self.notification_service:
            self.notification_service.send_booking_request(booking)

        return booking

    def list_bookings(self, user: User, status: Optional[str] = None,
                      type_: Optional[str] = None,
                      date_from=None, date_to=None):
        qs = Booking.objects.all()

        if user.role == "student":
            qs = qs.filter(student=user)
        elif user.role == "tutor":
            qs = qs.filter(tutor=user)
        else:
            qs = qs.none()

        if status:
            qs = qs.filter(status=status)

        today = timezone.localdate()

        if type_ == "upcoming":
            qs = qs.filter(booking_date__gte=today).exclude(status__in=["cancelled", "rejected"])

        elif type_ == "past":
            now = timezone.localtime()
            qs = qs.filter(
                status="completed"
            ).filter(
                booking_date__lt=today
            ) | qs.filter(
                status="completed",
                booking_date=today,
                end_time__lt=now.time()
            )

        return qs.order_by("booking_date", "start_time")

    @transaction.atomic
    def confirm_booking(self, booking_id, tutor: User) -> Booking:
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise BookingNotFoundError("Booking not found.")

        if tutor.id != booking.tutor_id:
            raise PermissionError("Only the tutor can confirm this booking.")

        state = get_state_for_booking(booking)
        state.confirm(booking, tutor)
        booking.save()

        # Trigger Notification
        if self.notification_service:
            self.notification_service.send_booking_confirmation(booking)

        return booking

    @transaction.atomic
    def reject_booking(self, booking_id, tutor: User) -> Booking:
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise BookingNotFoundError("Booking not found.")

        if tutor.id != booking.tutor_id:
            raise PermissionError("Only the tutor can reject this booking.")

        state = get_state_for_booking(booking)
        state.reject(booking, tutor)
        booking.save()

        # Trigger Notification
        if self.notification_service:
            self.notification_service.send_booking_rejection(booking)

        return booking

    @transaction.atomic
    def cancel_booking(self, booking_id, actor: User) -> Booking:
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise BookingNotFoundError("Booking not found.")

        state = get_state_for_booking(booking)
        state.cancel(booking, actor)
        booking.save()

        # Trigger Notification
        if self.notification_service:
            self.notification_service.send_booking_cancellation(booking, actor)

        return booking

    @transaction.atomic
    def complete_booking(self, booking_id, tutor: User) -> Booking:
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise BookingNotFoundError("Booking not found.")

        state = get_state_for_booking(booking)
        state.complete(booking, tutor)
        booking.save()

        return booking

# -----------------------------
# PORTS & ADAPTERS
# -----------------------------

class AvailabilityServicePort:
    def check_slot_available(self, availability: Availability) -> bool:
        raise NotImplementedError

class AvailabilityServiceAdapter(AvailabilityServicePort):
    def check_slot_available(self, availability: Availability) -> bool:
        return not Booking.objects.filter(
            availability=availability,
            status="confirmed",
        ).exists()

class NotificationServicePort:
    def send_booking_confirmation(self, booking: Booking): ...
    def send_booking_rejection(self, booking: Booking): ...
    def send_booking_cancellation(self, booking: Booking, actor: User): ...
    def send_booking_request(self, booking: Booking): ...