#!/bin/sh
# ============================================
#  Démarrage du conteneur backend
# ============================================
# Prépare la base et les fichiers statiques, puis passe la main à la commande
# du conteneur (Gunicorn, définie par CMD dans le Dockerfile).

# -e : la moindre commande en échec arrête le script. Sans ça, un `migrate`
# raté serait suivi d'un Gunicorn qui démarre sur un schéma incomplet et
# renvoie des erreurs 500 en apparaissant sain.
set -e

# La préparation n'a lieu QUE si la commande demandée est le serveur
# d'application. Sans cette garde, `docker run <image> id -u` — ou n'importe
# quelle commande d'inspection — déclencherait une migration de base et
# échouerait faute de base joignable. À l'inverse d'un simple CMD, la garde
# tient aussi quand la commande est surchargée par un `command:` de Compose :
# elle voit `gunicorn` et prépare quand même.
case "$1" in
gunicorn)
    # Ces deux commandes passent par manage.py, dont le module de réglages par
    # défaut est `development`. C'est DJANGO_SETTINGS_MODULE, posé dans le
    # Dockerfile, qui impose `production` ici — sinon les migrations
    # tourneraient avec les réglages du poste de développement.

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
