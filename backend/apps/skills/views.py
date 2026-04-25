from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django.contrib.auth import get_user_model

from .serializers import (
    AddSkillRequestSerializer,
    EditSkillsRequestSerializer,
    TutorSkillResponseSerializer,
    UploadQualificationRequestSerializer,
    QualificationSerializer,
    QualificationVerifyRequestSerializer,
    SearchResultTutorSerializer,
    TutorPublicProfileSerializer,
    SkillSerializer,  # ⭐️ needed for predefined skills list
)
from .services import (
    TutorSkillService,
    QualificationService,
    SkillService,
    DuplicateSkillError,
    FileUploadError,
)
from .permissions import IsTutor, IsAdmin
from .models import Skill  # ⭐️ needed for predefined skills list

User = get_user_model()


# ⭐️ NEW — Predefined Skills Catalog
class SkillListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        skills = Skill.objects.all().order_by("name")
        return Response(
            SkillSerializer(skills, many=True).data,
            status=status.HTTP_200_OK,
        )


class AddTutorSkillsView(APIView):
    permission_classes = [IsAuthenticated, IsTutor]

    def post(self, request):
        serializer = AddSkillRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_skills = TutorSkillService.add_skills_for_tutor(
                tutor=request.user,
                skill_ids=serializer.validated_data["skill_ids"],
            )
        except DuplicateSkillError as e:
            return Response(
                {"error": str(e), "code": "DUPLICATE_SKILL_ERROR"},
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
            TutorSkillResponseSerializer(user_skills, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    def put(self, request):
        serializer = EditSkillsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user_skills = TutorSkillService.edit_skills_for_tutor(
                tutor=request.user,
                skill_ids=serializer.validated_data["skill_ids"],
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
            TutorSkillResponseSerializer(user_skills, many=True).data,
            status=status.HTTP_200_OK,
        )


class UploadQualificationView(APIView):
    permission_classes = [IsAuthenticated, IsTutor]

    def post(self, request):
        serializer = UploadQualificationRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        skill_id = serializer.validated_data["skill_id"]
        file = serializer.validated_data["file"]
        try:
            qualification = QualificationService.upload_qualification(
                tutor=request.user,
                skill_id=skill_id,
                file=file,
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
        except FileUploadError as e:
            return Response(
                {"error": str(e), "code": "UPLOAD_FAILED"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            QualificationSerializer(qualification).data,
            status=status.HTTP_201_CREATED,
        )


class DeleteQualificationView(APIView):
    permission_classes = [IsAuthenticated, IsTutor]

    def delete(self, request, qual_id):
        result = QualificationService.delete_qualification(request.user, qual_id)
        if result is None:
            return Response(
                {"error": "File not found.", "code": "FILE_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {"message": "File deleted successfully."},
            status=status.HTTP_200_OK,
        )


class PendingQualificationsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        pending = QualificationService.list_pending_qualifications()
        return Response(
            QualificationSerializer(pending, many=True).data,
            status=status.HTTP_200_OK,
        )


class QualificationVerifyView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, qual_id):
        serializer = QualificationVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        status_value = serializer.validated_data["status"]
        notes = serializer.validated_data.get("notes", "")

        try:
            qualification = QualificationService.verify_qualification(
                admin_user=request.user,
                qual_id=qual_id,
                status=status_value,
                notes=notes,
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
            QualificationSerializer(qualification).data,
            status=status.HTTP_200_OK,
        )


class SearchTutorsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        skill_name = request.query_params.get("skill", "").strip()
        tutor_name = request.query_params.get("name", "").strip()

        day = request.query_params.get("day")
        time = request.query_params.get("time")

        tutors = SkillService.search_tutors(
            skill_name=skill_name,
            tutor_name=tutor_name,
            day=day,
            time=time,
        )

        return Response(
            SearchResultTutorSerializer(tutors, many=True).data,
            status=status.HTTP_200_OK,
        )


class TutorPublicProfileView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, tutor_id):
        try:
            tutor = SkillService.get_tutor_public_profile(tutor_id)
        except ValueError as e:
            return Response(
                {"error": str(e), "code": "TUTOR_NOT_FOUND"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            TutorPublicProfileSerializer(tutor).data,
            status=status.HTTP_200_OK,
        )
