// Diagnostic « Votre métier face à l'IA » : données des métiers et de leurs tâches.
// FICHIER UNIQUE, modifiable sans toucher au reste du code.
//
// - exposition : note de 1 à 5. 5 = une IA sait déjà produire l'essentiel d'un premier jet ;
//   1 = tâche surtout humaine ou relationnelle. Ce sont des ESTIMATIONS internes, à faire relire
//   par un professionnel du métier (a_relire = true tant que ce n'est pas fait).
// - ia / humain / action_semaine : les lignes du plan d'action. Elles ne sont JAMAIS envoyées au
//   navigateur avant que le visiteur ait laissé son email : n'importer ce fichier que côté serveur
//   (pages et Server Actions), et ne passer aux composants que `metiersPublics()`.

import type { Cadre, Objectif } from "./calcul";
import { AUTRE, type MetierPublic } from "./public";

export { AUTRE };
export type { MetierPublic };
export type Statut = MetierPublic["statut"];

export type Tache = {
  id: string;
  libelle: string;
  exposition: 1 | 2 | 3 | 4 | 5;
  ia: string;
  humain: string;
  action_semaine: string;
  a_relire: boolean;
};

export type Metier = {
  id: string;
  libelle: string;
  /** Identifiant de la formation liée (page /formations/[id]), ou null. */
  formation: string | null;
  statut: Statut;
  taches: Tache[];
};

/** Raccourci d'écriture : une tâche, à relire par défaut. */
function t(id: string, libelle: string, exposition: Tache["exposition"], ia: string, humain: string, action_semaine: string, a_relire = true): Tache {
  return { id, libelle, exposition, ia, humain, action_semaine, a_relire };
}


