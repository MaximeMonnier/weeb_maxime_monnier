# Deux cibles : `--target dev` (Vite) et `--target prod`, qui exige `--build-arg VITE_API_URL`.

FROM node:22-alpine AS deps

WORKDIR /app

# Avant l'installation : Vite écrit son cache dans node_modules/.vite.
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci --no-audit --no-fund


FROM deps AS dev

# DEV_POLLING est lu par vite.config.ts.
ENV NODE_ENV=development \
    DEV_POLLING=1

COPY --chown=node:node . .

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:5173/ > /dev/null 2>&1 || exit 1

# Sans npm, qui ne transmettrait pas le SIGTERM ; --host, sinon injoignable hors du conteneur.
CMD ["./node_modules/.bin/vite", "--host"]


FROM deps AS build

# Écrite dans le bundle : en changer impose de reconstruire l'image.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY --chown=node:node . .

RUN npm run build


FROM nginx:1.27-alpine AS prod

# Configuration entière : celle d'origine pose `user` et un pid dans /var/run, interdits sans privilèges.
COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist /usr/share/nginx/html

# pid et tampons renvoyés vers /tmp par nginx.conf.
USER nginx

# Sous 1024, lier un port exige des privilèges.
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:8080/ > /dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
