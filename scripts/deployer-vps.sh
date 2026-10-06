#!/usr/bin/env bash
# Met en ligne sur le VPS le commit de main dont le SHA est passé en argument.
# Seule commande que la clé de déploiement peut lancer — README, § « Déploiement automatique ».

set -euo pipefail

# Tout le corps dans une fonction : bash la lit en entier avant d'exécuter, et le
# `git merge` qui réécrit ce fichier ne change pas le script en cours de route.
deployer() {
    local sha="${1:-}"
    if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
        echo "Attendu : le SHA complet d'un commit, reçu « $sha »." >&2
        exit 2
    fi

    cd "$(dirname "$0")/.."

    echo "→ Mise à jour du clone sur $sha"
    git fetch --quiet origin main
    git merge --ff-only --quiet "$sha"

    # Écrit dans le .env et non passé à la commande : un `docker compose up` lancé
    # plus tard à la main garde ainsi la version en ligne.
    if grep -q '^IMAGE_TAG=' .env; then
        sed -i "s/^IMAGE_TAG=.*/IMAGE_TAG=$sha/" .env
    else
        echo "IMAGE_TAG=$sha" >> .env
    fi

    echo "→ Téléchargement des images"
    docker compose pull --quiet

    echo "→ Démarrage"
    if ! docker compose up -d --no-build --wait --wait-timeout 60; then
        docker compose ps --all
        docker compose logs --tail 80 backend
        exit 1
    fi

    docker compose images
}

deployer "$@"
