// Métiers à venir, affichés « Prochainement » sur la vitrine (accueil, catalogue, choix du métier).
// Pour en ajouter, retirer ou reformuler un : modifier cette liste.
// Quand la formation d'un métier est publiée dans l'espace réservé, la retirer d'ici :
// elle apparaîtra alors automatiquement comme formation disponible.
// Les phrases sont à valider : elles décrivent ce que la formation apprendra, sans rien promettre de chiffré.

/** slug : adresse de la page (/formations/[slug]) ; diag : identifiant du métier dans le diagnostic. */
export type MetierAVenir = { nom: string; slug: string; diag: string; phrase: string };

export const metierAVenirParSlug = (slug: string) => METIERS_A_VENIR.find((m) => m.slug === slug) ?? null;

export const METIERS_A_VENIR: MetierAVenir[] = [
  { nom: "Comptable", slug: "comptable", diag: "comptable", phrase: "Clôturer et réviser plus vite avec l'IA, sans perdre la piste d'audit." },
  { nom: "Assistant(e) de direction", slug: "assistant-de-direction", diag: "assistant-direction", phrase: "Comptes rendus, synthèses et agendas : déléguer à l'IA, garder la main." },
  { nom: "Contrôleur de gestion", slug: "controleur-de-gestion", diag: "controleur-gestion", phrase: "Analyser les écarts et rédiger le commentaire de gestion avec l'IA." },
  { nom: "RH (paie, recrutement)", slug: "rh", diag: "rh", phrase: "Contrôler la paie et trier les candidatures avec l'IA, de façon juste et conforme." },
  { nom: "Banque back-office", slug: "banque-back-office", diag: "banque", phrase: "Traiter contrôles et rapprochements avec l'IA, en documentant chaque décision." },
  { nom: "Commercial B2B", slug: "commercial-b2b", diag: "commercial", phrase: "Préparer un rendez-vous, une proposition et ses relances avec l'IA." },
  { nom: "Juriste / avocat", slug: "juriste", diag: "juriste", phrase: "Rechercher, analyser et rédiger avec l'IA, en vérifiant chaque source." },
  { nom: "Marketing / communication", slug: "marketing-communication", diag: "marketing", phrase: "Produire et tester des contenus avec l'IA, en gardant votre ton." },
  { nom: "VC Analyst", slug: "vc-analyst", diag: "vc", phrase: "Analyser un dossier d'investissement et rédiger le mémo avec l'IA." },
  { nom: "Consultant", slug: "consultant", diag: "consultant", phrase: "Structurer une mission, analyser les données et livrer des recommandations avec l'IA." },
];

/**
 * Libellé affiché d'un métier à partir du champ « métier » d'une formation publiée.
 * Les formations gardent leur surtitre (ex. « Audit ») ; la vitrine affiche le nom du métier.
 */
const LIBELLES: Record<string, string> = { audit: "Auditeur" };
export const libelleMetier = (domaine: string) => LIBELLES[domaine.toLowerCase()] ?? domaine;
