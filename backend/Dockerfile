# `docker build -t weeb-backend ./backend` — contexte backend/ : le .env de la
# racine en est hors et n'entre dans aucun layer. La seconde étape n'emporte
# que le venv, sans le cache de roues ni les outils de compilation.

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

# Hors de /app, que le développement recouvre de `./backend:/app`. Bit
# exécutable posé ici et non hérité : une extraction sans droits POSIX le perdrait.
COPY docker-entrypoint.sh healthcheck.py /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Sans --chown : le code reste à root, lisible mais pas modifiable par `weeb`.
# Une faille d'écriture ne peut pas réécrire une vue pour s'installer.
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
    CMD ["python", "/usr/local/bin/healthcheck.py"]

# Le script s'interpose devant toute commande et ne prépare que devant gunicorn :
# un `command:` qui relance gunicorn migre encore, `docker run <image> id -u` ne
# migre pas et se passe de --entrypoint.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# --workers 3 : point de départ, à porter à 2 × cœurs + 1. --no-control-socket :
# sans répertoire personnel où ouvrir ce socket, Gunicorn affichait une erreur
# à chaque démarrage. Journaux sur la sortie standard, où Docker les lit.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--no-control-socket", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
