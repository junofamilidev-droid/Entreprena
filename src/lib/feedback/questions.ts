// Le questionnaire « Donner mon avis » : six écrans, une liste de questions par écran.
// Ce fichier est la seule source : la page, le contrôle serveur (schema.ts), l'onglet « Avis »
// et l'export CSV en dépendent. Pour changer une question, c'est ici.
// Dans les libellés, « {formation} » est remplacé par le titre de la formation choisie.

export type Answer = number | string | string[] | undefined;
export type Answers = Record<string, Answer>;

interface Base {
  id: string;
  label: string;
  /** La question n'apparaît (et n'est enregistrée) que si cette condition est vraie. */
  showIf?: (a: Answers) => boolean;
}

/** Échelle 1 à 5 : « Pas du tout d'accord » → « Tout à fait d'accord ». */
export interface ScaleQ extends Base {
  kind: "scale";
}
/** Note 0 à 10. */
export interface RecoQ extends Base {
  kind: "reco";
  required: true;
}
export interface SingleQ extends Base {
  kind: "single";
  options: readonly string[];
}
export interface MultiQ extends Base {
  kind: "multi";
  options: readonly string[];
  max?: number;
  /** Cochée, cette option décoche toutes les autres (et inversement). */
  exclusive?: readonly string[];
  /** Ordre des options tiré au hasard, sauf les dernières listées ici. */
  shuffle?: { keepLast: readonly string[] };
  /** Option « Autre » suivie d'un champ texte court. */
  other?: { option: string; id: string; label: string };
}
export interface TextQ extends Base {
  kind: "text";
  max: number;
  placeholder?: string;
  /** Obligatoire quand la question est affichée. */
  required?: boolean;
  short?: boolean;
}
/** Montant de 0 à 500 €, par pas de 10, ou refus de payer. */
export interface PriceQ extends Base {
  kind: "price";
}

export type Question = ScaleQ | RecoQ | SingleQ | MultiQ | TextQ | PriceQ;

export interface Screen {
  id: string;
  title: string;
  intro?: string;
  questions: Question[];
}

export const SCALE_LABELS = { low: "Pas du tout d'accord", high: "Tout à fait d'accord" } as const;
export const RECO_LABELS = { low: "Aucune", high: "Certaine" } as const;
export const PRICE = { min: 0, max: 500, step: 10, refus: "refus" } as const;

const UTILE = [
  "La mission",
  "Les explications du tuteur",
  "Les règles de l'outil (avec / sans)",
  "Lancer l'outil sur le cas",
  "Adapter l'outil à mon cabinet",
  "La fiche à garder",
] as const;

const FORMAT_ACTUEL = "Le format actuel me convient";
const AUTRE = "Autre";

