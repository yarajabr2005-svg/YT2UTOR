from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    MeView,
    MeAvatarView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    LogoutView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="auth-password-reset-confirm"),
    path("users/me/", MeView.as_view(), name="users-me"),
    path("users/me/avatar/", MeAvatarView.as_view(), name="users-me-avatar"),
    path("users/me/password/", ChangePasswordView.as_view(), name="users-me-password"),
]

urlpatterns += [
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
]
