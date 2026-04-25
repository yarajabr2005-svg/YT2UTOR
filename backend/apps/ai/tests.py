from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.skills.models import Skill, UserSkill

User = get_user_model()


class RecommendTutorsViewTests(APITestCase):
    def test_recommend_returns_top_three_mock_tutor_summaries(self):
        student = User.objects.create_user(
            email="student@example.com",
            username="student",
            password="pass",
            role="student",
        )
        python = Skill.objects.create(name="Python", category="Programming")

        for index, rating in enumerate(["4.10", "4.90", "4.40", "4.70"], start=1):
            tutor = User.objects.create_user(
                email=f"tutor{index}@example.com",
                username=f"tutor{index}",
                password="pass",
                role="tutor",
                bio=f"Bio {index}",
                average_rating=Decimal(rating),
                total_reviews=index,
            )
            UserSkill.objects.create(user=tutor, skill=python, skill_type="teaches")

        self.client.force_authenticate(student)
        response = self.client.post(
            "/api/ai/recommend/",
            {"skill_id": python.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["mode"], "mock")
        self.assertEqual(len(response.data["recommendations"]), 3)
        self.assertEqual(
            set(response.data["recommendations"][0].keys()),
            {
                "id",
                "username",
                "bio",
                "average_rating",
                "total_reviews",
                "skills",
                "reason",
            },
        )
        self.assertEqual(response.data["recommendations"][0]["username"], "tutor2")
