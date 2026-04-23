from datetime import time
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q

from apps.bookings.models import Booking
from .models import Availability

User = get_user_model()

BUSINESS_START = time(8, 0)
BUSINESS_END = time(22, 0)


class OverlappingSlotError(Exception):
    pass


class InvalidTimeRangeError(Exception):
    pass


class SlotHasBookingsError(Exception):
    pass


class AvailabilityService:
    @staticmethod
    def _validate_time_range(start_time, end_time):
        if not (BUSINESS_START <= start_time < end_time <= BUSINESS_END):
            raise InvalidTimeRangeError(
                "Please select time within business hours (8:00 AM - 10:00 PM)."
            )

    @staticmethod
    def _check_overlaps(tutor, week_start_date, day_of_week, start_time, end_time, exclude_id=None):
        qs = Availability.objects.filter(
            tutor=tutor,
            week_start_date=week_start_date,
            day_of_week=day_of_week,
        )

        if exclude_id is not None:
            qs = qs.exclude(id=exclude_id)

        overlap_exists = qs.filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        ).exists()

        if overlap_exists:
            raise OverlappingSlotError("Time slots cannot overlap.")

    @staticmethod
    def _ensure_no_confirmed_bookings(slot: Availability):
        has_confirmed = Booking.objects.filter(
            availability=slot,
            status="confirmed",
        ).exists()
        if has_confirmed:
            raise SlotHasBookingsError(
                "Cannot remove or modify this time slot. It has confirmed bookings. Please contact students to reschedule."
            )

    @staticmethod
    @transaction.atomic
    def create_slots(tutor: User, week_start_date, slots_data):
        # FIX 2 — Check overlaps inside the same request
        sorted_slots = sorted(
            slots_data,
            key=lambda s: (s["day_of_week"], s["start_time"]),
        )

        for i in range(len(sorted_slots) - 1):
            current = sorted_slots[i]
            nxt = sorted_slots[i + 1]

            if current["day_of_week"] == nxt["day_of_week"]:
                if current["end_time"] > nxt["start_time"]:
                    raise OverlappingSlotError("Time slots cannot overlap.")

        # Existing DB checks + creation
        created_slots = []

        for slot in slots_data:
            day_of_week = slot["day_of_week"]
            start_time = slot["start_time"]
            end_time = slot["end_time"]

            AvailabilityService._validate_time_range(start_time, end_time)
            AvailabilityService._check_overlaps(
                tutor=tutor,
                week_start_date=week_start_date,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
            )

            created_slots.append(
                Availability.objects.create(
                    tutor=tutor,
                    week_start_date=week_start_date,
                    day_of_week=day_of_week,
                    start_time=start_time,
                    end_time=end_time,
                )
            )

        return created_slots

    @staticmethod
    @transaction.atomic
    def update_slot(tutor: User, slot_id, data):
        try:
            slot = Availability.objects.get(id=slot_id, tutor=tutor)
        except Availability.DoesNotExist:
            raise ValueError("Availability slot not found.")

        AvailabilityService._ensure_no_confirmed_bookings(slot)

        week_start_date = data.get("week_start_date", slot.week_start_date)
        day_of_week = data.get("day_of_week", slot.day_of_week)
        start_time = data.get("start_time", slot.start_time)
        end_time = data.get("end_time", slot.end_time)
        AvailabilityService._validate_time_range(start_time, end_time)
        AvailabilityService._check_overlaps(
            tutor=tutor,
            week_start_date=week_start_date,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            exclude_id=slot.id,
        )

        slot.week_start_date = week_start_date
        slot.day_of_week = day_of_week
        slot.start_time = start_time
        slot.end_time = end_time
        slot.save()

        return slot

    @staticmethod
    @transaction.atomic
    def delete_slot(tutor: User, slot_id):
        try:
            slot = Availability.objects.get(id=slot_id, tutor=tutor)
        except Availability.DoesNotExist:
            raise ValueError("Availability slot not found.")

        AvailabilityService._ensure_no_confirmed_bookings(slot)
        slot.delete()

    @staticmethod
    def get_by_tutor(tutor_id):
        try:
            tutor = User.objects.get(id=tutor_id, role="tutor")
        except User.DoesNotExist:
            raise ValueError("Tutor not found.")

        return Availability.objects.filter(tutor=tutor).order_by(
            "week_start_date", "day_of_week", "start_time"
        )
    