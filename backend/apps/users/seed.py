import os
from datetime import time, timedelta
from decimal import Decimal

from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone


SEED_PASSWORD = "Password123!"


def _media_url(filename):
    return default_storage.url(f"seed/{filename}")


def _media_size(filename):
    path = settings.MEDIA_ROOT / "seed" / filename
    try:
        return os.path.getsize(path)
    except OSError:
        return 0


def _week_start(days_offset=0):
    today = timezone.localdate() + timedelta(days=days_offset)
    return today - timedelta(days=today.weekday())


def _upsert_user(User, *, email, defaults):
    password = defaults.pop("password", SEED_PASSWORD)
    seed_avatar = defaults.pop("_seed_avatar", None)
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": defaults.get("username", email),
            **defaults,
        },
    )

    changed_fields = []
    for field, value in defaults.items():
        if getattr(user, field) != value:
            setattr(user, field, value)
            changed_fields.append(field)

    if created or not user.has_usable_password():
        user.set_password(password)
        changed_fields.append("password")

    if changed_fields:
        user.save()

    if seed_avatar:
        path = settings.MEDIA_ROOT / "seed" / seed_avatar
        if path.is_file():
            with open(path, "rb") as fh:
                user.profile_picture.save(seed_avatar, File(fh), save=True)

    return user