export const METIERS: Metier[] = [
  {
    id: "auditeur",
    libelle: "Auditeur",
    formation: "auditeur-augmente-ia",
    statut: "disponible",
    taches: [
      t("revue-analytique", "Revue analytique", 5, "Calculer les variations, isoler celles au-dessus d'un seuil, proposer hypothèses et questions.", "Connaître le client ; une hypothèse n'est pas un élément probant.", "Sur une balance fictive, demandez à l'IA les variations au-dessus de vos seuils, puis recalculez-en deux à la main."),
      t("documentation", "Documentation des travaux, feuilles de travail", 5, "Structurer des notes brutes, rédiger une conclusion à partir de constats fournis.", "Vérifier que chaque phrase correspond à un travail fait.", "Faites structurer une feuille de travail anonymisée, puis rayez toute phrase qui ne renvoie pas à un travail réalisé."),
      t("tests-ecritures", "Tests sur les écritures comptables", 4, "Filtrer sur critères (week-end, montants ronds, écritures de clôture).", "Trier les faux positifs et juger le risque.", "Faites écrire par l'IA les filtres d'un test sur un journal fictif, puis justifiez chaque écriture retenue."),
      t("tests-detail", "Tests de détail et pointage de pièces", 3, "Extraire les données des factures, rapprocher pièces et journal.", "Les pièces sont des données clients ; un écart manqué ne se voit pas.", "Testez l'extraction sur trois factures fictives et comparez chaque champ à la pièce."),
      t("circularisation", "Circularisation des tiers", 3, "Aider à la sélection, aux lettres, au suivi des réponses.", "Garder la maîtrise des envois ; les noms de tiers sont sensibles.", "Faites rédiger un modèle de lettre de circularisation, sans aucun nom réel."),
      t("prise-connaissance", "Prise de connaissance et contrôle interne", 3, "Transformer des notes d'entretien en description de procédure.", "Identifier les vrais risques du client.", "Faites mettre au propre des notes d'entretien anonymisées, puis listez vous-même les risques qui manquent."),
      t("comptes-annuels", "Contrôle des comptes annuels et de l'annexe", 3, "Rapprocher annexe et balance, lister les informations obligatoires.", "Vérifier que le référentiel est à jour.", "Demandez la liste des mentions obligatoires d'une annexe, puis vérifiez-la dans le texte de référence."),
      t("collecte", "Collecte des documents et relances client", 2, "Préparer la liste de pièces, les relances et le suivi.", "La relation avec le client.", "Faites préparer votre prochaine liste de pièces à demander, puis adaptez le ton au client."),
      t("recherche", "Recherche technique, normes", 2, "Dégrossir une question, proposer un plan de note.", "Vérifier chaque référence, elle peut être inventée ou périmée.", "Posez une question technique à l'IA, puis vérifiez chaque référence citée dans la source."),
    ],
  },
  {
    id: "comptable",
    libelle: "Comptable",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("saisie", "Saisie et imputation des pièces", 5, "Lire les pièces et proposer une imputation.", "Valider les comptes utilisés et les cas inhabituels.", "Sur dix pièces fictives, comparez les imputations proposées aux vôtres."),
      t("rapprochements", "Rapprochements bancaires", 4, "Rapprocher relevé et grand livre, lister les suspens.", "Expliquer chaque suspens, ne jamais solder sans pièce.", "Faites rapprocher un relevé fictif, puis vérifiez chaque suspens proposé."),
      t("lettrage", "Lettrage et relances clients", 4, "Proposer des lettrages et rédiger des relances.", "Choisir le ton selon le client et l'historique.", "Faites rédiger trois relances de niveaux différents, puis gardez celle qui vous ressemble."),
      t("tva", "Déclarations de TVA", 3, "Préparer les montants à partir des comptes.", "Contrôler les cas particuliers et engager la déclaration.", "Demandez la liste des contrôles à faire avant une déclaration, puis comparez-la à la vôtre."),
      t("cloture", "Écritures de clôture", 3, "Préparer les calculs (provisions, charges à payer).", "Juger les estimations et en garder la justification.", "Faites préparer le calcul d'une charge à payer fictive, puis vérifiez chaque hypothèse."),
      t("coherence", "Contrôle de cohérence des comptes", 3, "Repérer des variations et des soldes anormaux.", "Savoir ce qui est normal pour ce client.", "Demandez les comptes atypiques d'une balance fictive, puis triez ceux qui le sont vraiment."),
      t("questions-clients", "Réponses aux questions des clients", 3, "Proposer un premier jet de réponse.", "Vérifier la règle applicable et assumer le conseil.", "Faites rédiger une réponse type, puis vérifiez la règle citée."),
      t("veille", "Veille fiscale et sociale", 3, "Résumer des textes et des actualités.", "Vérifier la date et la source de chaque règle.", "Faites résumer une actualité, puis retrouvez le texte officiel."),
    ],
  },
  {
    id: "assistant-direction",
    libelle: "Assistant(e) de direction",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("redaction", "Rédaction de courriers, emails et comptes rendus", 5, "Rédiger un premier jet à partir de notes.", "Le ton juste et ce qui ne doit pas être écrit.", "Faites rédiger le compte rendu de votre prochaine réunion à partir de vos notes, puis relisez-le."),
      t("emails", "Tri et traitement des emails", 4, "Résumer, classer et proposer des réponses.", "Repérer ce qui est urgent ou sensible.", "Faites résumer un fil d'emails anonymisé, puis vérifiez qu'il ne manque rien d'important."),
      t("presentations", "Préparation de présentations et documents", 4, "Structurer et mettre en forme un document.", "Vérifier chaque chiffre et chaque nom.", "Faites structurer une présentation simple, puis contrôlez chaque donnée."),
      t("agendas", "Gestion des agendas et réunions", 3, "Proposer des créneaux et des ordres du jour.", "Arbitrer les priorités de la direction.", "Faites préparer l'ordre du jour d'une réunion, puis ajustez les priorités."),
      t("deplacements", "Organisation des déplacements", 3, "Comparer des options et préparer un programme.", "Tenir compte des préférences et des imprévus.", "Faites préparer le programme d'un déplacement fictif, puis vérifiez horaires et adresses."),
      t("suivi", "Suivi des dossiers et relances", 3, "Lister les actions en attente et rédiger les relances.", "Savoir qui relancer, quand et comment.", "Faites lister les actions en cours d'un compte rendu, puis attribuez-les vous-même."),
      t("accueil", "Accueil et relations avec les interlocuteurs", 1, "Peu de choses : préparer des éléments de contexte.", "La relation, la confiance et la discrétion.", "Listez les situations où votre présence fait la différence."),
    ],
  },
  {
    id: "controleur-gestion",
    libelle: "Contrôleur de gestion",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("reporting", "Reporting mensuel et tableaux de bord", 5, "Assembler les données et produire les tableaux.", "Vérifier les chiffres et choisir les indicateurs utiles.", "Faites produire un tableau de bord fictif, puis recalculez deux indicateurs."),
      t("commentaires", "Commentaires et notes de synthèse", 5, "Rédiger un premier commentaire à partir des chiffres.", "Ne retenir que les causes confirmées.", "Faites commenter un écart fictif, puis barrez toute cause non confirmée."),
      t("ecarts", "Analyse des écarts budget / réel", 4, "Calculer et décomposer les écarts.", "Comprendre les causes avec les opérationnels.", "Faites décomposer un écart en volume et prix, puis vérifiez la méthode."),
      t("donnees", "Extraction et retraitement des données", 4, "Écrire des formules et nettoyer des tableaux.", "Vérifier que rien n'a été perdu ou doublé.", "Faites écrire une formule de retraitement, puis contrôlez les totaux avant et après."),
      t("budget", "Construction du budget et des prévisions", 3, "Proposer des hypothèses et des scénarios.", "Valider les hypothèses avec les responsables.", "Faites lister les hypothèses d'une prévision, puis notez celles à valider."),
      t("couts", "Calcul des coûts et de la rentabilité", 3, "Appliquer une méthode de calcul.", "Choisir la méthode et ses clés de répartition.", "Faites calculer un coût de revient fictif, puis justifiez chaque clé."),
      t("operationnels", "Échanges avec les opérationnels", 1, "Préparer les questions à poser.", "La relation et la compréhension du terrain.", "Préparez avec l'IA vos questions, puis menez l'échange vous-même."),
    ],
  },
  {
    id: "rh",
    libelle: "RH (paie, recrutement)",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("offres", "Rédaction des offres d'emploi", 5, "Rédiger une offre à partir d'une fiche de poste.", "Vérifier l'exactitude et l'absence de discrimination.", "Faites rédiger une offre, puis relisez chaque critère."),
      t("tri", "Tri des candidatures", 4, "Résumer des CV au regard des critères du poste.", "Décider avec équité ; les données sont personnelles.", "Sur des CV fictifs, comparez le tri proposé au vôtre et notez les écarts."),
      t("questions", "Réponses aux questions des salariés", 4, "Proposer des réponses types.", "Vérifier la règle applicable et la situation de la personne.", "Faites rédiger une réponse type, puis vérifiez la règle citée."),
      t("documents", "Rédaction des documents RH", 4, "Rédiger un premier jet de document.", "Vérifier la conformité au droit et à la convention.", "Faites rédiger un modèle de document, puis vérifiez chaque mention obligatoire."),
      t("paie", "Préparation et contrôle de la paie", 3, "Comparer les variables et signaler les anomalies.", "Appliquer la convention et décider des corrections.", "Sur un export fictif, comparez les anomalies signalées à vos contrôles habituels."),
      t("administratif", "Suivi administratif", 3, "Préparer les listes et les relances.", "Le suivi des situations individuelles.", "Faites préparer une liste de suivi, puis vérifiez les échéances."),
      t("entretiens", "Entretiens et relation avec les candidats", 1, "Préparer une grille d'entretien.", "L'écoute, le jugement et la décision.", "Préparez avec l'IA une grille d'entretien, puis adaptez-la au poste."),
    ],
  },
  {
    id: "banque",
    libelle: "Banque back-office",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("saisie", "Saisie et mise à jour des données clients", 5, "Lire des documents et pré-remplir les données.", "Vérifier chaque champ sensible.", "Sur des documents fictifs, comparez chaque champ pré-rempli à la source."),
      t("conformite", "Contrôle de conformité des dossiers", 4, "Vérifier la présence et la validité des pièces.", "Trancher les cas limites et tracer la décision.", "Faites contrôler un dossier fictif, puis vérifiez chaque pièce signalée."),
      t("rapprochements", "Rapprochements et suspens", 4, "Rapprocher les opérations et lister les écarts.", "Comprendre et régulariser chaque suspens.", "Faites rapprocher deux listes fictives, puis expliquez chaque écart."),
      t("reclamations", "Réponses aux réclamations", 4, "Proposer une réponse structurée.", "Vérifier les faits et le ton.", "Faites rédiger une réponse type, puis vérifiez chaque fait avancé."),
      t("operations", "Traitement des opérations et virements", 3, "Préparer et contrôler des listes d'opérations.", "Valider ce qui engage des fonds.", "Listez les contrôles que vous ne délégueriez jamais."),
      t("reporting", "Reporting réglementaire", 3, "Assembler les données et les tableaux.", "Vérifier l'exactitude avant envoi.", "Faites assembler un tableau fictif, puis recalculez deux totaux."),
      t("incidents", "Gestion des incidents", 2, "Résumer l'incident et proposer des étapes.", "Décider et coordonner la résolution.", "Faites résumer un incident passé, puis comparez au déroulé réel."),
    ],
  },
  {
    id: "commercial",
    libelle: "Commercial B2B",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("emails", "Rédaction des emails et relances", 5, "Rédiger des emails et des relances personnalisés.", "Le ton juste pour chaque client.", "Faites rédiger trois relances, puis gardez celle que vous enverriez vraiment."),
      t("crm", "Mise à jour du CRM", 5, "Résumer un échange et préparer la saisie.", "Vérifier ce qui est noté sur le client.", "Faites résumer votre dernier échange en note CRM, puis corrigez-la."),
      t("prospection", "Prospection et recherche de prospects", 4, "Lister des entreprises cibles et leurs enjeux.", "Vérifier chaque information avant de l'utiliser.", "Faites lister cinq prospects, puis vérifiez chaque information citée."),
      t("propositions", "Préparation des propositions commerciales", 4, "Structurer une proposition et ses options.", "Fixer le prix et les engagements.", "Faites structurer une proposition, puis relisez chaque engagement."),
      t("rendez-vous", "Préparation des rendez-vous", 4, "Synthétiser l'historique et les enjeux.", "Choisir la stratégie de l'échange.", "Faites préparer le brief de votre prochain rendez-vous, puis vérifiez les sources."),
      t("suivi", "Suivi des comptes existants", 2, "Repérer des signaux dans l'historique.", "La relation de confiance.", "Faites lister les comptes sans contact récent, puis choisissez qui appeler."),
      t("negociation", "Rendez-vous et négociation", 1, "Préparer des arguments.", "L'écoute, la négociation et la décision.", "Préparez avec l'IA les objections probables, puis répétez vos réponses."),
    ],
  },
  {
    id: "juriste",
    libelle: "Juriste / avocat",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("analyse", "Analyse de documents, due diligence", 5, "Lire des documents et repérer les clauses.", "Apprécier le risque ; les documents sont confidentiels.", "Sur un contrat fictif, comparez les clauses repérées à votre propre lecture."),
      t("recherche", "Recherche juridique et jurisprudence", 4, "Dégrossir une question et proposer des pistes.", "Vérifier chaque référence, elle peut être inventée.", "Posez une question à l'IA, puis vérifiez chaque décision citée dans une base officielle."),
      t("contrats", "Rédaction et relecture de contrats", 4, "Proposer des rédactions et des variantes.", "Adapter au dossier et engager le conseil.", "Faites proposer deux rédactions d'une clause, puis justifiez votre choix."),
      t("notes", "Rédaction de notes et consultations", 4, "Structurer une note et un premier jet.", "Le raisonnement et la conclusion.", "Faites structurer une note, puis réécrivez vous-même la conclusion."),
      t("veille", "Veille réglementaire", 4, "Résumer des textes et des actualités.", "Vérifier la date et la portée de chaque texte.", "Faites résumer une actualité, puis retrouvez le texte officiel."),
      t("echeances", "Gestion des échéances et dossiers", 2, "Lister les échéances et préparer les rappels.", "Ne manquer aucun délai.", "Faites lister les échéances d'un dossier fictif, puis comparez à votre agenda."),
      t("clients", "Échanges avec les clients, négociation, plaidoirie", 1, "Préparer des arguments.", "La relation, la stratégie et la parole.", "Préparez avec l'IA les questions difficiles, puis répondez-y vous-même."),
    ],
  },
  {
    id: "marketing",
    libelle: "Marketing / communication",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("contenus", "Rédaction de contenus", 5, "Rédiger des premiers jets et des variantes.", "Le ton de la marque et la véracité.", "Faites rédiger trois variantes d'un post, puis gardez celle qui sonne juste."),
      t("visuels", "Création de visuels", 4, "Proposer des visuels et des déclinaisons.", "La cohérence avec la charte et les droits.", "Faites décliner un visuel existant, puis vérifiez le respect de la charte."),
      t("performances", "Analyse des performances des campagnes", 4, "Résumer les résultats et repérer des tendances.", "Interpréter et décider des suites.", "Faites résumer les résultats d'une campagne, puis vérifiez deux chiffres."),
      t("veille", "Veille concurrentielle", 4, "Synthétiser des sources publiques.", "Vérifier chaque information.", "Faites synthétiser l'actualité d'un concurrent, puis vérifiez les sources."),
      t("reseaux", "Gestion des réseaux sociaux", 3, "Préparer un planning et des posts.", "Réagir avec justesse aux échanges.", "Faites préparer le planning de la semaine, puis ajustez-le."),
      t("evenements", "Organisation d'événements", 2, "Préparer des rétroplannings et des listes.", "La coordination et les imprévus.", "Faites préparer le rétroplanning d'un événement, puis vérifiez les délais."),
      t("coordination", "Coordination avec les équipes et prestataires", 1, "Préparer des briefs.", "La relation et l'arbitrage.", "Faites rédiger un brief, puis complétez-le avec ce que vous seul savez."),
    ],
  },
  {
    id: "vc",
    libelle: "VC Analyst",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("marche", "Analyse de marché et benchmark concurrentiel", 5, "Synthétiser des sources et comparer des acteurs.", "Vérifier chaque chiffre et sa source.", "Faites synthétiser un marché, puis vérifiez trois chiffres dans leur source."),
      t("sourcing", "Sourcing et cartographie de startups", 4, "Lister et classer des entreprises.", "Juger la qualité des équipes et des projets.", "Faites cartographier un secteur, puis vérifiez cinq entreprises."),
      t("decks", "Lecture des pitch decks et premières notes", 4, "Résumer un deck et lister les questions.", "Distinguer les faits des projections.", "Faites résumer un deck public, puis séparez faits et hypothèses."),
      t("memos", "Rédaction des mémos d'investissement", 4, "Structurer un mémo et un premier jet.", "La thèse et la recommandation.", "Faites structurer un mémo, puis réécrivez vous-même la recommandation."),
      t("modelisation", "Modélisation financière et valorisation", 3, "Construire une structure de modèle.", "Valider les hypothèses et la méthode.", "Faites construire la structure d'un modèle simple, puis vérifiez chaque formule."),
      t("due-diligence", "Due diligence", 3, "Préparer des listes de questions et de documents.", "Recouper et juger les réponses.", "Faites préparer une liste de questions, puis ajoutez celles qui manquent."),
      t("fondateurs", "Rencontres avec les fondateurs", 1, "Préparer des questions.", "La relation et le jugement sur l'équipe.", "Préparez avec l'IA vos questions, puis menez l'échange vous-même."),
    ],
  },
  {
    id: "consultant",
    libelle: "Consultant",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("recherche", "Recherche documentaire et benchmarks", 5, "Synthétiser des sources et comparer des pratiques.", "Vérifier chaque source et chaque chiffre.", "Faites un benchmark rapide, puis vérifiez trois sources."),
      t("livrables", "Rédaction de comptes rendus et livrables", 5, "Rédiger un premier jet à partir de notes.", "Le message et les recommandations.", "Faites rédiger un compte rendu, puis réécrivez vous-même les recommandations."),
      t("donnees", "Analyse de données et modélisation", 4, "Nettoyer, analyser et proposer des graphiques.", "Interpréter et vérifier les résultats.", "Faites analyser un jeu de données fictif, puis recalculez un résultat."),
      t("slides", "Production de slides", 4, "Structurer et mettre en forme des slides.", "L'histoire racontée au client.", "Faites structurer une présentation, puis réécrivez les titres."),
      t("appels-offres", "Réponses aux appels d'offres", 4, "Analyser le cahier des charges et rédiger un premier jet.", "La stratégie et les engagements.", "Faites analyser un cahier des charges public, puis listez les points à arbitrer."),
      t("gestion-projet", "Gestion de projet et coordination", 2, "Préparer des plannings et des comptes rendus.", "La coordination et les arbitrages.", "Faites préparer le planning d'une mission, puis ajustez les priorités."),
      t("ateliers", "Entretiens et ateliers clients", 1, "Préparer des guides d'entretien.", "L'écoute, l'animation et la relation.", "Préparez avec l'IA un guide d'entretien, puis adaptez-le au client."),
    ],
  },
  {
    id: AUTRE,
    libelle: "Autre métier",
    formation: null,
    statut: "en_preparation",
    taches: [
      t("redaction", "Rédaction d'emails, notes et rapports", 5, "Rédiger un premier jet à partir de vos notes.", "Le message, le ton et l'exactitude.", "Faites rédiger votre prochain email important, puis relisez chaque phrase."),
      t("recherche", "Recherche et synthèse d'informations", 4, "Résumer des sources et proposer une synthèse.", "Vérifier chaque information et sa source.", "Faites synthétiser un sujet, puis vérifiez trois informations."),
      t("donnees", "Analyse de données et tableaux", 4, "Écrire des formules et analyser des tableaux.", "Vérifier les résultats et les interpréter.", "Faites écrire une formule, puis contrôlez le résultat sur un exemple."),
      t("presentations", "Préparation de présentations", 4, "Structurer et mettre en forme.", "Le message et les chiffres.", "Faites structurer une présentation, puis vérifiez chaque chiffre."),
      t("administratif", "Saisie et traitement administratif", 4, "Pré-remplir et contrôler des données.", "Vérifier ce qui engage.", "Faites pré-remplir un document fictif, puis comparez à la source."),
      t("reunions", "Réunions et coordination", 2, "Préparer ordres du jour et comptes rendus.", "La coordination et les décisions.", "Faites rédiger le compte rendu d'une réunion, puis relisez les décisions."),
      t("relations", "Relations avec les clients ou collègues", 1, "Préparer des éléments de contexte.", "La relation et la confiance.", "Listez les échanges où votre présence fait la différence."),
    ],
  },
];

