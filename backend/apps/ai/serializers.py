from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.users.picture_url import build_profile_picture_url

User = get_user_model()


class AIRecommendRequestSerializer(serializers.Serializer):
    query = serializers.CharField()
    day = serializers.IntegerField(min_value=0, max_value=6, required=False)
    time = serializers.TimeField(required=False)
    skill_id = serializers.IntegerField(required=False)  # kept for frontend compat, ignored


class TutorRecommendationSerializer(serializers.ModelSerializer):
    similarity = serializers.SerializerMethodField()
    urgency_boost = serializers.SerializerMethodField()
    rating_boost = serializers.SerializerMethodField()
    final_score = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "bio",
            "profile_picture_url",
            "average_rating",
            "total_reviews",
            "similarity",
            "urgency_boost",
            "rating_boost",
            "final_score",
            "skills",
        ]

    def get_profile_picture_url(self, obj):
        return build_profile_picture_url(obj, self.context.get("request"))

    def get_similarity(self, obj):
        return self.context.get("similarity", 0.0)

    def get_urgency_boost(self, obj):
        return self.context.get("urgency_boost", 0.0)

    def get_rating_boost(self, obj):
        return self.context.get("rating_boost", 0.0)

    def get_final_score(self, obj):
        return self.context.get("final_score", 0.0)

    def get_skills(self, obj):
        from apps.skills.models import UserSkill
        user_skills = UserSkill.objects.filter(
            user=obj, skill_type="teaches"
        ).select_related("skill")
        return [
            {"id": us.skill.id, "name": us.skill.name}
            for us in user_skills
        ]


class AIRecommendResponseSerializer(serializers.Serializer):
    tutors = TutorRecommendationSerializer(many=True)
