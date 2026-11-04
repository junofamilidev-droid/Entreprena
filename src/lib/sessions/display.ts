import type { Session } from "./types";
import type { AtelierSession } from "./atelier";

// « (À vérifier) », « (À valider) » : notes des rédacteurs, à ne pas montrer aux apprenants.
const REVIEW_MARK = /\s*\(\s*[àa] (?:v[ée]rifier|valider)\s*\)/gi;

/** Retire les mentions « (À vérifier) » et « (À valider) » laissées par les rédacteurs. */
export function stripReviewMarks(text: string) {
  return text.replace(REVIEW_MARK, "").trim();
}

function deep<T>(value: T): T {
  if (typeof value === "string") return stripReviewMarks(value) as T;
  if (Array.isArray(value)) return value.map(deep) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deep(v)])) as T;
  return value;
}

/** La session telle que l'apprenant la voit (tous formats). */
export function forLearner<T extends Session | AtelierSession>(session: T): T {
  return deep(session);
}
