from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model

from apps.bookings.models import Booking
from apps.bookings.serializers import (
    BookingRequestSerializer,
    BookingResponseSerializer,
    BookingStatusResponseSerializer,
    BookingSummarySerializer,
)
from apps.bookings.services import (
    BookingService,
    AvailabilityServiceAdapter,
    BookingNotFoundError,
    SlotNotAvailableError,
    SlotAlreadyBookedError,
    InvalidStateTransitionError,
    CancellationWindowExpiredError,
    NoAvailabilityError,
)

User = get_user_model()


def get_booking_service() -> BookingService:
    # Dependency Injection (Design Pattern):
    # We inject AvailabilityServiceAdapter (and later NotificationService)
    availability_adapter = AvailabilityServiceAdapter()
    return BookingService(
        availability_service=availability_adapter,
        notification_service=None,  # will be wired in Notifications slice
    )


class BookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.role != "student":
            return Response(
                {"error": "Only students can create bookings.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = BookingRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        service = get_booking_service()

        try:
            booking = service.create_booking(
                student=request.user,
                tutor_id=serializer.validated_data["tutor_id"],
                skill_id=serializer.validated_data["skill_id"],
                availability_id=serializer.validated_data["availability_id"],
            )
        except NoAvailabilityError as e:
            return Response(
                {"error": str(e), "code": "NO_AVAILABILITY"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except SlotNotAvailableError as e:
            return Response(
                {"error": str(e), "code": "SLOT_NOT_AVAILABLE"},
                status=status.HTTP_409_CONFLICT,
            )
        except SlotAlreadyBookedError as e:
            return Response(
                {"error": str(e), "code": "SLOT_ALREADY_BOOKED"},
                status=status.HTTP_409_CONFLICT,
            )
        except PermissionError as e:
            return Response(
                {"error": str(e), "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ValueError as e:
            return Response(
                {"error": str(e), "code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            BookingResponseSerializer(booking).data,
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        service = get_booking_service()

        status_param = request.query_params.get("status")
        type_param = request.query_params.get("type")
        date_from_param = request.query_params.get("date_from")
        date_to_param = request.query_params.get("date_to")

        date_from = parse_date(date_from_param) if date_from_param else None
        date_to = parse_date(date_to_param) if date_to_param else None

        bookings = service.list_bookings(
            user=request.user,
            status=status_param,
            type_=type_param,
            date_from=date_from,
            date_to=date_to,
        )

        if not bookings.exists():
            # EF-04 / EF-08 No Bookings to Display
            return Response(
                {"message": "No bookings found."},
                status=status.HTTP_200_OK,
            )

        return Response(
            BookingSummarySerializer(bookings, many=True).data,
            status=status.HTTP_200_OK,
        )


class BookingConfirmView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        if request.user.role != "tutor":
            return Response(
                {"error": "Only tutors can confirm bookings.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        service = get_booking_service()

        try:
            booking = service.confirm_booking(booking_id=booking_id, tutor=request.user)
        except BookingNotFoundError as e:
            return Response(
                {"error": str(e), "code": "BOOKING_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except InvalidStateTransitionError as e:
            return Response(
                {"error": str(e), "code": "INVALID_STATE_TRANSITION"},
                status=status.HTTP_409_CONFLICT,
            )
        except PermissionError as e:
            return Response(
                {"error": str(e), "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            BookingStatusResponseSerializer(booking).data,
            status=status.HTTP_200_OK,
        )


class BookingRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        if request.user.role != "tutor":
            return Response(
                {"error": "Only tutors can reject bookings.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        service = get_booking_service()

        try:
            booking = service.reject_booking(booking_id=booking_id, tutor=request.user)
        except BookingNotFoundError as e:
            return Response(
                {"error": str(e), "code": "BOOKING_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except InvalidStateTransitionError as e:
            return Response(
                {"error": str(e), "code": "INVALID_STATE_TRANSITION"},
                status=status.HTTP_409_CONFLICT,
            )
        except PermissionError as e:
            return Response(
                {"error": str(e), "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            BookingStatusResponseSerializer(booking).data,
            status=status.HTTP_200_OK,
        )


class BookingCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        service = get_booking_service()

        try:
            booking = service.cancel_booking(booking_id=booking_id, actor=request.user)
        except BookingNotFoundError as e:
            return Response(
                {"error": str(e), "code": "BOOKING_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except CancellationWindowExpiredError:
            return Response(
                {
                    "error": "Confirmed bookings cannot be canceled within 24 hours of the session. Please contact the tutor directly.",
                    "code": "CANCELLATION_WINDOW_EXPIRED",
                },
                status=status.HTTP_409_CONFLICT,
            )
        except InvalidStateTransitionError as e:
            return Response(
                {"error": str(e), "code": "INVALID_STATE_TRANSITION"},
                status=status.HTTP_409_CONFLICT,
            )
        except PermissionError as e:
            return Response(
                {"error": str(e), "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            BookingStatusResponseSerializer(booking).data,
            status=status.HTTP_200_OK,
        )


class BookingCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):
        if request.user.role != "tutor":
            return Response(
                {"error": "Only tutors can complete bookings.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        service = get_booking_service()

        try:
            booking = service.complete_booking(booking_id=booking_id, tutor=request.user)
        except BookingNotFoundError as e:
            return Response(
                {"error": str(e), "code": "BOOKING_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except InvalidStateTransitionError as e:
            return Response(
                {"error": str(e), "code": "INVALID_STATE_TRANSITION"},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            BookingStatusResponseSerializer(booking).data,
            status=status.HTTP_200_OK,
        )
