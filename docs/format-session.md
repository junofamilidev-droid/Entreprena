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

---

# Format atelier — à jour au 4 novembre 2026

Le format « atelier » est un second lecteur de session, inspiré de DataCamp et de Brilliant :
- une cheffe de mission confie une mission (avec des relances en cours de route) ;
- à gauche, un tuteur (senior fictif) guide une étape à la fois ;
- à droite, l'espace de travail change selon l'étape.

On livre à l'apprenant un outil d'expert pour Claude (un skill). La plateforme guide, explique et vérifie, mais n'exécute aucune IA : l'apprenant lance l'outil dans son propre Claude, ouvert à côté.

**Choix du lecteur.** Une session porte `"format": "atelier"` pour utiliser ce lecteur. Sans ce champ, le lecteur classique (un écran par bloc) s'applique, comme avant.

**Écran.** Le format atelier se fait sur ordinateur : sous 1 024 px de large, l'apprenant voit « Cette session se fait sur ordinateur » et un lien vers l'accueil.

**Outil d'IA.** Claude uniquement : la fenêtre « Quel outil d'IA… » ne s'ouvre pas.

```json
{
  "format": "atelier",
  "formation": "auditeur-augmente-ia",
  "module": "revue-analytique",
  "session": 2,
  "titre": "",
  "duree_min": 45,
  "maj": "AAAA-MM-JJ",
  "accueil": { "ce_que_vous_allez_faire": "", "ce_que_vous_emportez": [""], "pourquoi": "" },
  "mission": { "expediteur": "", "objet": "", "message": "", "echeance": "", "livrable": "", "a_copier": "" },
  "tuteur": { "nom": "", "role": "" },
  "etapes": [
    {
      "titre": "", "objectif": "", "pourquoi": "", "a_faire": [""],
      "aides": [ { "question": "", "reponse": "" } ],
      "relance": { "expediteur": "", "message": "" },
      "panneau": { "type": "quiz", "...": "voir ci-dessous" }
    }
  ],
  "commandes": [ { "commande": "", "quand": "", "rend": "" } ],
  "fin": { "recapitulatif": [""] }
}
```

## En-tête et cadre
- `formation`, `module`, `session`, `titre`, `maj` : comme au format classique.
- `duree_min` : 60 au maximum.
- `accueil` : l'écran affiché avant la première étape. Il présente ce qu'on va faire, ce qu'on emporte (liste), pourquoi c'est utile, la durée et le plan des étapes (calculé).
- `mission` :
  - le message de la cheffe de mission : il ouvre le fil du tuteur et reste relisible à tout moment avec le bouton « Mission » de la barre de droite ;
  - le bouton « Copier le contexte » copie le texte de `a_copier`, à coller dans Claude.
- `tuteur` : nom et rôle du senior fictif qui guide (par exemple « Marc », « Senior manager »).
- `commandes` (facultatif) : les commandes de l'outil, résumées dans la bulle « Les commandes de l'outil » de la barre de droite. Chaque commande : `{ "commande": "/approfondir <compte>", "quand": "…", "rend": "…" }`.
  - `quand` dit à quel moment s'en servir, `rend` ce qu'elle produit : une phrase courte chacun.
  - Un clic copie la commande. Les parties à compléter, écrites `<ainsi>`, ne sont pas copiées : l'apprenant les tape dans Claude.
  - Les commandes doivent être celles que le fichier de l'outil (le skill) reconnaît vraiment.
- `fin` : `recapitulatif` liste ce que l'apprenant a obtenu. L'écran de fin montre aussi la fiche et le téléchargement de l'outil.

## L'écran
- **À gauche**, le fil du tuteur, en grand texte :
  - la mission au départ, puis les relances ;
  - pour chaque étape : l'objectif, le pourquoi, les étapes à faire, les aides ouvertes et ses réactions.
  - Dans ces textes, les passages écrits `**ainsi**` sont en gras.
