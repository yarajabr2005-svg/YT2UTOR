from django.db import models
from django.db.models import Q, F

class Availability(models.Model):
    id = models.BigAutoField(primary_key=True)

    tutor = models.ForeignKey("users.User", on_delete=models.CASCADE)

    week_start_date = models.DateField()
    day_of_week = models.IntegerField()  # 0–6

    start_time = models.TimeField()
    end_time = models.TimeField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["tutor"], name="idx_availability_tutor"),
            models.Index(fields=["day_of_week", "start_time"], name="idx_availability_day_time"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(day_of_week__gte=0) & Q(day_of_week__lte=6),
                name="chk_availability_day_range",
            ),
            models.CheckConstraint(
                condition=Q(end_time__gt=F("start_time")),
                name="chk_availability_time_logic",
            ),
        ]

    def __str__(self):
        return f"{self.tutor.email} - {self.week_start_date} - {self.day_of_week}"
