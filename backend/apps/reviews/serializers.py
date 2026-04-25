from rest_framework import serializers
from apps.reviews.models import Review
from apps.bookings.models import Booking
from django.contrib.auth import get_user_model

User = get_user_model()


class ReviewRequestSerializer(serializers.Serializer):
    booking_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class ReviewResponseSerializer(serializers.ModelSerializer):
    booking_id = serializers.UUIDField(source="booking.id")
    student_id = serializers.UUIDField(source="student.id")
    tutor_id = serializers.UUIDField(source="tutor.id")

    class Meta:
        model = Review
        fields = [
            "id",
            "booking_id",
            "student_id",
            "tutor_id",
            "rating",
            "comment",
            "created_at",
        ]


class TutorReviewItemSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.username")

    class Meta:
        model = Review
        fields = ["id", "rating", "comment", "student_name", "created_at"]


class TutorReviewsResponseSerializer(serializers.Serializer):
    tutor_id = serializers.UUIDField()
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2)
    total_reviews = serializers.IntegerField()
    reviews = TutorReviewItemSerializer(many=True)