// Audit : les lignes « ia » et « humain » viennent du brief (formation existante) ; les notes et les
// actions de la semaine restent des estimations, d'où a_relire = true partout pour l'instant.

export const metierParId = (id: string) => METIERS.find((m) => m.id === id) ?? null;

/** Version transmise au navigateur : libellés et notes seulement, sans les lignes du plan. */
export function metiersPublics(): MetierPublic[] {
  return METIERS.map((m) => ({
    id: m.id,
    libelle: m.libelle,
    statut: m.statut,
    taches: m.taches.map(({ id, libelle, exposition }) => ({ id, libelle, exposition })),
  }));
}

// ---------- Textes du plan d'action (versions définitives) ----------
// Comme les lignes des tâches, ils ne sont envoyés au navigateur qu'après la saisie de l'email.

/** Étape 1 du plan, « Votre cadre », selon la question 4 (encadrement de l'IA par l'employeur). */
export const PLAN_CADRE: Record<Cadre, { titre: string; texte: string }> = {
  outil: {
    titre: "Votre cadre : un outil fourni, à utiliser avec méthode",
    texte:
      "Un outil fourni par votre employeur règle une partie de la question de la confidentialité, pas celle de la fiabilité : vérifiez quelles données il autorise, et relisez chaque résultat comme un premier jet à contrôler.",
  },
  autorise: {
    titre: "Votre cadre : liberté sous condition d'anonymisation",
    texte:
      "Sur un outil grand public, une règle avant chaque essai : aucun nom de client ou de personne, aucun numéro d'identification, aucune information qui permette de reconnaître une entreprise.",
  },
  interdit: {
    titre: "Votre cadre : progresser sans enfreindre la règle",
    texte:
      "Vérifiez d'abord ce qui est interdit exactement : l'outil, les données clients, ou tout usage de l'IA. Ensuite, entraînez-vous uniquement sur des cas fictifs, en dehors de vos dossiers, pour être prêt quand la règle évoluera.",
  },
  ne_sait_pas: {
    titre: "Votre cadre : la prudence maximale par défaut",
    texte:
      "Cette semaine, demandez la règle par écrit à votre responsable. En attendant sa réponse, agissez comme si l'envoi de données clients était interdit : travaillez uniquement sur des données fictives ou anonymisées.",
  },
};

/** Phrase d'introduction du plan, selon la question 5 (ce que le visiteur cherche). */
export const PLAN_INTRO: Record<Objectif, string> = {
  temps:
    "Pour gagner du temps dès cette semaine, ne cherchez pas à tout automatiser : confiez à l'IA la préparation de votre tâche la plus lourde, et gardez le contrôle final.",
  indispensable:
    "L'IA rend le premier jet banal, pas la responsabilité : voici comment déplacer votre temps vers l'analyse, le contrôle et le jugement, là où se joue votre valeur.",
  evoluer:
    "Savoir piloter l'IA sur les tâches de votre poste actuel est une compétence concrète, que vous pourrez montrer : c'est le point de départ le plus solide pour évoluer.",
  comprendre: "Sans discours théorique : voici ce que l'IA sait déjà faire sur votre tâche principale, et ce qui reste entre vos mains.",
};
