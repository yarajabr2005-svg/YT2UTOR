from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers, validators
from .models import User
from .picture_url import build_profile_picture_url


class UserResponseSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "username", "role", "bio", "profile_picture_url",
            "average_rating", "total_reviews", "verified",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "average_rating", "total_reviews",
            "verified", "created_at", "updated_at",
        ]

    def get_profile_picture_url(self, obj):
        return build_profile_picture_url(obj, self.context.get("request"))


class RegisterRequestSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(
        validators=[validators.UniqueValidator(queryset=User.objects.all())]
    )

    class Meta:
        model = User
        fields = ["email", "username", "password", "role", "bio"]

    def validate(self, data):
        if data.get("role") == "tutor" and not data.get("bio"):
            raise serializers.ValidationError({"bio": "A bio is required for Tutor registration."})
        return data

    def create(self, validated_data):
        from apps.users.services import UserService
        return UserService.create_user(validated_data)


class LoginRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs.get("email"), password=attrs.get("password"))
        if not user:
            raise serializers.ValidationError(_("Invalid email or password."))
        attrs["user"] = user
        return attrs


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserResponseSerializer()


class UpdateProfileRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150)

    class Meta:
        model = User
        fields = ["username", "bio"]

    def validate(self, data):
        if self.instance.role == "tutor" and "bio" in data and not data["bio"]:
            raise serializers.ValidationError({"bio": "Tutors cannot have an empty bio."})
        return data

    def validate_username(self, value):
        if User.objects.exclude(pk=self.instance.pk).filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmRequestSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class ChangePasswordRequestSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value
