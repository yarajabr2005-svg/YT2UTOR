from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.skills.permissions import IsTutor
from .serializers import (
    AvailabilitySlotSerializer,
    CreateAvailabilityRequestSerializer,
    UpdateAvailabilityRequestSerializer,
)
from .services import (
    AvailabilityService,
    OverlappingSlotError,
    InvalidTimeRangeError,
    SlotHasBookingsError,
)

User = get_user_model()


class TutorAvailabilityListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, tutor_id):
        try:
            slots = AvailabilityService.get_by_tutor(tutor_id=tutor_id)
        except ValueError as e:
            return Response(
                {"error": str(e), "code": "TUTOR_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            AvailabilitySlotSerializer(slots, many=True).data,
            status=status.HTTP_200_OK,
        )


class CreateAvailabilityView(APIView):
    permission_classes = [IsAuthenticated, IsTutor]

    def post(self, request):
        serializer = CreateAvailabilityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        week_start_date = serializer.validated_data["week_start_date"]
        slots_data = serializer.validated_data["slots"]

        try:
            slots = AvailabilityService.create_slots(
                tutor=request.user,
                week_start_date=week_start_date,
                slots_data=slots_data,
            )
        except InvalidTimeRangeError as e:
            return Response(
                {"error": str(e), "code": "INVALID_TIME_RANGE"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OverlappingSlotError as e:
            return Response(
                {"error": str(e), "code": "OVERLAPPING_SLOTS"},
                status=status.HTTP_409_CONFLICT,
            )
        except ValueError as e:
            return Response(
                {"error": str(e), "code": "VALIDATION_ERROR"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            AvailabilitySlotSerializer(slots, many=True).data,
            status=status.HTTP_201_CREATED,
        )


# FIX 1 — merged PUT + DELETE into one view
class AvailabilityDetailView(APIView):
    permission_classes = [IsAuthenticated, IsTutor]

    def put(self, request, slot_id):
        serializer = UpdateAvailabilityRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            slot = AvailabilityService.update_slot(
                tutor=request.user,
                slot_id=slot_id,
                data=serializer.validated_data,
            )
        except ValueError as e:
            msg = str(e)
            code = "AVAILABILITY_NOT_FOUND" if "not found" in msg else "VALIDATION_ERROR"
            status_code = (
                status.HTTP_404_NOT_FOUND
                if code == "AVAILABILITY_NOT_FOUND"
                else status.HTTP_400_BAD_REQUEST
            )
            return Response({"error": msg, "code": code}, status=status_code)
        except InvalidTimeRangeError as e:
            return Response(
                {"error": str(e), "code": "INVALID_TIME_RANGE"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except OverlappingSlotError as e:
            return Response(
                {"error": str(e), "code": "OVERLAPPING_SLOTS"},
                status=status.HTTP_409_CONFLICT,
            )
        except SlotHasBookingsError as e:
            return Response(
                {"error": str(e), "code": "AVAILABILITY_HAS_BOOKINGS"},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            AvailabilitySlotSerializer(slot).data,
            status=status.HTTP_200_OK,
        )
    
    def delete(self, request, slot_id):
        try:
            AvailabilityService.delete_slot(
                tutor=request.user,
                slot_id=slot_id,
            )
        except ValueError as e:
            return Response(
                {"error": str(e), "code": "AVAILABILITY_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except SlotHasBookingsError as e:
            return Response(
                {"error": str(e), "code": "AVAILABILITY_HAS_BOOKINGS"},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {"message": "Availability deleted successfully."},
            status=status.HTTP_200_OK,
        )