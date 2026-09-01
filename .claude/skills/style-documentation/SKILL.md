---
name: style-documentation
description: >-
  Use this skill when the user writes or reviews documentation, comments or
  docstrings on the Weeb project — "commente ce code", "ajoute des docstrings",
  "documente cette fonction", "mets à jour le README", "explique ce fichier",
  "rédige la doc". Covers French one-line docstrings, why-not-what comments,
  the pedagogical tone used across the codebase, and README upkeep.
---

# Style de documentation — projet Weeb

Le code de ce dépôt est aussi un **livrable de formation** : il est lu par un correcteur autant que par un développeur. La documentation est donc pédagogique, jamais décorative.

## Langue

- **Français** pour tous les commentaires, docstrings, README et messages d'erreur destinés à l'utilisateur.
- Les identifiants (variables, fonctions, classes, champs) restent en **anglais**, comme dans tout le code existant.

## Docstrings

- Une docstring **d'une seule ligne** sur chaque classe (modèle, serializer, vue, permission, manager).
- Elle dit ce que fait l'objet **et ce qui le distingue**, pas son type :

✅ `"""Utilisateur identifié par son EMAIL (pas de username)."""`
✅ `"""Inscription d'un nouvel utilisateur. Endpoint PUBLIC (pas besoin d'être connecté)."""`
❌ `"""Classe CustomUser."""` · ❌ `"""Serializer for Article."""`

- Pour une vue DRF, préciser si l'endpoint est **PUBLIC** ou authentifié.
- Docstring multi-lignes uniquement quand un enchaînement doit être expliqué (ex. les deux étapes de la réinitialisation de mot de passe).

## Commentaires

- Un commentaire explique **pourquoi**, jamais **quoi**. Si le commentaire paraphrase la ligne, le supprimer.

✅ `# CORS : à placer le plus haut possible, avant CommonMiddleware`
✅ `# L'auteur = l'utilisateur connecté. JAMAIS fourni par le client.`
❌ `# on incrémente i`

- Commentaire de fin de ligne pour éclairer un champ ou un réglage :
  `on_delete=models.CASCADE,  # si l'auteur est supprimé, ses articles aussi`
- **Majuscules d'insistance** sur le point critique d'une règle de sécurité : `HASHE le mot de passe (jamais en clair)`, `read_only : ne RESSORT jamais dans la réponse JSON`.
- Bandeaux de section pour découper un fichier long (`settings.py`, `index.css`, `.gitignore`) :

```python
# ============================================
#  Django REST Framework (DRF)
# ============================================
```

- **Supprimer les commentaires générés par les outils** dès que le fichier contient du vrai code : `# Create your views here.`, `# Create your tests here.` n'ont rien à faire dans un fichier rempli.

## README

- Un README par sous-projet (`frontend/README.md` existe ; en créer un équivalent pour `backend/` et un README racine).
- Structure attendue : titre, table des matières, Technologies (avec numéros de version), Installation (commandes copiables), Pages ou Endpoints en tableau, Structure du projet en arborescence, Scripts en tableau.
- Toute commande donnée doit être exécutable telle quelle.
- **Mettre à jour le README dans le même commit que le changement** : une nouvelle route, un nouveau script npm ou une nouvelle variable d'environnement s'y reflète immédiatement.

## AMELIORATIONS.md

Les idées repérées en cours de développement mais non traitées vont dans `AMELIORATIONS.md`, jamais en `TODO` dans le code. Format : case à cocher, titre en gras, description courte, piste technique envisagée.

## Ce qu'on ne documente pas

- Pas de commentaire de bloc pour annoncer une évidence (`# imports`, `# fonction principale`).
- Pas de code commenté laissé en place : le supprimer, git le garde.
- Pas de `TODO` sans numéro d'issue associé.
