from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ai.serializers import (
    AIRecommendRequestSerializer,
    TutorRecommendationSerializer,
)
from apps.ai.services import AIService

User = get_user_model()


class AIRecommendView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != "student":
            return Response(
                {"error": "Only students can request AI recommendations.", "code": "PERMISSION_DENIED"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AIRecommendRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        query = serializer.validated_data["query"]
        day = serializer.validated_data.get("day")
        time_value = serializer.validated_data.get("time")
        skill_id = serializer.validated_data.get("skill_id")

        recommendations = AIService.recommend_tutors(
            query=query,
            day=day,
            time_value=time_value,
            skill_id=skill_id,
        )

        tutors_data = []
        for rec in recommendations:
            tutor = rec["tutor"]
            tutor_data = TutorRecommendationSerializer(
                tutor,
                context={
                    "similarity": rec["similarity"],
                    "rating_boost": rec["rating_boost"],
                    "urgency_boost": rec["urgency_boost"],
                    "final_score": rec["final_score"],
                },
            ).data
            tutors_data.append(tutor_data)

        # Frontend expects "recommendations" key
        return Response({"recommendations": tutors_data}, status=status.HTTP_200_OK)
