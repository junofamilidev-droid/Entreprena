// Exemples de mission par métier, utilisés par les écrans de la vitrine (haut de page, « En mission »,
// « Comment ça marche », tableau du constat). Le visiteur choisit son métier, les écrans s'adaptent.
// Audit : contenu réel de la formation (dossier fictif Nordelia). Autres métiers : exemples illustratifs,
// affichés avec la mention « Exemple · formation en préparation ». À relire et ajuster ici.

export type Exemple = {
  id: string;
  /** Doit correspondre au nom dans metiers.ts, ou au métier (domain) d'une formation publiée. */
  metier: string;
  mission: { de: string; objet: string; message: string; livrable: string };
  outil: { nom: string; regles: string[]; regleActive: number; avec: string; sans: string };
  verifs: string[];
  fiche: { titre: string; etapes: string[]; piege: string };
  /** Tableau « Qui fait quoi » : ce que Claude prépare, ce que vous gardez. */
  taches: { task: string; by: "claude" | "vous" }[];
};

export const EXEMPLES: Exemple[] = [
  {
    id: "audit",
    metier: "Audit",
    mission: {
      de: "Claire Moreau, cheffe de mission",
      objet: "Nordelia : revue analytique avant jeudi",
      message: "Peux-tu me préparer la revue analytique de la balance 2025, seuils 50 000 € et 10 %, avec une question au client par compte retenu ?",
      livrable: "La note de revue analytique",
    },
    outil: {
      nom: "Revue analytique",
      regles: ["Signe des écarts", "Deux seuils", "Pas de conclusion"],
      regleActive: 1,
      avec: "5 comptes retenus : 408100, 411000, 471000, 622600, 645100.",
      sans: "12 comptes retenus, dont les ventes qui suivent l'activité.",
    },
    verifs: ["Les 5 comptes à creuser", "L'écart du 411000 recalculé", "Une question sur la balance âgée"],
    fiche: { titre: "Revue analytique avec l'outil", etapes: ["Anonymiser la balance", "Joindre la balance et le contexte", "Recalculer un écart à la main", "Envoyer les questions au client"], piege: "Croire un pourcentage sans le vérifier" },
    taches: [
      { task: "Trier les 81 comptes de la balance", by: "claude" },
      { task: "Calculer les écarts N / N-1", by: "claude" },
      { task: "Rédiger un premier jet de la note", by: "claude" },
      { task: "Juger les écarts qui comptent", by: "vous" },
      { task: "Recalculer un échantillon à la main", by: "vous" },
      { task: "Signer et envoyer au client", by: "vous" },
    ],
  },
  {
    id: "comptable",
    metier: "Comptable",
    mission: { de: "Julien Arnaud, expert-comptable", objet: "Clôture de mars : rapprochements", message: "Peux-tu préparer les rapprochements bancaires de mars et me lister les écritures en suspens de plus de 30 jours ?", livrable: "L'état de rapprochement commenté" },
    outil: { nom: "Rapprochement bancaire", regles: ["Montant et date", "Libellés proches", "Pas d'écriture forcée"], regleActive: 2, avec: "4 suspens signalés, aucune écriture passée sans pièce.", sans: "Écarts soldés par une écriture d'attente." },
    verifs: ["Solde bancaire égal au relevé", "Les 4 suspens justifiés", "Aucune écriture sans pièce"],
    fiche: { titre: "Rapprochement avec l'outil", etapes: ["Exporter le relevé et le grand livre", "Lancer le rapprochement", "Contrôler chaque suspens", "Documenter les écarts restants"], piege: "Solder un écart sans justificatif" },
    taches: [
      { task: "Pointer 412 lignes de relevé", by: "claude" },
      { task: "Proposer les correspondances", by: "claude" },
      { task: "Lister les suspens", by: "claude" },
      { task: "Qualifier chaque suspens", by: "vous" },
      { task: "Demander les pièces manquantes", by: "vous" },
      { task: "Valider la clôture", by: "vous" },
    ],
  },
  {
    id: "assistant-direction",
    metier: "Assistant(e) de direction",
    mission: { de: "Sophie Lemaire, directrice générale", objet: "Comité de direction de lundi", message: "Peux-tu préparer le dossier du codir : ordre du jour, synthèse des points ouverts et compte rendu du mois dernier ?", livrable: "Le dossier du comité de direction" },
    outil: { nom: "Dossier de réunion", regles: ["Une page par sujet", "Décisions attendues", "Rien d'inventé"], regleActive: 2, avec: "3 décisions attendues, chacune reliée à un document.", sans: "Une synthèse qui ajoute des chiffres absents des notes." },
    verifs: ["Tous les points ouverts repris", "Les décisions attendues claires", "Aucun chiffre inventé"],
    fiche: { titre: "Dossier de codir avec l'outil", etapes: ["Rassembler notes et comptes rendus", "Générer la synthèse", "Relire les décisions attendues", "Envoyer le dossier 48 h avant"], piege: "Laisser passer un chiffre non sourcé" },
    taches: [
      { task: "Résumer 14 comptes rendus", by: "claude" },
      { task: "Rédiger l'ordre du jour", by: "claude" },
      { task: "Mettre en forme le dossier", by: "claude" },
      { task: "Choisir les priorités", by: "vous" },
      { task: "Vérifier chaque chiffre", by: "vous" },
      { task: "Envoyer à la direction", by: "vous" },
    ],
  },
  {
    id: "controleur-gestion",
    metier: "Contrôleur de gestion",
    mission: { de: "Marc Dubois, directeur financier", objet: "Reporting de février", message: "Peux-tu analyser les écarts budget / réalisé de février et rédiger le commentaire de gestion pour le comité ?", livrable: "Le commentaire de gestion" },
    outil: { nom: "Analyse d'écarts", regles: ["Seuil de matérialité", "Volume et prix", "Causes à confirmer"], regleActive: 1, avec: "Écart achats décomposé : 70 % volume, 30 % prix.", sans: "Un écart global, sans cause identifiable." },
    verifs: ["Les écarts au-dessus du seuil", "La décomposition volume / prix", "Chaque cause confirmée"],
    fiche: { titre: "Commentaire de gestion avec l'outil", etapes: ["Charger budget et réalisé", "Lancer l'analyse d'écarts", "Confirmer les causes avec les opérationnels", "Rédiger le commentaire"], piege: "Écrire une cause sans l'avoir confirmée" },
    taches: [
      { task: "Calculer les écarts par centre de coût", by: "claude" },
      { task: "Décomposer volume et prix", by: "claude" },
      { task: "Rédiger un premier commentaire", by: "claude" },
      { task: "Confirmer les causes", by: "vous" },
      { task: "Arbitrer ce qui remonte", by: "vous" },
      { task: "Présenter au comité", by: "vous" },
    ],
  },
  {
    id: "rh",
    metier: "RH (paie, recrutement)",
    mission: { de: "Nadia Benali, DRH", objet: "Paie d'avril : contrôles", message: "Peux-tu contrôler les variables de paie d'avril et me signaler les anomalies avant la clôture de jeudi ?", livrable: "La liste des anomalies à traiter" },
    outil: { nom: "Contrôle de paie", regles: ["Écart au mois précédent", "Règles conventionnelles", "Données anonymisées"], regleActive: 1, avec: "3 primes hors convention signalées.", sans: "Toutes les hausses signalées, sans distinction." },
    verifs: ["Les 3 anomalies justifiées", "Les règles de la convention appliquées", "Aucune donnée nominative partagée"],
    fiche: { titre: "Contrôle de paie avec l'outil", etapes: ["Anonymiser l'export de paie", "Lancer les contrôles", "Vérifier chaque anomalie", "Corriger avant la clôture"], piege: "Corriger sans vérifier la convention" },
    taches: [
      { task: "Comparer 230 bulletins à mars", by: "claude" },
      { task: "Repérer les variables inhabituelles", by: "claude" },
      { task: "Préparer la liste d'anomalies", by: "claude" },
      { task: "Vérifier la règle applicable", by: "vous" },
      { task: "Décider des corrections", by: "vous" },
      { task: "Valider la paie", by: "vous" },
    ],
  },
  {
    id: "banque",
    metier: "Banque back-office",
    mission: { de: "Thomas Girard, responsable des opérations", objet: "Dossiers KYC à revoir", message: "Peux-tu revoir les 20 dossiers KYC en attente et me dire lesquels sont complets, avec les pièces manquantes pour les autres ?", livrable: "La revue des dossiers KYC" },
    outil: { nom: "Revue de dossiers", regles: ["Liste de pièces", "Dates de validité", "Décision tracée"], regleActive: 1, avec: "2 pièces d'identité expirées repérées.", sans: "Dossiers jugés complets malgré une pièce périmée." },
    verifs: ["Les pièces obligatoires présentes", "Les dates de validité contrôlées", "La décision documentée"],
    fiche: { titre: "Revue KYC avec l'outil", etapes: ["Extraire les dossiers en attente", "Lancer la revue", "Contrôler les cas signalés", "Tracer chaque décision"], piege: "Valider un dossier sur une pièce périmée" },
    taches: [
      { task: "Lire 20 dossiers clients", by: "claude" },
      { task: "Vérifier la liste des pièces", by: "claude" },
      { task: "Signaler les manques", by: "claude" },
      { task: "Trancher les cas limites", by: "vous" },
      { task: "Documenter la décision", by: "vous" },
      { task: "Valider l'entrée en relation", by: "vous" },
    ],
  },
  {
    id: "commercial",
    metier: "Commercial B2B",
    mission: { de: "Laura Petit, directrice commerciale", objet: "Rendez-vous Vertex jeudi", message: "Peux-tu préparer le rendez-vous avec Vertex : leurs enjeux, nos références proches et une proposition en trois options ?", livrable: "Le brief de rendez-vous" },
    outil: { nom: "Préparation de rendez-vous", regles: ["Sources citées", "Trois options", "Questions ouvertes"], regleActive: 0, avec: "Chaque enjeu relié à une source publique.", sans: "Des enjeux plausibles mais invérifiables." },
    verifs: ["Chaque enjeu sourcé", "Trois options chiffrées", "Cinq questions ouvertes"],
    fiche: { titre: "Brief de rendez-vous avec l'outil", etapes: ["Rassembler sources et historique", "Générer le brief", "Vérifier chaque enjeu", "Adapter la proposition"], piege: "Citer un enjeu non vérifié au client" },
    taches: [
      { task: "Synthétiser 12 sources publiques", by: "claude" },
      { task: "Trouver les références proches", by: "claude" },
      { task: "Rédiger trois options", by: "claude" },
      { task: "Vérifier les enjeux", by: "vous" },
      { task: "Choisir la stratégie", by: "vous" },
      { task: "Mener le rendez-vous", by: "vous" },
    ],
  },
  {
    id: "juriste",
    metier: "Juriste / avocat",
    mission: { de: "Me Claire Roux, associée", objet: "Contrat de distribution Alba", message: "Peux-tu revoir le contrat de distribution d'Alba et me lister les clauses à risque, avec une proposition de rédaction ?", livrable: "La note de revue du contrat" },
    outil: { nom: "Revue de contrat", regles: ["Clauses à risque", "Sources vérifiables", "Pas d'avis définitif"], regleActive: 1, avec: "Chaque risque renvoie à un article du code cité.", sans: "Une jurisprudence citée qui n'existe pas." },
    verifs: ["Les clauses à risque repérées", "Chaque source vérifiée", "Les propositions de rédaction"],
    fiche: { titre: "Revue de contrat avec l'outil", etapes: ["Anonymiser le contrat", "Lancer la revue", "Vérifier chaque source citée", "Rédiger la note"], piege: "Reprendre une référence sans la vérifier" },
    taches: [
      { task: "Lire 38 pages de contrat", by: "claude" },
      { task: "Repérer les clauses sensibles", by: "claude" },
      { task: "Proposer des rédactions", by: "claude" },
      { task: "Vérifier chaque source", by: "vous" },
      { task: "Apprécier le risque", by: "vous" },
      { task: "Conseiller le client", by: "vous" },
    ],
  },
  {
    id: "marketing",
    metier: "Marketing / communication",
    mission: { de: "Inès Martin, responsable marketing", objet: "Lancement de l'offre Pro", message: "Peux-tu préparer la campagne de lancement : messages clés, trois e-mails et les publications de la semaine ?", livrable: "Le kit de campagne" },
    outil: { nom: "Kit de campagne", regles: ["Ton de la marque", "Une promesse par message", "Rien d'exagéré"], regleActive: 0, avec: "Trois e-mails dans le ton de la marque.", sans: "Des superlatifs que la marque n'utilise pas." },
    verifs: ["Le ton de la marque respecté", "Une promesse par message", "Aucune affirmation non prouvée"],
    fiche: { titre: "Campagne avec l'outil", etapes: ["Charger la charte et l'offre", "Générer les contenus", "Relire le ton et les promesses", "Planifier la diffusion"], piege: "Publier une promesse impossible à tenir" },
    taches: [
      { task: "Rédiger 3 e-mails et 5 posts", by: "claude" },
      { task: "Décliner les messages clés", by: "claude" },
      { task: "Proposer des variantes à tester", by: "claude" },
      { task: "Garder le ton juste", by: "vous" },
      { task: "Vérifier chaque promesse", by: "vous" },
      { task: "Valider la diffusion", by: "vous" },
    ],
  },
  {
    id: "vc",
    metier: "VC analyst",
    mission: { de: "Hugo Lambert, partner", objet: "Dossier Nexa avant le comité", message: "Peux-tu analyser le dossier Nexa : marché, concurrence, unit economics, et préparer le mémo pour le comité ?", livrable: "Le mémo d'investissement" },
    outil: { nom: "Mémo d'investissement", regles: ["Chiffres sourcés", "Risques explicites", "Hypothèses séparées"], regleActive: 2, avec: "Les hypothèses de croissance isolées et testées.", sans: "Des projections du fondateur reprises comme des faits." },
    verifs: ["Chaque chiffre sourcé", "Les risques listés", "Les hypothèses séparées des faits"],
    fiche: { titre: "Mémo avec l'outil", etapes: ["Charger le data room", "Générer l'analyse", "Recouper les chiffres clés", "Rédiger la recommandation"], piege: "Prendre une projection pour un fait" },
    taches: [
      { task: "Lire le data room (60 documents)", by: "claude" },
      { task: "Calculer les unit economics", by: "claude" },
      { task: "Rédiger un premier mémo", by: "claude" },
      { task: "Recouper les chiffres", by: "vous" },
      { task: "Évaluer l'équipe", by: "vous" },
      { task: "Recommander au comité", by: "vous" },
    ],
  },
  {
    id: "conseil",
    metier: "Conseil",
    mission: { de: "Paul Henry, manager", objet: "Diagnostic achats Orbis", message: "Peux-tu analyser les dépenses achats d'Orbis et préparer trois pistes d'économies pour l'atelier de mardi ?", livrable: "Le diagnostic et les trois pistes" },
    outil: { nom: "Diagnostic", regles: ["Données d'abord", "Trois pistes maximum", "Hypothèses visibles"], regleActive: 1, avec: "Trois pistes chiffrées, avec leurs hypothèses.", sans: "Dix pistes génériques, non priorisées." },
    verifs: ["Les données nettoyées", "Les trois pistes chiffrées", "Les hypothèses visibles"],
    fiche: { titre: "Diagnostic avec l'outil", etapes: ["Anonymiser les données client", "Lancer l'analyse", "Challenger les pistes", "Préparer l'atelier"], piege: "Présenter une hypothèse comme un constat" },
    taches: [
      { task: "Nettoyer 8 000 lignes de dépenses", by: "claude" },
      { task: "Classer par catégorie", by: "claude" },
      { task: "Proposer des pistes", by: "claude" },
      { task: "Prioriser avec le client", by: "vous" },
      { task: "Challenger les hypothèses", by: "vous" },
      { task: "Animer l'atelier", by: "vous" },
    ],
  },
];

export const exempleDe = (metier: string) => EXEMPLES.find((e) => e.metier.toLowerCase() === metier.toLowerCase()) ?? EXEMPLES[0];
