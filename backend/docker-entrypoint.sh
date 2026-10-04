#!/bin/sh
# Prépare la base et les statiques, puis passe la main à la commande du conteneur.

# -e : la moindre commande en échec arrête le script. Sans ça, un `migrate`
# raté serait suivi d'un Gunicorn qui démarre sur un schéma incomplet et
# renvoie des erreurs 500 en apparaissant sain.
set -e

# Ne prépare que devant gunicorn, même lancé par un `command:` de Compose : sans
# cette garde, `docker run <image> id -u` migrerait, et échouerait faute de base.
case "$1" in
gunicorn)
    # manage.py prend `development` par défaut : c'est le DJANGO_SETTINGS_MODULE
    # du Dockerfile qui impose `production` à ces deux commandes.

    echo "→ Application des migrations"
    # Migrer au démarrage suppose UN SEUL conteneur à la fois. Avec plusieurs
    # répliques lancées ensemble, sortir cette étape vers un job dédié.
    python manage.py migrate --noinput

    echo "→ Collecte des fichiers statiques"
    # --clear : sans lui, les fichiers d'une version précédente restant dans le
    # volume seraient servis à côté des nouveaux.
    python manage.py collectstatic --noinput --clear

    echo "→ Démarrage : $*"
    ;;
esac

# exec : la commande REMPLACE le shell et devient PID 1. Sans ça, Gunicorn ne
# recevrait pas le SIGTERM de `docker stop` et serait tué de force après le
# délai de grâce, sans terminer les requêtes en cours.
exec "$@"
