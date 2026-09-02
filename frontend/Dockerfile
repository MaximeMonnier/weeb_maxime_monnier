# Deux images dans un fichier, choisies par --target :
#   docker build --target dev  -t weeb-frontend-dev ./frontend
#   docker build --target prod -t weeb-frontend --build-arg VITE_API_URL=... ./frontend
# Étapes, montages et arguments détaillés dans le README.

# ---------- Dépendances, communes aux deux images ----------
FROM node:22-alpine AS deps

WORKDIR /app

# /app appartient à node AVANT l'installation : Vite écrit son cache dans
# node_modules/.vite, et échouerait sur un dossier appartenant à root.
RUN chown node:node /app
USER node

# Les manifestes avant le code : modifier un composant ne relance pas npm ci.
COPY --chown=node:node package.json package-lock.json ./

# npm ci et non install : il respecte le verrou au lieu de le réécrire.
RUN npm ci --no-audit --no-fund


# ---------- dev : serveur Vite et rechargement à chaud ----------
FROM deps AS dev

# DEV_POLLING est lu par vite.config.ts.
ENV NODE_ENV=development \
    DEV_POLLING=1

COPY --chown=node:node . .

EXPOSE 5173

# La sonde dit que Vite répond, pas que l'application marche : voir le README.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:5173/ > /dev/null 2>&1 || exit 1

# Vite appelé directement, pas par npm : npm resterait le processus n° 1 sans
# transmettre SIGTERM, et chaque `docker stop` attendrait dix secondes.
# --host : sinon Vite n'écoute que la boucle locale du conteneur, injoignable.
CMD ["./node_modules/.bin/vite", "--host"]


# ---------- build : compilation du site statique ----------
FROM deps AS build

# L'adresse de l'API est écrite DANS le bundle : elle doit être connue ici, et
# non au démarrage. En changer impose de reconstruire l'image.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY --chown=node:node . .

# vite.config.ts interrompt cette étape si VITE_API_URL manque, plutôt que de
# produire un bundle qui échouerait dans le navigateur.
RUN npm run build


# ---------- prod : le site statique servi sans Node ----------
FROM nginx:1.27-alpine AS prod

# La configuration entière est remplacée, et non un fragment de conf.d : celle
# d'origine pose une directive `user` et son pid dans /var/run, deux choses
# interdites à un compte non privilégié.
COPY nginx.conf /etc/nginx/nginx.conf

# Seul le résultat du build entre ici : ni Node, ni node_modules, ni sources.
COPY --from=build /app/dist /usr/share/nginx/html

# Compte fourni par l'image nginx. Tout ce que le serveur écrit — pid, tampons —
# a été renvoyé vers /tmp par nginx.conf, inscriptible par tous.
USER nginx

# 8080 et non 80 : lier un port sous 1024 exige des privilèges.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/ > /dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
