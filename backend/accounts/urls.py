from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import (
    LoginRefreshView,
    LoginView,
    RegisterView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    PasswordChangeView,
    AccountDeleteView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    # LoginView et non TokenObtainPairView : c'est elle qui porte le quota.
    path("login/", LoginView.as_view(), name="login"),
    # LoginRefreshView et non TokenRefreshView : elle répond 401, non 500, pour un compte supprimé.
    path("login/refresh/", LoginRefreshView.as_view(), name="login-refresh"),
    # Vue de simplejwt telle quelle : le refresh envoyé est la seule preuve exigée, rien à redéclarer.
    path("logout/", TokenBlacklistView.as_view(), name="logout"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    # Seules routes d'auth fermées au visiteur : apiFetch y joint le jeton (lib/api.ts).
    path("password-change/", PasswordChangeView.as_view(), name="password-change"),
    path("account/", AccountDeleteView.as_view(), name="account-delete"),
]