@transaction.atomic
def seed_initial_data(stdout=None):
    from apps.availability.models import Availability
    from apps.bookings.models import Booking
    from apps.reviews.models import Review
    from apps.reviews.services import ReviewService
    from apps.skills.models import Qualification, Skill, UserSkill
    from apps.users.models import User

    skills = {}
    for name, category in [
        ("Python Programming", "Technology"),
        ("Mathematics", "STEM"),
        ("English Communication", "Languages"),
        ("Data Analysis", "Technology"),
        ("Physics", "STEM"),
        ("Academic Writing", "Languages"),
    ]:
        skill, _ = Skill.objects.update_or_create(
            name=name,
            defaults={"category": category},
        )
        skills[name] = skill

    admin = _upsert_user(
        User,
        email="admin@yt2utor.local",
        defaults={
            "username": "Admin",
            "role": "admin",
            "bio": "Platform administrator for reviewing tutor qualifications.",
            "verified": True,
            "is_staff": True,
            "is_superuser": True,
        },
    )

    tutors = [
        _upsert_user(
            User,
            email="lina.haddad@yt2utor.local",
            defaults={
                "username": "Lina Haddad",
                "role": "tutor",
                "bio": "Mathematics tutor focused on algebra, calculus, and exam preparation.",
                "_seed_avatar": "lina-haddad.png",
                "verified": True,
                "average_rating": Decimal("4.80"),
                "total_reviews": 1,
            },
        ),
        _upsert_user(
            User,
            email="omar.nasser@yt2utor.local",
            defaults={
                "username": "Omar Nasser",
                "role": "tutor",
                "bio": "Programming tutor teaching Python, debugging, and beginner-friendly software projects.",
                "_seed_avatar": "omar-nasser.png",
                "verified": True,
                "average_rating": Decimal("5.00"),
                "total_reviews": 0,
            },
        ),
        _upsert_user(
            User,
            email="maya.karim@yt2utor.local",
            defaults={
                "username": "Maya Karim",
                "role": "tutor",
                "bio": "English communication tutor for speaking confidence, presentations, and academic writing.",
                "_seed_avatar": "maya-karim.png",
                "verified": False,
                "average_rating": None,
                "total_reviews": 0,
            },
        ),
    ]

    student = _upsert_user(
        User,
        email="sami.alwan@yt2utor.local",
        defaults={
            "username": "Sami Alwan",
            "role": "student",
            "bio": "Computer science student looking for help with programming and mathematics.",
            "_seed_avatar": "sami-alwan.png",
            "verified": False,
            "average_rating": None,
            "total_reviews": 0,
        },
    )

    tutor_skills = {
        tutors[0]: ["Mathematics", "Physics"],
        tutors[1]: ["Python Programming", "Data Analysis"],
        tutors[2]: ["English Communication", "Academic Writing"],
    }
    for tutor, names in tutor_skills.items():
        for name in names:
            UserSkill.objects.get_or_create(
                user=tutor,
                skill=skills[name],
                defaults={"skill_type": "teaches"},
            )

    for tutor, name, filename, status in [
        (tutors[0], "Mathematics", "lina-haddad.png", "approved"),
        (tutors[1], "Python Programming", "omar-nasser.png", "approved"),
        (tutors[2], "English Communication", "maya-karim.png", "pending"),
    ]:
        qualification, _ = Qualification.objects.get_or_create(
            tutor=tutor,
            skill=skills[name],
            file_name=f"{tutor.username.lower().replace(' ', '-')}-qualification.png",
            defaults={
                "file_url": _media_url(filename),
                "file_size": _media_size(filename),
                "status": status,
                "notes": "Seed qualification for first-launch demo data.",
                "admin": admin if status == "approved" else None,
                "reviewed_at": timezone.now() if status == "approved" else None,
            },
        )
        updates = {
            "file_url": _media_url(filename),
            "file_size": _media_size(filename),
            "status": status,
        }
        for field, value in updates.items():
            setattr(qualification, field, value)
        qualification.save()

    current_week = _week_start()
    previous_week = _week_start(days_offset=-7)
    next_week = _week_start(days_offset=7)

    availability_specs = [
        (tutors[0], previous_week, 2, time(10, 0), time(11, 0)),
        (tutors[0], current_week, 1, time(14, 0), time(15, 0)),
        (tutors[0], next_week, 3, time(16, 0), time(17, 0)),
        (tutors[1], current_week, 2, time(9, 0), time(10, 30)),
        (tutors[1], next_week, 4, time(13, 0), time(14, 0)),
        (tutors[2], current_week, 5, time(11, 0), time(12, 0)),
    ]
    slots = []
    for tutor, week, day, start, end in availability_specs:
        slot, _ = Availability.objects.get_or_create(
            tutor=tutor,
            week_start_date=week,
            day_of_week=day,
            start_time=start,
            end_time=end,
        )
        slots.append(slot)

    completed_booking, _ = Booking.objects.get_or_create(
        student=student,
        tutor=tutors[0],
        skill=skills["Mathematics"],
        availability=slots[0],
        defaults={
            "booking_date": slots[0].week_start_date + timedelta(days=slots[0].day_of_week),
            "start_time": slots[0].start_time,
            "end_time": slots[0].end_time,
            "status": "completed",
            "confirmed_at": timezone.now() - timedelta(days=3),
        },
    )
    if completed_booking.status != "completed":
        completed_booking.status = "completed"
        completed_booking.confirmed_at = timezone.now() - timedelta(days=3)
        completed_booking.save()

    Booking.objects.get_or_create(
        student=student,
        tutor=tutors[1],
        skill=skills["Python Programming"],
        availability=slots[3],
        defaults={
            "booking_date": slots[3].week_start_date + timedelta(days=slots[3].day_of_week),
            "start_time": slots[3].start_time,
            "end_time": slots[3].end_time,
            "status": "pending",
        },
    )

    Booking.objects.get_or_create(
        student=student,
        tutor=tutors[0],
        skill=skills["Physics"],
        availability=slots[2],
        defaults={
            "booking_date": slots[2].week_start_date + timedelta(days=slots[2].day_of_week),
            "start_time": slots[2].start_time,
            "end_time": slots[2].end_time,
            "status": "confirmed",
            "confirmed_at": timezone.now(),
        },
    )

    Review.objects.get_or_create(
        booking=completed_booking,
        defaults={
            "student": student,
            "tutor": tutors[0],
            "rating": 5,
            "comment": "Clear explanations and very helpful practice problems.",
        },
    )
    ReviewService.update_tutor_rating(tutors[0])

    if stdout:
        stdout.write(
            "Seeded YT2UTOR demo data: "
            f"{Skill.objects.count()} skills, "
            f"{User.objects.filter(email__endswith='@yt2utor.local').count()} demo users."
        )
