from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import (
    ReviewRequestSerializer,
    ReviewResponseSerializer,
    TutorReviewsResponseSerializer,
)
from .services import ReviewService, ReviewAlreadyExists, CannotReviewBeforeCompletion
from django.core.exceptions import ObjectDoesNotExist


class CreateReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            review = ReviewService.create_review(
                student=request.user,
                booking_id=data["booking_id"],
                rating=data["rating"],
                comment=data.get("comment", "")
            )
        except ObjectDoesNotExist:
            return Response(
                {"error": "Booking not found.", "code": "BOOKING_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except PermissionError as e:
            return Response(
                {"error": str(e), "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except CannotReviewBeforeCompletion:
            return Response(
                {"error": "Session not completed.", "code": "SESSION_NOT_COMPLETED"},
                status=status.HTTP_409_CONFLICT,
            )
        except ReviewAlreadyExists:
            return Response(
                {"error": "Review already exists.", "code": "REVIEW_ALREADY_EXISTS"},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            ReviewResponseSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )


class TutorReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, tutor_id):
        try:
            data = ReviewService.get_tutor_reviews(tutor_id)
        except ObjectDoesNotExist:
            return Response(
                {"error": "Tutor not found.", "code": "TUTOR_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TutorReviewsResponseSerializer(data)
        return Response(serializer.data)