- **Au centre**, l'espace de travail : une carte posée sur un fond d'ambiance dont la teinte suit l'état (attente, en cours, réussite, à revoir). Le fond est immobile si l'appareil réduit les animations.
- **À droite**, une barre fine : la progression, la mission (relisible à tout moment), le bouton pour copier le contexte et, si la session a des `commandes`, la bulle « Les commandes de l'outil », d'une couleur distincte.

## Revenir en arrière
- Les réponses de l'apprenant sont gardées quand il revient sur une étape.
- Une étape déjà commencée affiche « Refaire l'étape » : ses réponses, aides ouvertes et vérifications repartent à zéro (le quiz redevient cliquable).
- À la fin, « Revoir » parcourt les étapes avec les réponses ; « Tout refaire » remet toutes les étapes à zéro. La session reste comptée comme terminée.

## Une étape
- `titre`, `objectif`, `pourquoi`, `a_faire` (étapes numérotées) : ce que le tuteur affiche, à gauche.
- `aides` : questions pré-écrites, proposées en boutons ; la réponse s'affiche comme un message du tuteur. La liste peut être vide.
- `relance` (facultatif) : un nouveau message de la cheffe de mission, qui arrive quand l'apprenant atteint l'étape. Il s'ajoute en tête du panneau de mission.
- `panneau` : l'espace de travail, à droite. Il doit avoir un `type` parmi ceux décrits ci-dessous.

## Types de panneau
- `quiz` : `{ "type": "quiz", "question", "choix": [textes], "bonne": index, "explication" }`.
  - `bonne` se compte à partir de 0 (le premier choix vaut 0).
  - On répond en cliquant ou en tapant le numéro du choix (1, 2, 3…). Le retour est immédiat, et le tuteur affiche l'explication.
- `outil` : `{ "type": "outil", "fichier", "presentation", "regles": [ { "titre", "extrait", "avec", "sans", "explication" } ], "installation": [ { "titre", "detail" } ] }`.
  - Le panneau a trois onglets : « Les règles », « Télécharger », « Installer ».
  - Chaque règle est cliquable : un clic montre côte à côte la sortie avec (`avec`) et sans (`sans`) la règle, et le tuteur explique (`explication`).
  - L'onglet « Télécharger » propose `fichier` (un .zip est accepté). L'onglet « Installer » montre une étape numérotée et illustrée par élément de `installation`, et la case « C'est installé ».
  - L'icône de chaque étape d'installation est choisie d'après son titre : télécharger, réglages, importer, activer, tester.
- `test` : `{ "type": "test", "fichier_donnees", "consigne", "verifications": [ { "libelle", "mots_cles": [textes], "regle": "tous" ou "un", "si_reussi", "si_manque" } ] }`.
  - L'apprenant télécharge les données, colle la réponse de Claude, puis clique sur « Vérifier ».
  - Chaque vérification devient un voyant vert ou ambre, calculé dans le navigateur :
    - les mots-clés sont cherchés sans tenir compte des majuscules ni des accents ;
    - les espaces dans les nombres sont ignorés (« 471 000 » = « 471000 ») ;
    - `tous` exige chaque mot-clé, `un` au moins un.
  - Les voyants ne bloquent pas. Le tuteur commente chaque voyant avec `si_reussi` ou `si_manque`.
- `personnaliser` : `{ "type": "personnaliser", "commande", "etapes": [textes], "items": [textes] }`. La commande est à copier dans Claude, suivie des étapes et des cases à cocher.
- `fiche` : `{ "type": "fiche", "titre", "etapes": [textes], "pieges": [textes] }`. Elle est rangée aussi dans « Ma boîte à outils » une fois la session terminée. `pieges` peut être vide.

## Fichiers
- Les fichiers cités par `outil.fichier` et `test.fichier_donnees` sont à téléverser dans l'éditeur de la session, comme au format classique.
- Les .zip sont acceptés.

## Dans l'espace réservé
- **Importer une session (JSON)** reconnaît le format, vérifie le fichier et montre l'aperçu.
- Une session au format atelier se modifie en JSON dans son éditeur, et non bloc par bloc.

Exemple complet : `content/demo/session-atelier-nordelia.json`, visible sur `/demo-atelier`.
