# Journal de bord — projet Weeb

Une entrée par lot de `correction.md`, écrite **à sa clôture** et non reconstituée après coup.

Ce journal ne raconte pas ce qui a été fait : les issues, les pull requests et les rapports
de revue le font déjà, datés et vérifiables par un tiers. Il porte ce qu'ils ne captent pas —
le chiffre mesuré avant, l'option écartée et son motif, l'écart entre ce qui était prévu et
ce qui s'est passé.

## Format d'une entrée

```markdown
## Lot <n> — <titre>

Clos le <AAAA-MM-JJ> · Epic #<numéro> (ou Issue #<numéro>, à défaut d'epic) · Alimente : <bloc RNCP>

**Constat mesuré** — le chiffre ou la sortie de commande qui a motivé le lot, pas son résumé.

**Décision et justification** — ce qui a été retenu, ce qui a été écarté, et pourquoi.

**Ce qui a surpris** — l'écart entre le prévu et le constaté. La partie la plus utile :
aucun diff ne la redit.

**Preuve de la correction** — la commande rejouée et sa sortie, après.
```

---

## Lot 0 — Débloquer l'environnement de travail

Clos le 2026-09-04 · Issue #58 · Alimente : —

**Constat mesuré** — `npm audit` depuis `frontend/` : `15 vulnerabilities (1 low, 2 moderate,
12 high)`, sur 15 paquets. Treize relèvent de l'outillage et n'exposent que le poste de
travail. Les deux derniers partent dans le bundle servi par `weeb-frontend:prod` :
`react-router` 7.12.0, qui porte à lui seul treize avis — redirection ouverte via URL relative
au protocole, XSS stockée, CSRF, dénis de service par appariement de routes — et
`react-router-dom` 7.12.0, vulnérable par simple dépendance sur le premier.

**Décision et justification** — `npm audit fix` sans `--force`. Les correctifs tiennent tous
dans les bornes `^` déjà déclarées : `package.json` n'a pas bougé, seul le verrou est réécrit,
et la revue se limite à un diff de versions. `--force` a été écarté — il aurait imposé des
montées majeures non demandées par le ticket. Épingler les versions l'a été aussi : le projet
assume ses bornes `^`, les figer déplacerait le problème au prochain avis.

**Ce qui a surpris** — deux fois, et dans les deux cas c'est l'outil qui ment, pas le code.

`npm audit` sort en **code 0 quand l'audit lui-même échoue**. L'endpoint d'avis du registre
répondait en deux minutes ce jour-là ; trois tentatives ont fini en `503`, et la commande a
malgré tout rendu la main sur un succès apparent. Une CI qui se fierait à son code de retour
passerait au vert sans avoir rien vérifié.

Le volume anonyme sur `/app/node_modules` du conteneur de développement **n'isolait plus
rien** : un fichier témoin écrit sur la machine ressortait à l'intérieur, et Vite servait donc
le `node_modules` de l'hôte au lieu de celui de l'image. Le conteneur datait de la veille.
Sans `--renew-anon-volumes`, la vérification de `react-router` aurait porté sur des paquets
dont l'origine était indéterminée. Le comportement documenté dans le README est le bon ; c'est
un conteneur survivant qui avait dérivé.

**Preuve de la correction** — `npm audit` : `found 0 vulnerabilities`. `npm run lint` sans
erreur ; `npm run build` produit `dist/` en 2,2 s. `rm -rf node_modules && npm ci` réinstalle
201 paquets sans toucher au verrou, et le build repasse — l'avertissement `allowScripts` sur
`esbuild@0.27.2` n'y fait pas obstacle. `docker build --target prod` sort une image de 74,3 Mo
et les trois services de `compose.dev.yaml` sont `healthy`. La garde `VITE_API_URL` de
`vite.config.ts` interrompt toujours un build de production quand la variable manque.
Navigation vérifiée par un clic réel piloté en CDP : depuis `/blog`, le clic sur une carte
mène à `/articles/2`, qui affiche le bon titre **sans rechargement de page** — donc bien par
le routeur client, celui-là même qui a été mis à jour.
