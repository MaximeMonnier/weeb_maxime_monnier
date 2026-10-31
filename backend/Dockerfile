# Contexte backend/ : le .env de la racine n'entre dans aucun layer.

FROM python:3.13-slim AS builder

# Un venv : tout sous un seul chemin, que l'étape suivante copie d'un bloc.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip \
 && pip install --no-cache-dir -r requirements.txt


FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=config.settings.production

RUN groupadd --system --gid 1001 weeb \
 && useradd --system --uid 1001 --gid weeb --no-create-home weeb

COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

# Hors de /app, que le développement recouvre ; bit posé ici, une extraction sans droits POSIX le perdrait.
COPY docker-entrypoint.sh healthcheck.py /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Sans --chown : le code reste à root, une faille d'écriture ne peut pas réécrire une vue.
COPY . .

# Seuls dossiers écrits à l'exécution (collectstatic, images envoyées) ; un volume neuf hérite de ces droits.
RUN mkdir -p /app/staticfiles /app/media && chown weeb:weeb /app/staticfiles /app/media

USER weeb

EXPOSE 8000

# start-period couvre les migrations et la collecte des statiques.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["python", "/usr/local/bin/healthcheck.py"]

# Ne prépare la base que devant gunicorn : `docker run <image> id -u` ne migre pas.
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# --workers : à porter à 2 × cœurs + 1. --no-control-socket : sans répertoire
# personnel, Gunicorn affichait une erreur à chaque démarrage.
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--no-control-socket", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
