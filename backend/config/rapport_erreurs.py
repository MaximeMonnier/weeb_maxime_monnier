"""Rapport des erreurs 500 sans donnée personnelle : il quitte le serveur par email."""

from django.views.debug import ExceptionReporter, SafeExceptionReporterFilter

# Les IP, posées par le nginx du serveur, et le Referer : sur la page de réinitialisation,
# il porte l'uid et le jeton encore valables, le front et l'API partageant l'origine.
EN_TETES_MASQUES = frozenset(
    {'REMOTE_ADDR', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_REFERER'}
)


class FiltreSansDonneesPersonnelles(SafeExceptionReporterFilter):
    """Masque toutes les valeurs du corps POST, les adresses IP du visiteur et le Referer."""

    def get_post_parameters(self, request):
        # Toutes les clés, pas une liste par vue : contact et réinitialisation portent
        # des emails, et `logout/` est la vue de simplejwt, qu'on ne décore pas.
        if request is None:
            return {}
        corps = request.POST.copy()
        for cle in corps:
            corps[cle] = self.cleansed_substitute
        return corps

    def get_safe_request_meta(self, request):
        meta = super().get_safe_request_meta(request)
        for cle in EN_TETES_MASQUES & meta.keys():
            meta[cle] = self.cleansed_substitute
        return meta


class RapportSansUtilisateur(ExceptionReporter):
    """Retire la ligne USER, que `CustomUser.__str__` remplit avec l'email du compte."""

    def get_traceback_data(self):
        donnees = super().get_traceback_data()
        donnees['user_str'] = None
        return donnees
