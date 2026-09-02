# ============================================
#  Image du backend Django — projet Weeb
# ============================================
# Construction depuis la racine du dépôt :
#   docker build -t weeb-backend ./backend
# Le contexte est backend/ : le .env de la racine en est HORS, et ne peut donc
# entrer dans aucun layer, ni apparaître dans `docker history`.
#
# Build en deux temps. Le premier installe les dépendances, le second n'emporte
# que leur résultat : ni pip, ni cache de roues, ni chaîne de compilation ne
# survivent dans l'image livrée.

# ---------- Étape 1 : construction des dépendances ----------
FROM python:3.13-slim AS builder

# Un venv plutôt qu'une installation dans le Python du système : il rassemble
# tout ce qui est installé sous un seul chemin, que l'étape suivante copie d'un
# bloc, sans avoir à deviner où pip a rangé quoi.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Seul requirements.txt est copié ici, pas le code : ce layer n'est reconstruit
# que si les dépendances changent. Copier le code d'abord ferait réinstaller
# Django à chaque virgule modifiée dans une vue.
COPY requirements.txt .

# --no-cache-dir : le cache de pip ne sert à rien dans un layer figé et pèse
# plusieurs dizaines de mégaoctets. Il resterait dans l'étape de build, mais
# autant ne pas le produire.
RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt


# ---------- Étape 2 : image finale ----------
FROM python:3.13-slim AS runtime

# PYTHONDONTWRITEBYTECODE : pas de .pyc dans un système de fichiers en lecture
# quasi seule. PYTHONUNBUFFERED : les logs partent immédiatement vers Docker,
# au lieu d'être retenus dans un tampon jusqu'à ce qu'il soit plein.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=config.settings.production

# Compte de service dédié, créé avant tout COPY pour que son layer soit stable.
# `--system` : pas de mot de passe, pas de vieillissement de compte.
RUN groupadd --system --gid 1001 weeb \
 && useradd --system --uid 1001 --gid weeb --no-create-home weeb

# Les dépendances arrivent avant le code, dans cet ordre précis : modifier un
# fichier Python n'invalide alors que le COPY suivant, jamais celui-ci.
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

# Sans --chown : le code reste la propriété de root, donc lisible et exécutable
# par `weeb`, mais pas modifiable par lui. Une faille permettant l'écriture
# arbitraire dans le processus ne peut alors pas réécrire une vue ou le script
# de démarrage pour se rendre persistante.
COPY . .

# Seule exception, et seul dossier écrit à l'exécution : collectstatic remplit
# STATIC_ROOT (/app/staticfiles) au démarrage, sous l'identité de `weeb`.
RUN mkdir -p /app/staticfiles && chown weeb:weeb /app/staticfiles

# Tout ce qui suit s'exécute sans privilèges. Une faille dans une dépendance
# ne donne alors pas les droits root sur le conteneur.
USER weeb

# Documentaire : EXPOSE ne publie rien, il déclare le port écouté.
EXPOSE 8000

# start-period couvre les migrations et la collecte des statiques, pendant
# lesquelles les échecs ne sont pas comptabilisés.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["python", "/app/healthcheck.py"]

# Le script d'entrée est placé en CMD, et non en ENTRYPOINT. Un ENTRYPOINT
# s'exécuterait AVANT toute commande passée à `docker run`, y compris un simple
# `docker run <image> id -u` : la sonde d'inspection déclencherait alors une
# migration de base et échouerait faute de base joignable. En CMD, une commande
# donnée en ligne de commande remplace le tout — l'image reste inspectable —
# tandis qu'un `docker run <image>` sans argument prépare bien la base avant de
# servir. Contrepartie assumée : `docker run <image> python manage.py shell`
# saute la préparation, ce qui est de toute façon le comportement voulu.
#
# --workers 3 : point de départ raisonnable pour deux cœurs. À ajuster selon la
# machine, avec la formule usuelle (2 × cœurs + 1).
# --access-logfile - : les journaux d'accès vont sur la sortie standard, là où
# Docker les récupère, au lieu d'un fichier que personne ne lira dans l'image.
# --no-control-socket : Gunicorn ouvre par défaut un socket d'administration
# sous ~/.gunicorn. Le compte de service n'a pas de répertoire personnel, ce
# qui produisait une erreur à chaque démarrage — et ce socket ne sert à rien
# ici, où l'on pilote le processus par `docker restart`, pas par une commande
# locale.
CMD ["/app/docker-entrypoint.sh", \
     "gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--no-control-socket", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
