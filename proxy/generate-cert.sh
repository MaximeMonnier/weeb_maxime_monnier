#!/bin/sh
# ============================================
#  Certificat TLS du proxy de production
# ============================================
# À lancer une fois par machine, avant le premier démarrage de la production :
#   ./proxy/generate-cert.sh
#
# Le certificat produit N'EST PAS versionné (couvert par .gitignore) : chaque
# machine génère le sien. Let's Encrypt est hors sujet tant qu'aucun domaine
# réel n'existe — il valide un nom public, pas `localhost`.

set -e

CERT_DIR="$(cd "$(dirname "$0")" && pwd)/certs"
CRT="$CERT_DIR/localhost.crt"
KEY="$CERT_DIR/localhost.key"

mkdir -p "$CERT_DIR"

# Ne rien écraser sans le dire : un certificat régénéré oblige à refranchir
# l'avertissement du navigateur, et à réaccepter l'ancien s'il était épinglé.
if [ -f "$CRT" ] && [ -f "$KEY" ]; then
    echo "→ Certificat déjà présent : $CRT"
    echo "  Le supprimer d'abord pour en régénérer un."
    exit 0
fi

if command -v mkcert > /dev/null 2>&1; then
    # mkcert signe avec une autorité locale déjà installée dans le magasin du
    # système et des navigateurs : aucune page d'avertissement.
    echo "→ mkcert trouvé : certificat accepté par le navigateur, sans avertissement."
    mkcert -cert-file "$CRT" -key-file "$KEY" localhost 127.0.0.1 ::1
else
    echo "→ mkcert absent, repli sur openssl : certificat AUTO-SIGNÉ."
    echo "  Le navigateur affichera un avertissement, à franchir une fois."
    echo "  Installer mkcert (https://github.com/FiloSottile/mkcert) l'évite."
    # subjectAltName et non le seul CN : les navigateurs ignorent le CN depuis
    # des années et refusent un certificat sans SAN correspondant à l'adresse.
    openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
        -keyout "$KEY" -out "$CRT" \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:0:0:0:0:0:0:0:1"
fi

# 0644 sur la clé, et c'est délibéré : le compte `nginx` du conteneur (uid 101)
# ne partage aucun groupe avec l'utilisateur de la machine et ne pourrait pas la
# lire en 0600 à travers le montage. Acceptable ICI, pour un certificat de poste
# qui ne protège rien de réel. Un vrai certificat ne se monte pas ainsi : il
# passe par un secret Docker, ou par un volume dont le propriétaire correspond à
# l'uid du conteneur.
chmod 644 "$CRT" "$KEY"

echo "→ Écrit : $CRT"
echo "→ Écrit : $KEY"
