# Image de DÉVELOPPEMENT : serveur Vite et rechargement à chaud, pas un build
# statique. Construction, lancement et montages détaillés dans le README.
#   docker build -t weeb-frontend ./frontend
FROM node:22-alpine

# NODE_ENV=development : sans lui, npm saute les devDependencies, dont Vite.
# DEV_POLLING est lu par vite.config.ts.
ENV NODE_ENV=development \
    DEV_POLLING=1

WORKDIR /app

# /app appartient à node AVANT l'installation : Vite écrit son cache dans
# node_modules/.vite, et échouerait sur un dossier appartenant à root.
RUN chown node:node /app
USER node

# Les manifestes avant le code : modifier un composant ne relance pas npm ci.
COPY --chown=node:node package.json package-lock.json ./

# npm ci et non install : il respecte le verrou au lieu de le réécrire.
RUN npm ci --no-audit --no-fund

COPY --chown=node:node . .

EXPOSE 5173

# La sonde dit que Vite répond, pas que l'application marche : voir le README.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:5173/ > /dev/null 2>&1 || exit 1

# Vite appelé directement, pas par npm : npm resterait le processus n° 1 sans
# transmettre SIGTERM, et chaque `docker stop` attendrait dix secondes.
# --host : sinon Vite n'écoute que la boucle locale du conteneur, injoignable.
CMD ["./node_modules/.bin/vite", "--host"]
