# Routes d'authentification (montées sous /api/auth/ par config/urls.py)
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    RegisterView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    # LoginView et non TokenObtainPairView : c'est elle qui porte le quota.
    path("login/", LoginView.as_view(), name="login"),
    path("login/refresh/", TokenRefreshView.as_view(), name="login-refresh"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]