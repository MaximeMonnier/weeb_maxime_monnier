# ============================================
#  Image du frontend React — projet Weeb
# ============================================
# Construction depuis la racine du dépôt :
#   docker build -t weeb-frontend ./frontend
# Le contexte est frontend/ : le .env de la racine en est HORS, et ne peut donc
# entrer dans aucun layer, ni apparaître dans `docker history`.
#
# ⚠️ Image de DÉVELOPPEMENT. Elle fait tourner le serveur de Vite, avec le
# rechargement à chaud, et non un build statique : le code n'est pas compilé,
# il est servi et transformé à la volée. Elle n'est pas destinée à être
# exposée sur Internet. Une image de production — build `npm run build` puis
# fichiers statiques derrière un serveur HTTP, sans Node — reste à faire, et
# ce sera une autre image, pas une variante de celle-ci.
#
# Une seule étape, volontairement : un build en plusieurs étapes n'aurait rien
# à alléger ici, puisque le serveur de développement a justement besoin des
# sources et de toutes les dépendances, dont celles de développement.

FROM node:22-alpine

# NODE_ENV : Vite s'en sert pour choisir son mode. `development` explicite ce
# que fait cette image, et empêche npm de sauter les devDependencies —
# TypeScript, ESLint et le plugin React en font partie, et le serveur ne
# démarre pas sans elles.
#
# DEV_POLLING : lu par vite.config.ts, qui bascule alors la surveillance des
# fichiers en interrogation périodique. Indispensable ici, car les événements
# du système de fichiers ne traversent pas un montage lié depuis l'hôte : sans
# cela, le rechargement à chaud reste muet quand on édite le code.
ENV NODE_ENV=development \
    DEV_POLLING=1

WORKDIR /app

# L'image node fournit déjà un compte `node` sans privilèges (uid 1000). On lui
# donne /app AVANT d'installer, et on bascule dessus tout de suite : Vite écrit
# son cache de dépendances pré-compilées dans node_modules/.vite au démarrage.
# Installer en root puis changer d'utilisateur laisserait ce dossier
# inaccessible en écriture, et le serveur échouerait au lancement.
RUN chown node:node /app
USER node

# Seuls les manifestes sont copiés ici, pas le code : ce layer — le plus lourd
# et le plus lent — n'est reconstruit que si les dépendances changent. Copier
# le code d'abord relancerait l'installation complète à chaque virgule
# modifiée dans un composant.
COPY --chown=node:node package.json package-lock.json ./

# `npm ci` et non `npm install` : il installe exactement ce que fige le
# package-lock.json et échoue si le manifeste et le verrou divergent, là où
# `install` réécrirait le verrou en silence. Deux builds de la même image
# donnent ainsi les mêmes dépendances.
# `--no-audit --no-fund` : deux appels réseau et un pavé de sortie qui
# n'apportent rien dans un build automatisé.
RUN npm ci --no-audit --no-fund

# Le code applicatif arrive en dernier, dans cet ordre précis : le modifier
# n'invalide alors que ce layer-ci, jamais l'installation ci-dessus.
#
# En développement, ce code est de toute façon recouvert par le montage du
# dossier frontend/ de l'hôte. Il est copié quand même pour que l'image sache
# tourner seule, sans montage.
COPY --chown=node:node . .

# Documentaire : EXPOSE ne publie rien, il déclare le port écouté.
EXPOSE 5173

# La sonde vise la racine servie par Vite, donc le serveur HTTP lui-même.
# wget vient de busybox, déjà présent dans l'image Alpine : rien à installer.
# `-q -O -` : pas de barre de progression, réponse jetée — seul le code de
# sortie compte.
#
# ⚠️ Ce que cette sonde ne dit pas : elle vérifie que Vite répond, pas que
# l'application fonctionne. VITE_API_URL manquante casse le front dans le
# navigateur, sans que le serveur cesse pour autant de servir l'index.
#
# start-period couvre le premier démarrage, pendant lequel Vite pré-compile
# les dépendances ; les échecs n'y sont pas comptabilisés.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O - http://127.0.0.1:5173/ > /dev/null 2>&1 || exit 1

# Le binaire de Vite est appelé directement, et non par `npm run dev` : npm
# resterait le processus n° 1 et ne transmettrait pas SIGTERM à son enfant, si
# bien que chaque `docker stop` attendrait les dix secondes du délai de grâce
# avant de tuer le conteneur. Ici Vite est le processus n° 1 et s'arrête net.
#
# --host : sans lui, Vite n'écoute que sur 127.0.0.1 À L'INTÉRIEUR du
# conteneur, une adresse que la publication de port ne peut pas atteindre. Le
# port serait publié sur une porte que personne n'ouvre.
CMD ["./node_modules/.bin/vite", "--host"]
