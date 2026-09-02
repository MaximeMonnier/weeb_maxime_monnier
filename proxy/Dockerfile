# ============================================
#  Image du terminateur TLS — projet Weeb
# ============================================
# Construction depuis la racine du dépôt :
#   docker build -t weeb-proxy ./proxy
# Le contexte est proxy/. Les certificats N'Y ENTRENT PAS : `.dockerignore` les
# exclut et Compose les monte au démarrage — une clé privée n'a sa place ni dans
# un layer, que `docker history` expose, ni dans un registre qui le distribue.
#
# Une seule étape : l'image ne fait que servir une configuration, il n'y a rien
# à construire dont il faudrait ensuite écarter l'outillage.

FROM nginx:1.27-alpine

# La configuration entière est remplacée, et non un fragment de conf.d : celle
# d'origine pose une directive `user` et son pid dans /var/run, deux choses
# interdites à un compte non privilégié.
COPY nginx.conf /etc/nginx/nginx.conf

# Compte fourni par l'image nginx. Tout ce que le serveur écrit — pid, tampons —
# a été renvoyé vers /tmp par nginx.conf, inscriptible par tous.
USER nginx

# 8080 et 8443, et non 80 et 443 : lier un port sous 1024 exige des privilèges.
# C'est Compose qui republie ces ports sur 80 et 443 côté machine.
EXPOSE 8080 8443

# Vise /healthz sur le port en clair : la racine y répond 301 vers HTTPS, que
# wget ne suit pas — le conteneur serait déclaré malade en permanence.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/healthz > /dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
