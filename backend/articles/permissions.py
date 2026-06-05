from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Lecture autorisée à tous ; modification/suppression réservée au propriétaire."""

    def has_object_permission(self, request, view, obj):
        # GET, HEAD, OPTIONS = méthodes "sûres" (lecture) → toujours autorisées
        if request.method in permissions.SAFE_METHODS:
            return True
        # PUT / PATCH / DELETE → autorisé seulement si l'utilisateur est l'auteur
        return obj.author == request.user
