import type { Session } from "./types";

const REVIEW_MARK = /\s*\(\s*[àa] v[ée]rifier\s*\)\.?/gi;

/** Retire les mentions « (À vérifier) » laissées par les rédacteurs. */
export function stripReviewMarks(text: string) {
  return text.replace(REVIEW_MARK, "").trim();
}

function deep<T>(value: T): T {
  if (typeof value === "string") return stripReviewMarks(value) as T;
  if (Array.isArray(value)) return value.map(deep) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deep(v)])) as T;
  return value;
}

/** La session telle que l'apprenant la voit. */
export function forLearner(session: Session): Session {
  return deep(session);
}
