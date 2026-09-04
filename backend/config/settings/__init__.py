"""
Package de configuration Django, découpé par environnement.

`base.py` porte les réglages communs ; `development.py`, `test.py` et
`production.py` n'en décrivent que les différences. Le module réellement
chargé est désigné par la variable d'environnement DJANGO_SETTINGS_MODULE
(par exemple `config.settings.production`).
"""
