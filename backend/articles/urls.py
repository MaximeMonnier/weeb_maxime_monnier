# Routes du CRUD articles générées par le router DRF (/api/articles/ et /api/articles/{id}/)
from rest_framework.routers import DefaultRouter
from .views import ArticleViewSet

router = DefaultRouter()
router.register(r"articles", ArticleViewSet, basename="article")

urlpatterns = router.urls
