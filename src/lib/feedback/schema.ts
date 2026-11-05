import { z } from "zod";
import { ALL_QUESTIONS, FREE_MESSAGE, FREE_TYPES, PRICE, visibleAnswers, type Answers, type Question } from "./questions";

// Contrôle d'un avis avant enregistrement : longueurs, plages, valeurs autorisées, plafonds.
// Les clés inconnues sont refusées. La base refait les contrôles essentiels (migration « avis »).

function fieldSchema(q: Question): z.ZodType {
  switch (q.kind) {
    case "scale":
      return z.number().int().min(1).max(5);
    case "reco":
      return z.number().int().min(0).max(10);
    case "single":
      return z.enum(q.options as [string, ...string[]]);
    case "multi": {
      let arr = z.array(z.enum(q.options as [string, ...string[]])).min(1);
      if (q.max) arr = arr.max(q.max, `${q.max} choix au maximum.`);
      return arr
        .refine((a) => new Set(a).size === a.length, "Choix en double.")
        .refine((a) => !q.exclusive?.some((x) => a.includes(x)) || a.length === 1, "Ce choix ne se combine pas avec les autres.");
    }
    case "text":
      return z.string().trim().min(1).max(q.max);
    case "price":
      return z.union([
        z.literal(PRICE.refus),
        z.number().int().min(PRICE.min).max(PRICE.max).multipleOf(PRICE.step, `Montant par pas de ${PRICE.step} €.`),
      ]);
  }
}

const shape: Record<string, z.ZodType> = {};
for (const q of ALL_QUESTIONS) {
  shape[q.id] = q.kind === "reco" ? fieldSchema(q) : fieldSchema(q).optional();
  if (q.kind === "multi" && q.other) shape[q.other.id] = z.string().trim().min(1).max(200).optional();
}

export const answersSchema = z.strictObject(shape).superRefine((raw, ctx) => {
  const a = raw as Answers;
  for (const q of ALL_QUESTIONS) {
    const shown = !q.showIf || q.showIf(a);
    if (q.kind === "text" && q.required && shown && !(typeof a[q.id] === "string" && (a[q.id] as string).trim()))
      ctx.addIssue({ code: "custom", path: [q.id], message: `« ${q.label} » : à préciser.` });
  }
});

const uuid = z.uuid();
const origin = z.string().max(300).regex(/^\/[^\s]*$/).optional();

export const freeSchema = z.strictObject({
  mode: z.literal("libre"),
  formation_id: uuid.nullable().optional(),
  type: z.enum(FREE_TYPES.map((t) => t.value) as [string, ...string[]]).optional(),
  message: z.string().trim().min(FREE_MESSAGE.min, `${FREE_MESSAGE.min} caractères au minimum.`).max(FREE_MESSAGE.max, `${FREE_MESSAGE.max} caractères au maximum.`),
  page_origine: origin,
});

export const formSchema = z.strictObject({
  mode: z.literal("formulaire"),
  formation_id: uuid.nullable().optional(),
  answers: answersSchema,
  page_origine: origin,
});

export const feedbackSchema = z.discriminatedUnion("mode", [freeSchema, formSchema]);
export type FeedbackInput = z.input<typeof feedbackSchema>;

const LABELS = new Map(ALL_QUESTIONS.map((q) => [q.id, q.label]));

/** Message lisible : les messages écrits ici sont gardés, ceux de zod (en anglais) sont traduits. */
function frenchIssue(issue: z.core.$ZodIssue | undefined): string {
  if (!issue) return "Avis invalide.";
  if (issue.path.includes("q_reco")) return "La note de recommandation (écran 6) est obligatoire.";
  if (issue.code === "unrecognized_keys") return `Réponse inconnue : ${issue.keys.join(", ")}.`;
  if (issue.code === "custom" || /[àâçéèêëîïôûù«]|maximum|minimum|Montant|Choix/.test(issue.message)) return issue.message;
  const key = issue.path.find((x) => typeof x === "string" && LABELS.has(x)) as string | undefined;
  return key ? `« ${LABELS.get(key)} » : réponse non valide.` : "Avis invalide : vérifiez vos réponses.";
}

/** Contrôle complet ; en cas de succès, renvoie la ligne à enregistrer (sans user_id). */
export function parseFeedback(input: unknown):
  | { ok: true; row: { mode: "libre" | "formulaire"; formation_id: string | null; type: string | null; message: string | null; answers: Answers | null; reco: number | null; page_origine: string | null } }
  | { ok: false; error: string } {
  const r = feedbackSchema.safeParse(input);
  if (!r.success) return { ok: false, error: frenchIssue(r.error.issues[0]) };
  const v = r.data;
  if (v.mode === "libre")
    return { ok: true, row: { mode: "libre", formation_id: v.formation_id ?? null, type: v.type ?? null, message: v.message, answers: null, reco: null, page_origine: v.page_origine ?? null } };
  const answers = visibleAnswers(v.answers as Answers);
  return {
    ok: true,
    row: { mode: "formulaire", formation_id: v.formation_id ?? null, type: null, message: null, answers, reco: answers.q_reco as number, page_origine: v.page_origine ?? null },
  };
}
