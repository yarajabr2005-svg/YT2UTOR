from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Skill, UserSkill, Qualification

User = get_user_model()


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name", "category"]


class AddSkillRequestSerializer(serializers.Serializer):
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        help_text="List of Skill IDs to add to the tutor profile.",
    )

    def validate_skill_ids(self, value):
        if not value:
            raise serializers.ValidationError("Please select at least one skill.")
        return value


class EditSkillsRequestSerializer(serializers.Serializer):
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
        help_text="Final list of Skill IDs for the tutor profile.",
    )

    def validate_skill_ids(self, value):
        if not value:
            raise serializers.ValidationError("Please select at least one skill.")
        return value


class TutorSkillResponseSerializer(serializers.ModelSerializer):
    skill = SkillSerializer()

    class Meta:
        model = UserSkill
        fields = ["id", "skill", "skill_type", "created_at"]


class UploadQualificationRequestSerializer(serializers.Serializer):
    skill_id = serializers.IntegerField()
    file = serializers.FileField()

    def validate(self, attrs):
        file = attrs.get("file")
        if not file:
            raise serializers.ValidationError({"file": "No file selected."})

        max_size = 5 * 1024 * 1024
        if file.size > max_size:
            raise serializers.ValidationError({"file": "File too large. Max 5MB."})

        allowed_extensions = ["pdf", "jpg", "jpeg", "png"]
        name = file.name or ""
        if "." not in name:
            raise serializers.ValidationError({"file": "Invalid file type."})
        ext = name.rsplit(".", 1)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError({"file": "Only PDF, JPG, PNG allowed."})

        return attrs


class QualificationSerializer(serializers.ModelSerializer):
    skill = SkillSerializer()
    tutor_id = serializers.UUIDField(source="tutor.id", read_only=True)

    class Meta:
        model = Qualification
        fields = [
            "id",
            "tutor_id",
            "skill",
            "file_url",
            "file_name",
            "file_size",
            "status",
            "notes",
            "uploaded_at",
            "reviewed_at",
        ]


class QualificationVerifyRequestSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=["approved", "rejected"])
    notes = serializers.CharField(allow_blank=True, required=False)


# ⭐️ FIX APPLIED HERE — clean skill fetching
class SearchResultTutorSerializer(serializers.ModelSerializer):
    skills = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "bio",
            "profile_picture_url",
            "average_rating",
            "total_reviews",
            "skills",
        ]

    def get_skills(self, obj):
        return SkillSerializer(
            [us.skill for us in obj.userskill_set.all()],
            many=True
        ).data


class TutorPublicProfileSerializer(serializers.ModelSerializer):
    skills = SkillSerializer(many=True)
    qualifications = QualificationSerializer(many=True)

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
            "verified",
            "skills",
            "qualifications",
        ]