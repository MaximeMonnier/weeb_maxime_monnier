# Routes d'authentification (montées sous /api/auth/ par config/urls.py)
from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView
from .views import (
    LoginRefreshView,
    LoginView,
    RegisterView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    # LoginView et non TokenObtainPairView : c'est elle qui porte le quota.
    path("login/", LoginView.as_view(), name="login"),
    # LoginRefreshView et non TokenRefreshView : c'est elle qui répond 401, et non
    # 500, au refresh d'un compte supprimé.
    path("login/refresh/", LoginRefreshView.as_view(), name="login-refresh"),
    # Vue de simplejwt montée telle quelle : elle ne porte ni quota ni permission à
    # redéclarer. Le refresh envoyé est la seule preuve d'identité exigée, et le
    # mettre en liste noire est tout l'effet de la vue.
    path("logout/", TokenBlacklistView.as_view(), name="logout"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]