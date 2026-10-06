"""Rapport des erreurs 500 sans donnée personnelle : il quitte le serveur par email."""

from django.views.debug import ExceptionReporter, SafeExceptionReporterFilter

# Posés par le nginx du serveur ; REMOTE_ADDR est celle du proxy ou du visiteur.
EN_TETES_D_IP = frozenset({'REMOTE_ADDR', 'HTTP_X_REAL_IP', 'HTTP_X_FORWARDED_FOR'})


class FiltreSansDonneesPersonnelles(SafeExceptionReporterFilter):
    """Masque toutes les valeurs du corps POST et les adresses IP du visiteur."""

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
        for cle in EN_TETES_D_IP & meta.keys():
            meta[cle] = self.cleansed_substitute
        return meta


class RapportSansUtilisateur(ExceptionReporter):
    """Retire la ligne USER, que `CustomUser.__str__` remplit avec l'email du compte."""

    def get_traceback_data(self):
        donnees = super().get_traceback_data()
        donnees['user_str'] = None
        return donnees