export const SCREENS: Screen[] = [
  {
    id: "interface",
    title: "L'interface",
    questions: [
      { id: "q_clarte", kind: "scale", label: "Je savais toujours quoi faire ensuite." },
      { id: "q_navigation", kind: "scale", label: "Je trouvais facilement ce que je cherchais." },
      { id: "q_apparence", kind: "scale", label: "L'interface fait professionnelle." },
      { id: "q_lisibilite", kind: "scale", label: "Les textes sont lisibles sur mon écran." },
      {
        id: "q_gene",
        kind: "multi",
        label: "Qu'est-ce qui vous a gêné ? (2 au maximum)",
        max: 2,
        options: [
          "Vocabulaire peu clair",
          "Trop d'éléments à l'écran",
          "Boutons peu visibles",
          "Texte trop petit",
          "Affichage sur téléphone",
          "Lenteur",
          "Rien ne m'a gêné",
        ],
        exclusive: ["Rien ne m'a gêné"],
      },
      { id: "t_interface", kind: "text", max: 1000, label: "Un écran ou un élément à améliorer en priorité ?" },
    ],
  },
  {
    id: "contenu",
    title: "Le contenu",
    questions: [
      { id: "q_realisme", kind: "scale", label: "Le cas pratique ressemble à une vraie mission." },
      {
        id: "q_exactitude",
        kind: "single",
        label: "Avez-vous repéré une erreur ?",
        options: ["Rien d'incorrect repéré", "J'ai un doute sur un point", "J'ai repéré une erreur"],
      },
      {
        id: "q_exactitude_ou",
        kind: "text",
        max: 1000,
        required: true,
        label: "Où ?",
        placeholder: "La session, l'étape, et ce qui vous semble faux.",
        showIf: (a) => a.q_exactitude === "J'ai un doute sur un point" || a.q_exactitude === "J'ai repéré une erreur",
      },
      { id: "q_difficulte", kind: "single", label: "La difficulté", options: ["Trop facile", "Adapté", "Trop difficile"] },
      { id: "q_duree", kind: "single", label: "La durée", options: ["Plus court que prévu", "Conforme", "Plus long que prévu"] },
      { id: "t_contenu", kind: "text", max: 1000, label: "Une remarque sur le contenu ?" },
    ],
  },
  {
    id: "pedagogie",
    title: "La pédagogie",
    questions: [
      { id: "q_format", kind: "scale", label: "Apprendre par une mission, puis en pilotant un outil, me convient." },
      { id: "q_application", kind: "scale", label: "Je sais ce que je ferais différemment dès lundi." },
      { id: "q_utile", kind: "multi", label: "Qu'est-ce qui vous a le plus servi ?", options: UTILE },
      {
        id: "q_inutile",
        kind: "multi",
        label: "Qu'est-ce qui vous a le moins servi ?",
        options: [...UTILE, "Aucun"],
        exclusive: ["Aucun"],
      },
      {
        id: "q_formats_souhaites",
        kind: "multi",
        label: "Quels formats aimeriez-vous trouver en plus ? (3 au maximum)",
        max: 3,
        options: [
          "Vidéos courtes (moins de 3 minutes)",
          "Schémas visuels et infographies",
          "Chat IA interactif (un tuteur qui répond à mes questions)",
          "Plus d'exercices interactifs",
          "Plus de cas pratiques",
          "Fiches à télécharger",
          "Échanges avec d'autres apprenants",
          FORMAT_ACTUEL,
          AUTRE,
        ],
        exclusive: [FORMAT_ACTUEL],
        shuffle: { keepLast: [FORMAT_ACTUEL, AUTRE] },
        other: { option: AUTRE, id: "q_formats_autre", label: "Lequel ?" },
      },
      {
        id: "q_format_motif",
        kind: "text",
        max: 1000,
        label: "Dans quelle situation l'utiliseriez-vous ?",
        placeholder: "Par exemple : en mission, dans le train, avant une réunion.",
        showIf: (a) => Array.isArray(a.q_formats_souhaites) && a.q_formats_souhaites.some((f) => f !== FORMAT_ACTUEL),
      },
      { id: "t_pedagogie", kind: "text", max: 1000, label: "Une remarque sur la façon d'apprendre ?" },
    ],
  },
  {
    id: "outil",
    title: "L'outil et les problèmes techniques",
    questions: [
      {
        id: "q_usage_reel",
        kind: "single",
        label: "Avez-vous utilisé l'outil sur un vrai dossier ?",
        options: ["Oui", "Pas encore, je compte le faire", "Non, mon cabinet ne l'autorise pas", "Non, il ne m'est pas utile"],
      },
      { id: "q_install", kind: "scale", label: "L'installation de l'outil s'est faite sans difficulté." },
      { id: "q_bloque", kind: "single", label: "Avez-vous rencontré un problème technique ?", options: ["Non", "Oui"] },
      {
        id: "q_bloque_type",
        kind: "single",
        label: "De quel type ?",
        options: ["Installation", "Affichage", "Connexion", "Lenteur", "Autre"],
        showIf: (a) => a.q_bloque === "Oui",
      },
      {
        id: "q_bloque_appareil",
        kind: "single",
        label: "Sur quel appareil ?",
        options: ["Ordinateur", "Téléphone", "Tablette"],
        showIf: (a) => a.q_bloque === "Oui",
      },
      {
        id: "q_bloque_navigateur",
        kind: "single",
        label: "Avec quel navigateur ?",
        options: ["Chrome", "Safari", "Edge", "Firefox", "Autre"],
        showIf: (a) => a.q_bloque === "Oui",
      },
      {
        id: "q_bloque_description",
        kind: "text",
        max: 2000,
        required: true,
        label: "Que s'est-il passé ?",
        placeholder: "Ce que vous faisiez, ce qui s'est affiché.",
        showIf: (a) => a.q_bloque === "Oui",
      },
    ],
  },
  {
    id: "prix",
    title: "La valeur et le prix",
    intro: "Vos réponses nous aident à fixer un prix juste. Répondez comme si vous payiez de votre poche.",
    questions: [
      { id: "prix_general", kind: "price", label: "Combien seriez-vous prêt à payer, de votre poche, pour une formation en ligne sur votre métier ?" },
      { id: "prix_ici", kind: "price", label: "Et pour cette formation, « {formation} », telle que vous l'avez vue ?" },
      {
        id: "t_prix_pourquoi",
        kind: "text",
        max: 1500,
        label: "Pourquoi ce montant ?",
        placeholder: "Ce qui le justifie, ou ce qui manquerait pour payer davantage.",
      },
    ],
  },
  {
    id: "global",
    title: "Pour finir",
    questions: [
      { id: "q_reco", kind: "reco", required: true, label: "Quelle probabilité de recommander cette formation à un collègue ?" },
      { id: "t_pourquoi", kind: "text", max: 1500, label: "Pourquoi cette note ?" },
      { id: "t_idees", kind: "text", max: 2000, label: "Une idée, une remarque, quelque chose que nous n'avons pas demandé ?" },
    ],
  },
];

