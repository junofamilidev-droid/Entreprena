# Format d'une session Entreprena (JSON) — à jour au 2 novembre 2026

Une session = un fichier JSON, collé dans l'espace réservé (**Importer une session (JSON)**).
Il est vérifié avant l'import : chaque erreur dit quel bloc et quel champ corriger.

```json
{
  "formation": "auditeur-augmente-ia",
  "module": "revue-analytique",
  "session": 1,
  "titre": "",
  "duree_min": 15,
  "maj": "AAAA-MM-JJ",
  "blocs": [
    { "type": "mission", "expediteur": "", "objet": "", "message": "", "echeance": "", "livrable": "" },
    { "type": "defi", "consigne": "", "donnees": "nom-du-fichier.csv", "temps_cible_min": 5, "criteres": [], "reponses_attendues": [] },
    { "type": "prompt", "texte": "", "usage": "", "resultat_attendu": "" },
    { "type": "collage", "consigne": "", "a_verifier": [] },
    { "type": "controle", "items": [] },
    { "type": "repere-erreur", "lignes": [], "ligne_fautive": 1, "explication": "" },
    { "type": "outil", "fichier": "", "description": "", "champs_a_adapter": [], "mode_emploi": "" },
    { "type": "gain", "tache": "", "reference": "defi" },
    { "type": "fiche", "titre": "", "etapes": [], "pieges": [] },
    { "type": "texte", "contenu": "" },
    { "type": "schema", "titre": "", "etapes": ["Nom de l'étape : une phrase"] },
    { "type": "coulisses", "passages": ["extrait || explication"], "a_juger": "", "verifications": [] }
  ],
  "consignes_outils_ia": { "claude": "", "chatgpt": "", "copilot": "", "lechat": "" }
}
```

## Règles

**En-tête**
- `formation`, `module` : identifiants existants sur la plateforme (minuscules et tirets). Le module doit déjà exister.
- `session` : numéro entier à partir de 1. Importer une session qui porte le même numéro dans le même module la remplace.
- `duree_min` : 60 au maximum.
- `maj` : date de mise à jour, format AAAA-MM-JJ.

**Blocs**
- Les blocs s'affichent dans l'ordre de la liste, un écran par bloc. Tous les ordres sont acceptés (un texte après le défi, un outil avant le prompt…).
- Tous les champs sont obligatoires et non vides, sauf `reponses_attendues` (bloc `defi`) et `champs_a_adapter` (bloc `outil`), qui sont facultatifs. Les listes s'écrivent entre `[ ]`, chaque élément entre guillemets. Les nombres s'écrivent sans guillemets.
- Un retour à la ligne dans un texte s'écrit `\n`.

**Par type**
- `mission` : message du chef de mission (5 lignes au maximum conseillées).
- `defi` :
  - `donnees` est le nom exact du fichier de données fictives, téléversé ensuite dans l'espace réservé.
  - L'apprenant lance lui-même le chronomètre et répond un élément par ligne.
  - `reponses_attendues` : les éléments que l'apprenant devait trouver (par exemple « 411000 Clients »). Ils ne sont montrés qu'à l'écran du gain : en vert si trouvés, en orange si manqués, avec un score (« 3 sur 5 »). Un numéro de compte suffit à reconnaître une réponse ; accents, majuscules et ponctuation sont ignorés.
- `prompt` :
  - Les champs entre crochets se remplissent sur la page, par exemple `[seuil en euros]`.
  - Un champ qui commence par « Collez » reste à compléter dans l'outil d'IA, par exemple `[Collez la balance ici]`.
  - `usage` sert de titre à l'écran.
- `collage` : l'apprenant colle la réponse de son IA ; le `resultat_attendu` du dernier prompt s'affiche à côté pour comparer.
- `controle` : cases à cocher ; Suivant reste bloqué tant que tout n'est pas coché.
- `repere-erreur` : `ligne_fautive` est le numéro de la ligne fausse, en comptant à partir de 1.
- `outil` :
  - `fichier` est le nom exact du fichier, téléversé ensuite dans l'espace réservé.
  - `champs_a_adapter` est facultatif : absent ou vide, la rubrique « Champs à adapter » n'est pas affichée.
  - `mode_emploi` s'écrit avec une étape par ligne (`\n`).
- `gain` :
  - Il compare le temps du défi au temps « avec la méthode ».
  - Le temps « avec la méthode » se mesure de l'ouverture du premier bloc `outil` jusqu'à la validation du **dernier** bloc `controle` placé entre cet outil et le bloc `gain`. Sans contrôle dans cet intervalle, il s'arrête à l'arrivée sur le bloc `gain`.
  - Pour une mesure juste, le `defi` doit demander le même livrable que celui produit avec la méthode.
  - `reference` vaut toujours « defi ».
- `fiche` : fiche juste-à-temps, rangée aussi dans « Ma boîte à outils » une fois la session terminée.
- `texte` : 3 lignes et 400 caractères au maximum.
- `schema` (écran « Ce que l'outil va faire ») : de 2 à 6 `etapes`, chacune écrite « Nom de l'étape : une phrase » (le « : » est obligatoire). Elles s'affichent en frise numérotée : horizontale sur ordinateur, verticale sur téléphone.
- `coulisses` (écran « Les coulisses ») :
  - `passages` : de 1 à 5 textes, chacun écrit « extrait || explication » (le « || » est obligatoire). L'extrait s'affiche surligné, son explication juste en dessous.
  - `a_juger` : ce que l'outil ne peut pas juger seul, affiché dans un encadré.
  - `verifications` : au moins une case à cocher. Suivant reste bloqué tant que tout n'est pas coché.

**Consignes par outil d'IA**
- Si `consignes_outils_ia` ne contient que la clé `claude`, l'apprenant n'a pas à choisir d'outil : la session considère que c'est Claude.
- Affichées sous le prompt selon l'outil choisi par l'apprenant (claude, chatgpt, copilot, lechat). Pour « un autre outil », un texte générique s'affiche.
- La mention « (À vérifier) » peut rester dans le texte : elle est masquée pour les apprenants et visible dans l'espace réservé.
