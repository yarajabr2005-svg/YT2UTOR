import uuid6
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # UUIDv7 primary key (NFR-04)
    id = models.UUIDField(primary_key=True, default=uuid6.uuid7, editable=False)

    # Email login (Functional Requirement)
    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        default="student",
        choices=[
            ("student", "Student"),
            ("tutor", "Tutor"),
            ("admin", "Admin"),
        ],
    )

    bio = models.TextField(null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to="avatars/%Y/%m/",
        null=True,
        blank=True,
    )

    average_rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    total_reviews = models.IntegerField(null=True, blank=True)

    verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # EMAIL LOGIN FIX
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        indexes = [
            models.Index(fields=["role"], name="idx_users_role"),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"