/** Toutes les questions, champs « Autre » compris, dans l'ordre du questionnaire. */
export const ALL_QUESTIONS: Question[] = SCREENS.flatMap((s) => s.questions);

/** Identifiants autorisés dans les réponses (questions + champs « Autre »). */
export const ANSWER_KEYS: string[] = ALL_QUESTIONS.flatMap((q) => (q.kind === "multi" && q.other ? [q.id, q.other.id] : [q.id]));

export const FREE_TYPES = [
  { value: "probleme", label: "Un problème" },
  { value: "erreur", label: "Une erreur dans un contenu" },
  { value: "idee", label: "Une idée" },
  { value: "autre", label: "Autre" },
] as const;
export type FreeType = (typeof FREE_TYPES)[number]["value"];

export const STATUTS = [
  { value: "nouveau", label: "Nouveau" },
  { value: "lu", label: "Lu" },
  { value: "traite", label: "Traité" },
] as const;
export type Statut = (typeof STATUTS)[number]["value"];

export const FREE_MESSAGE = { min: 10, max: 4000 } as const;

/** Retire les réponses aux questions masquées (par exemple « Où ? » quand rien n'est signalé). */
export function visibleAnswers(a: Answers): Answers {
  const out: Answers = {};
  for (const q of ALL_QUESTIONS) {
    if (q.showIf && !q.showIf(a)) continue;
    if (a[q.id] !== undefined) out[q.id] = a[q.id];
    if (q.kind === "multi" && q.other && Array.isArray(a[q.id]) && (a[q.id] as string[]).includes(q.other.option) && a[q.other.id] !== undefined)
      out[q.other.id] = a[q.other.id];
  }
  return out;
}

/** Une case cochée dans un choix multiple, avec le plafond et les options exclusives. */
export function toggleMulti(q: MultiQ, current: string[], option: string): { next: string[]; refused?: string } {
  if (current.includes(option)) return { next: current.filter((o) => o !== option) };
  if (q.exclusive?.includes(option)) return { next: [option] };
  const base = current.filter((o) => !q.exclusive?.includes(o));
  if (q.max && base.length >= q.max) return { next: current, refused: `Choisissez-en ${q.max} au maximum.` };
  return { next: [...base, option] };
}
