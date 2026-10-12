// Auto-correction : cases pré-cochées d'après les saisies, calcul de la note.

import type {
  AutoCheck,
  ExerciseContent,
  ExerciseInputs,
  SelfReviewContent,
  SelfReviewItem,
} from "@/lib/content/types";
import { filledRows, inputBlocks, normalize, review, reviewFields } from "./logic";

/** Ce que les saisies de l'exercice permettent de cocher d'office. */
export function autoValue(auto: AutoCheck, exercise: ExerciseContent, inputs: ExerciseInputs): boolean {
  switch (auto.type) {
    case "filled": {
      const blocks = inputBlocks(exercise);
      return auto.sources.every((id) => {
        const v = inputs[id];
        const b = blocks.get(id);
        if (typeof v === "string") return v.trim() !== "";
        if (Array.isArray(v) && b?.type === "table") return filledRows(v, b.columns).length > 0;
        return false;
      });
    }
    case "checks": {
      const v = inputs[auto.id];
      const values = v && typeof v === "object" && !Array.isArray(v) ? v : {};
      return auto.items.every((k) => values[k]?.trim());
    }
    case "rows": {
      const b = inputBlocks(exercise).get(auto.tableId);
      const v = inputs[auto.tableId];
      return b?.type === "table" && Array.isArray(v) && filledRows(v, b.columns).length >= auto.min;
    }
    case "matches": {
      const v = inputs[auto.source];
      const text = typeof v === "string" ? normalize(v) : "";
      return auto.patterns.some((p) => new RegExp(p, "i").test(text));
    }
    case "review": {
      const rules = (exercise.reviewRules ?? []).filter((r) => auto.ruleIds.includes(r.id));
      return review(reviewFields(exercise, inputs, auto.sources), rules).length > 0;
    }
  }
}

export type Answers = Record<string, string>;

/** Valeur d'une case : le choix de l'apprenant, sinon la valeur déduite des saisies. */
export function isChecked(
  item: Pick<SelfReviewItem, "id" | "auto">,
  answers: Answers,
  exercise: ExerciseContent,
  inputs: ExerciseInputs,
): boolean {
  const stored = answers[item.id];
  if (stored === "1") return true;
  if (stored === "0") return false;
  return item.auto ? autoValue(item.auto, exercise, inputs) : false;
}

export function scoreReview(content: SelfReviewContent, exercise: ExerciseContent, inputs: ExerciseInputs, answers: Answers) {
  const checked = (item: Pick<SelfReviewItem, "id" | "auto">) => isChecked(item, answers, exercise, inputs);
  const criteria = content.criteria.map((c) => {
    const raw = c.items.reduce((sum, it) => {
      const ok = checked(it) && (!it.requires || checked({ id: it.requires, auto: findItem(content, it.requires)?.auto }));
      return sum + (ok ? it.points : 0);
    }, 0);
    return { id: c.id, score: Math.min(raw, c.points), max: c.points };
  });
  const score = criteria.reduce((s, c) => s + c.score, 0);
  const eliminatedBy = content.eliminatory.items.filter((it) => checked(it)).map((it) => it.id);
  const eliminated = eliminatedBy.length > 0;
  return { criteria, score, eliminated, eliminatedBy, passed: score >= content.passMark && !eliminated };
}

function findItem(content: SelfReviewContent, id: string) {
  for (const c of content.criteria) for (const it of c.items) if (it.id === id) return it;
  return undefined;
}

/** 15,5 et non 15.5. */
export function formatPoints(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(n);
}
