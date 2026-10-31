#!/bin/sh
# Sans -e, un `migrate` raté laisserait Gunicorn démarrer sur un schéma incomplet, l'air sain.
set -e

# Garde : `docker run <image> id -u` ne doit pas migrer, faute de base.
case "$1" in
gunicorn)
    echo "→ Application des migrations"
    # Un seul conteneur à la fois : avec plusieurs répliques, sortir cette étape vers un job dédié.
    python manage.py migrate --noinput

    echo "→ Table des quotas"
    python manage.py createcachetable

    echo "→ Collecte des fichiers statiques"
    # --clear : sinon les fichiers d'une version précédente restent servis dans le volume.
    python manage.py collectstatic --noinput --clear

    echo "→ Démarrage : $*"
    ;;
esac

# exec : Gunicorn devient PID 1 et reçoit le SIGTERM de `docker stop`.
exec "$@"
