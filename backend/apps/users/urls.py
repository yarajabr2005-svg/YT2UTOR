from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    MeView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/password/", ChangePasswordView.as_view(), name="users-me-password"),
]
