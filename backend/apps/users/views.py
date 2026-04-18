from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .serializers import (
    RegisterRequestSerializer, UserResponseSerializer, 
    LoginRequestSerializer, LoginResponseSerializer,
    UpdateProfileRequestSerializer, ChangePasswordRequestSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmRequestSerializer
)
from apps.users.services import UserService

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserResponseSerializer(user).data, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        tokens = UserService.generate_tokens_for_user(user)
        return Response(LoginResponseSerializer({"access": tokens["access"], "refresh": tokens["refresh"], "user": user}).data)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserResponseSerializer(request.user).data)
    def put(self, request):
        serializer = UpdateProfileRequestSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserResponseSerializer(user).data)

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]
    def put(self, request):
        serializer = ChangePasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            UserService.change_password(request.user, serializer.validated_data["old_password"], serializer.validated_data["new_password"])
            return Response({"message": "Password changed successfully."})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        UserService.request_password_reset(serializer.validated_data["email"])
        return Response({"message": "Reset link sent."})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = PasswordResetConfirmRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            UserService.reset_password(serializer.validated_data["uid"], serializer.validated_data["token"], serializer.validated_data["new_password"])
            return Response({"message": "Password reset success."})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
