from django.db import models
from django.db.models import Q

class Skill(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)

    class Meta:
        indexes = [
            models.Index(fields=["name"], name="idx_skills_name"),
            models.Index(fields=["category"], name="idx_skills_category"),
        ]

    def __str__(self):
        return self.name


class UserSkill(models.Model):
    id = models.BigAutoField(primary_key=True)

    user = models.ForeignKey("users.User", on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)

    skill_type = models.CharField(
        max_length=20,
        choices=[
            ("teaches", "Teaches"),
            ("wants_to_learn", "Wants to learn"),
        ],
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["user"], name="idx_user_skills_user"),
            models.Index(fields=["skill"], name="idx_user_skills_skill"),
            models.Index(fields=["skill_type"], name="idx_user_skills_type"),
        ]
        constraints = [
            models.UniqueConstraint(fields=["user", "skill"], name="ux_user_skill_user_skill"),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.skill.name} ({self.skill_type})"


class Qualification(models.Model):
    id = models.BigAutoField(primary_key=True)

    tutor = models.ForeignKey("users.User", on_delete=models.CASCADE)
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE)

    file_url = models.TextField()
    file_name = models.CharField(max_length=255)
    file_size = models.IntegerField()

    status = models.CharField(
        max_length=20,
        default="pending",
        choices=[
            ("pending", "Pending"),
            ("approved", "Approved"),
            ("rejected", "Rejected"),
        ],
    )

    notes = models.TextField(null=True, blank=True)

    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    admin = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="qualification_reviews",
    )

    class Meta:
        indexes = [
            models.Index(fields=["tutor"], name="idx_qualifications_tutor"),
            models.Index(fields=["skill"], name="idx_qualifications_skill"),
            models.Index(fields=["status"], name="idx_qualifications_status"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(file_size__lte=5242880),
                name="chk_qualifications_file_size_max_5mb",
            ),
        ]

    def __str__(self):
        return f"{self.file_name} ({self.status})"
