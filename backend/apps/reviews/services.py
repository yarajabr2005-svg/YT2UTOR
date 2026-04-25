from dataclasses import dataclass
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist
from django.db import models

from apps.reviews.models import Review
from apps.bookings.models import Booking
from apps.users.models import User

# Domain Exceptions (from your error table)
class ReviewAlreadyExists(Exception):
    pass

class CannotReviewBeforeCompletion(Exception):
    pass


@dataclass
class ReviewService:

    @staticmethod
    @transaction.atomic
    def create_review(student: User, booking_id: str, rating: int, comment: str = "") -> Review:
        # 1. Validate booking exists
        try:
            booking = Booking.objects.select_for_update().get(id=booking_id)
        except Booking.DoesNotExist:
            raise ObjectDoesNotExist("Booking not found.")

        # 2. Validate booking belongs to this student
        if booking.student_id != student.id:
            raise PermissionError("You cannot review a booking that is not yours.")

        # 3. Validate booking is completed
        if booking.status != "completed":
            raise CannotReviewBeforeCompletion("Session not completed yet.")

        # 4. Validate no existing review
        if Review.objects.filter(booking=booking).exists():
            raise ReviewAlreadyExists("Review already exists for this booking.")

        # 5. Create review
        review = Review.objects.create(
            booking=booking,
            student=student,
            tutor=booking.tutor,
            rating=rating,
            comment=comment,
        )

        # 6. Update tutor rating stats
        ReviewService.update_tutor_rating(booking.tutor)

        return review

    @staticmethod
    def update_tutor_rating(tutor: User):
        reviews = Review.objects.filter(tutor=tutor)

        tutor.total_reviews = reviews.count()
        tutor.average_rating = (
            reviews.aggregate(avg=models.Avg("rating"))["avg"] or 0
        )
        tutor.save()

    @staticmethod
    def get_tutor_reviews(tutor_id: str):
        tutor = User.objects.get(id=tutor_id, role="tutor")

        reviews = Review.objects.filter(tutor=tutor).order_by("-created_at")

        return {
            "tutor_id": tutor.id,
            "average_rating": tutor.average_rating or 0,
            "total_reviews": tutor.total_reviews or 0,
            "reviews": reviews,
        }
