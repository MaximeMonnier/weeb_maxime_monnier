# Route du formulaire de contact (montée sous /api/ par config/urls.py)
from django.urls import path
from .views import ContactCreateView

urlpatterns = [
    path("contact/", ContactCreateView.as_view(), name="contact"),
]
