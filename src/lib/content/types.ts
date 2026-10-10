// Modèle de contenu, commun à toutes les formations.
// Chaque type correspond à une table de la base de données (voir supabase/migrations).
// Rien ici n'est propre à un métier : l'audit n'est qu'un jeu de données parmi d'autres.

export type PublicationStatus = "draft" | "published";
export type ModuleAvailability = "open" | "coming_soon";

export interface Formation {
  id: string;
  slug: string;
  title: string;
  /** Domaine affiché en surtitre (« Audit », « Paie »…). */
  domain: string;
  audience: string;
  promise: string;
  summary: string;
  /** Paragraphes de la page de formation. */
  forWhom: string[];
  notThis: string[];
  /** La routine de travail propre à la formation (3 à 5 étapes). */
  method: { title: string; text: string }[];
  /** Lien externe vers le tuteur IA (vide = pas encore branché). */
  tutorUrl: string | null;
  presale: { label: string; available: boolean };
  status: PublicationStatus;
  position: number;
}

export interface Module {
  id: string;
  formationId: string;
  slug: string;
  position: number;
  title: string;
  summary: string;
  deliverable: string;
  durationLabel: string | null;
  availability: ModuleAvailability;
  status: PublicationStatus;
}

export type StepKind = "lesson" | "quiz" | "exercise" | "self_review" | "module_end";

export interface Step<C = unknown> {
  id: string;
  moduleId: string;
  slug: string;
  position: number;
  kind: StepKind;
  title: string;
  content: C;
  status: PublicationStatus;
}

/* ---------------- Diagnostic ---------------- */

export interface DiagnosticOption {
  value: string;
  label: string;
  /** Points de « pratique » rapportés par cette réponse. */
  points?: number;
}

export interface DiagnosticGridRow {
  id: string;
  label: string;
  detail?: string;
  /** Niveau d'exposition estimé, de 1 à `score.max`. */
  weight: number;
  /** Ce qu'une IA sait faire sur cette tâche, et sa limite. */
  aiCan?: string;
  limit?: string;
  /** Module de la formation qui traite cette tâche (position), s'il existe. */
  modulePosition?: number;
}

export type DiagnosticQuestion =
  | {
      id: string;
      type: "single" | "multi";
      label: string;
      help?: string;
      options: DiagnosticOption[];
    }
  | {
      id: string;
      type: "grid";
      label: string;
      help?: string;
      rows: DiagnosticGridRow[];
      levels: { value: number; label: string }[];
    };

export type DiagnosticCondition =
  | { question: string; in: string[] }
  | { level: string }
  | { always: true };

export interface DiagnosticConfig {
  title: string;
  intro: string;
  durationLabel: string;
  questions: DiagnosticQuestion[];
  score: {
    /** Identifiant de la question en grille qui sert au calcul. */
    gridQuestion: string;
    max: number;
    label: string;
    bands: { min: number; label: string; message: string }[];
    note: string;
    caveat: string;
  };
  level: {
    label: string;
    /** Bonus quand une réponse à choix multiples contient une valeur. */
    bonuses?: { question: string; value: string; points: number }[];
    bands: { min: number; label: string }[];
    note: string;
  };
  /** Règles de recommandation, testées dans l'ordre : la première qui s'applique gagne. */
  entryRules: {
    when: DiagnosticCondition;
    entry: { label: string; stepSlug: string | null; moduleSlug: string };
    reason: string;
  }[];
  /** Conseils personnalisés, tous ceux qui s'appliquent sont affichés. */
  advice: { when: DiagnosticCondition; text: string }[];
}

export interface Diagnostic {
  id: string;
  formationId: string;
  config: DiagnosticConfig;
  status: PublicationStatus;
}

export interface FormationWithModules extends Formation {
  modules: Module[];
  hasDiagnostic: boolean;
}
