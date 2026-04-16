import uuid6
from django.db import models
from django.db.models import Q, F

class Booking(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)

    student = models.ForeignKey("users.User", on_delete=models.RESTRICT, related_name="student_bookings")
    tutor = models.ForeignKey("users.User", on_delete=models.RESTRICT, related_name="tutor_bookings")

    skill = models.ForeignKey("skills.Skill", on_delete=models.RESTRICT)
    availability = models.ForeignKey("availability.Availability", on_delete=models.RESTRICT)

    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()

    status = models.CharField(
        max_length=20,
        default="pending",
        choices=[
            ("pending", "Pending"),
            ("confirmed", "Confirmed"),
            ("rejected", "Rejected"),
            ("completed", "Completed"),
            ("cancelled", "Cancelled"),
        ],
    )

    request_date = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["student"], name="idx_bookings_student"),
            models.Index(fields=["tutor"], name="idx_bookings_tutor"),
            models.Index(fields=["status", "booking_date"], name="idx_bookings_status_date"),
            models.Index(fields=["availability"], name="idx_bookings_availability"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(end_time__gt=F("start_time")),
                name="chk_bookings_time_logic",
            ),
            models.UniqueConstraint(
                fields=["availability"],
                condition=Q(status="confirmed"),
                name="ux_booking_active_slot",
            ),
        ]

    def __str__(self):
        return f"Booking {self.id} - {self.student.email} → {self.tutor.email}"
