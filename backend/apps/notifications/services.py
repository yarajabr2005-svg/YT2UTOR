import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Centralized service for all YTuTor email communications.
    Implements EF-09: Failures are logged but do not block main operations.
    """

    def _safe_send_mail(self, subject, message, recipient_list):
        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                fail_silently=False,
            )
        except Exception as e:
            # EF-09: Log error but do not raise exception to the user
            logger.error(f"Email delivery failed to {recipient_list}: {str(e)}")

    def send_password_reset_email(self, user, reset_link):
        subject = "YT2UTOR - Password Reset Request"
        message = f"Hello,\n\nYou requested a password reset. Use the link below to set a new password:\n{reset_link}\n\nIf you did not request this, please ignore this email."
        self._safe_send_mail(subject, message, [user.email])

    def send_booking_request(self, booking):
        subject = "New Booking Request Received"
        message = (
            f"Hello {booking.tutor.username or booking.tutor.email},\n\n"
            f"You have a new booking request from {booking.student.username or booking.student.email}.\n"
            f"Skill: {booking.skill.name}\n"
            f"Date: {booking.booking_date}\n"
            f"Time: {booking.start_time} - {booking.end_time}\n\n"
            f"Please log in to your dashboard to respond."
        )
        self._safe_send_mail(subject, message, [booking.tutor.email])

    def send_booking_confirmation(self, booking):
        subject = "Booking Confirmed! - YT2UTOR"
        message = (
            f"Hi {booking.student.username or booking.student.email},\n\n"
            f"Your booking with {booking.tutor.username or booking.tutor.email} has been confirmed.\n"
            f"Skill: {booking.skill.name}\n"
            f"Date: {booking.booking_date}\n"
            f"Time: {booking.start_time}\n"
        )
        self._safe_send_mail(subject, message, [booking.student.email])

    def send_booking_rejection(self, booking):
        subject = "Update regarding your Booking Request"
        message = (
            f"Hi {booking.student.username or booking.student.email},\n\n"
            f"Unfortunately, your booking request for {booking.skill.name} was not accepted this time."
        )
        self._safe_send_mail(subject, message, [booking.student.email])

    def send_booking_cancellation(self, booking, actor):
        """Notify the other party when a booking is cancelled."""
        recipient_email = booking.tutor.email if actor == booking.student else booking.student.email
        subject = "Booking Cancelled - YT2UTOR"
        message = (
            f"The booking for {booking.skill.name} on {booking.booking_date} "
            f"has been cancelled by {actor.username or actor.email}."
        )
        self._safe_send_mail(subject, message, [recipient_email])