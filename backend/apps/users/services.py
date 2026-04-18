from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class UserService:
    @staticmethod
    def create_user(validated_data):
        return User.objects.create_user(
            email=validated_data["email"],
            username=validated_data.get("username") or validated_data["email"],
            password=validated_data["password"],
            role=validated_data.get("role", "student"),
            bio=validated_data.get("bio", ""),
        )

    @staticmethod
    def generate_tokens_for_user(user: User):
        refresh = RefreshToken.for_user(user)
        return {"access": str(refresh.access_token), "refresh": str(refresh)}

    @staticmethod
    def change_password(user: User, old_password: str, new_password: str):
        if not user.check_password(old_password):
            raise ValueError("Old password is incorrect.")
        user.set_password(new_password)
        user.save()

    @staticmethod
    def request_password_reset(email: str):
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_BASE_URL}/reset-password?uid={uid}&token={token}"
        send_mail(
            subject="Password Reset Request",
            message="Click link: " + reset_link,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )


    @staticmethod
    def reset_password(uid, token, new_password):
        try:
            # Decode UID correctly for UUID primary keys
            user_id = force_str(urlsafe_base64_decode(uid)).strip()

            import uuid
            user = User.objects.get(pk=uuid.UUID(user_id))

        except Exception:
            raise ValueError("Invalid reset link.")

        if not default_token_generator.check_token(user, token):
            raise ValueError("Invalid or expired token.")

        user.set_password(new_password)
        user.save()
