# Format d'une formation Entreprena (JSON) — à jour au 21 octobre 2026

Une nouvelle formation = un fichier JSON, collé dans l'espace réservé (**Importer une formation (JSON)**).
Il contient la fiche de la formation, ses modules dans l'ordre, et, si on le souhaite, ses sessions.
Il est vérifié avant l'import : chaque erreur dit où corriger.

```json
{
  "formation": {
    "identifiant": "controleur-gestion-ia",
    "titre": "Contrôleur de gestion augmenté par l'IA",
    "domaine": "Contrôle de gestion",
    "public": "Contrôleurs de gestion juniors et seniors",
    "promesse": "Une phrase. Les passages ==entre deux signes égal== sont surlignés sur le site.",
    "resume": "Une ou deux phrases.",
    "pour_qui": ["…"],
    "ce_que_ce_n_est_pas": ["…"]
  },
  "modules": [
    { "identifiant": "analyse-ecarts", "titre": "", "resume": "", "livrable": "", "ouvert": true },
    { "identifiant": "reporting-mensuel", "titre": "", "resume": "", "livrable": "", "ouvert": false }
  ],
  "sessions": [
    { "formation": "controleur-gestion-ia", "module": "analyse-ecarts", "session": 1, "…": "format d'une session (docs/format-session.md)" }
  ]
}
```

## Règles

**Identifiants**
- Ils s'écrivent en minuscules, chiffres et tirets.
- `formation.identifiant` devient l'adresse de la formation (`/formations/controleur-gestion-ia`).
- Chaque module a un identifiant unique dans la formation.
- Dans chaque session, `formation` reprend l'identifiant de la formation et `module` celui d'un module de la liste.

**Modules**
- L'ordre de la liste donne les numéros (module 1, 2…).
- `ouvert` vaut `true` (accessible aux apprenants) ou `false` (affiché « à venir » dans le plan), sans guillemets.
- Les durées ne s'écrivent pas : le site les calcule à partir des sessions.

**Sessions**
- Le champ `sessions` est facultatif.
- Chaque session suit exactement le format de `docs/format-session.md`.
- On peut aussi les ajouter plus tard, une par une, avec **Importer une session (JSON)**.

**Réimporter**
- Réimporter le même fichier, avec le même identifiant de formation, met à jour la formation, ses modules et ses sessions.
- Rien n'est supprimé : un module retiré du fichier reste en place, et l'espace réservé le signale.

**Après l'import**
- Téléversez les fichiers des sessions (données des défis, outils) dans l'éditeur de chaque session. L'écran d'import en donne la liste.
