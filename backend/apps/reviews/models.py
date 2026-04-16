from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator, MaxValueValidator

class Review(models.Model):
    id = models.BigAutoField(primary_key=True)

    booking = models.OneToOneField("bookings.Booking", on_delete=models.CASCADE, unique=True)
    student = models.ForeignKey("users.User", on_delete=models.RESTRICT, related_name="written_reviews")
    tutor = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="received_reviews")

    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["booking"], name="idx_reviews_booking"),
            models.Index(fields=["tutor"], name="idx_reviews_tutor"),
            models.Index(fields=["rating"], name="idx_reviews_rating"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(rating__gte=1) & Q(rating__lte=5),
                name="chk_reviews_rating_range",
            ),
        ]

    def __str__(self):
        return f"{self.rating}★ for {self.tutor.email}"
