from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.skills.models import UserSkill

User = get_user_model()


class RecommendTutorsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        requested_skill = (
            request.data.get("skill")
            or request.data.get("skill_name")
            or request.data.get("query")
            or ""
        )
        requested_skill_id = request.data.get("skill_id")

        tutor_skills = UserSkill.objects.filter(skill_type="teaches").select_related("skill")
        tutors = (
            User.objects.filter(role="tutor")
            .prefetch_related(Prefetch("userskill_set", queryset=tutor_skills))
            .order_by("-average_rating", "-total_reviews", "username")
        )

        if requested_skill_id:
            tutors = tutors.filter(
                userskill__skill_id=requested_skill_id,
                userskill__skill_type="teaches",
            ).distinct()
        elif requested_skill:
            tutors = tutors.filter(
                userskill__skill__name__icontains=requested_skill,
                userskill__skill_type="teaches",
            ).distinct()

        recommendations = []
        for tutor in tutors[:3]:
            skills = [user_skill.skill.name for user_skill in tutor.userskill_set.all()]
            matched_skill = requested_skill or (skills[0] if skills else "your learning goal")
            recommendations.append(
                {
                    "id": str(tutor.id),
                    "username": tutor.username,
                    "bio": tutor.bio,
                    "average_rating": tutor.average_rating,
                    "total_reviews": tutor.total_reviews,
                    "skills": skills,
                    "reason": f"Mock match: {tutor.username} teaches {matched_skill}.",
                }
            )

        return Response(
            {"recommendations": recommendations, "mode": "mock"},
            status=status.HTTP_200_OK,
        )
