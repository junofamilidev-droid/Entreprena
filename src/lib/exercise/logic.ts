// Logique de l'exercice guidé, sans interface : contrôles de valeurs, relecture automatique,
// assemblage du livrable. Tout dépend du contenu, rien n'est propre à un métier.

import type {
  DeliverableSectionDef,
  ExerciseBlock,
  ExerciseContent,
  ExerciseInputs,
  ReviewRule,
  TableColumn,
  ValueCheck,
} from "@/lib/content/types";

type InputBlock = Extract<ExerciseBlock, { id: string }>;

/** Tous les blocs qui recueillent une saisie, par identifiant. */
export function inputBlocks(content: ExerciseContent): Map<string, InputBlock> {
  const map = new Map<string, InputBlock>();
  const all = [...content.intro.blocks, ...content.parts.flatMap((p) => p.blocks)];
  for (const b of all) if ("id" in b) map.set(b.id, b);
  return map;
}

/* ---------------- Valeurs attendues ---------------- */

/** Lit un montant écrit à la française : « 19 666 000 », « 19.666.000 € », « 1 234,5 ». */
export function parseAmount(raw: string): number | null {
  let s = raw.toLowerCase().replace(/euros?|€/g, "").replace(/[\s  ']/g, "");
  if (!s) return null;
  // Points séparateurs de milliers (« 19.666.000 ») : on les retire.
  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, "");
  s = s.replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

export type CheckState = "empty" | "invalid" | "ok" | "mismatch";

export function checkValue(check: ValueCheck, raw: string | undefined): CheckState {
  if (!raw?.trim()) return "empty";
  const n = parseAmount(raw);
  if (n === null) return "invalid";
  return Math.abs(n - check.expected) <= (check.tolerance ?? 0) ? "ok" : "mismatch";
}

/* ---------------- Relecture automatique ---------------- */

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’`]/g, "'");
}

export interface ReviewFinding {
  rule: ReviewRule;
  fieldId: string;
  fieldLabel: string;
  /** La phrase concernée, telle que l'apprenant l'a écrite. */
  sentence: string;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function review(fields: { id: string; label: string; text: string }[], rules: ReviewRule[]): ReviewFinding[] {
  const compiled = rules.map((rule) => ({ rule, res: rule.patterns.map((p) => new RegExp(p, "i")) }));
  const findings: ReviewFinding[] = [];
  for (const f of fields) {
    for (const sentence of sentences(f.text)) {
      const plain = normalize(sentence);
      for (const { rule, res } of compiled) {
        if (res.some((re) => re.test(plain))) findings.push({ rule, fieldId: f.id, fieldLabel: f.label, sentence });
      }
    }
  }
  return findings;
}

/** Les textes relus par un bloc `review` : champs de saisie et cellules de tableau. */
export function reviewFields(content: ExerciseContent, inputs: ExerciseInputs, sources: string[]) {
  const blocks = inputBlocks(content);
  const fields: { id: string; label: string; text: string }[] = [];
  for (const id of sources) {
    const b = blocks.get(id);
    const v = inputs[id];
    if (!b || v === undefined) continue;
    if (b.type === "input" && typeof v === "string") fields.push({ id, label: b.label, text: v });
    if (b.type === "table" && Array.isArray(v)) {
      v.forEach((row, i) =>
        b.columns.forEach((c) => {
          if (row[c.id]) fields.push({ id, label: `${b.title}, ligne ${i + 1}, ${c.label}`, text: row[c.id] });
        }),
      );
    }
  }
  return fields;
}

/* ---------------- Tableaux ---------------- */

export function filledRows(rows: Record<string, string>[] | undefined, columns: TableColumn[]) {
  return (rows ?? []).filter((r) => columns.some((c) => r[c.id]?.trim()));
}

/** Tableau en texte, pour le coller dans un assistant ou un document. */
export function tableToText(columns: TableColumn[], rows: Record<string, string>[]): string {
  return filledRows(rows, columns)
    .map((r, i) =>
      [`${i + 1}.`, ...columns.filter((c) => r[c.id]?.trim()).map((c) => `   ${c.label} : ${r[c.id].trim()}`)].join("\n"),
    )
    .join("\n\n");
}

/* ---------------- Livrable ---------------- */

export type DeliverablePart =
  | { kind: "text"; label: string | null; text: string }
  | { kind: "table"; columns: TableColumn[]; rows: Record<string, string>[] }
  | { kind: "missing"; label: string };

export interface DeliverableSection {
  title: string;
  /** Numéro affiché, ou null pour une section hors numérotation. */
  number: number | null;
  parts: DeliverablePart[];
}

export function assemble(
  content: ExerciseContent,
  inputs: ExerciseInputs,
  sections: DeliverableSectionDef[],
): DeliverableSection[] {
  const blocks = inputBlocks(content);
  let n = 0;
  return sections.map((s) => {
    const number = s.unnumbered ? null : ++n;
    const labelled = s.sources.length > 1;
    const parts: DeliverablePart[] = s.sources.flatMap((id): DeliverablePart[] => {
      const b = blocks.get(id);
      const v = inputs[id];
      if (!b) return [];
      if (b.type === "input") {
        const text = (typeof v === "string" ? v : (b.defaultValue ?? "")).trim();
        return [text ? { kind: "text", label: labelled ? b.label : null, text } : { kind: "missing", label: b.label }];
      }
      if (b.type === "table") {
        const rows = filledRows(Array.isArray(v) ? v : [], b.columns);
        return [rows.length ? { kind: "table", columns: b.columns, rows } : { kind: "missing", label: b.title }];
      }
      if (b.type === "checks") {
        const values = v && !Array.isArray(v) && typeof v === "object" ? v : {};
        const lines = b.items
          .filter((c) => values[c.id]?.trim())
          .map((c) => {
            const st = checkValue(c, values[c.id]);
            return `${c.label} : ${values[c.id].trim()} (${st === "ok" ? "conforme au fichier" : "écart avec le fichier"})`;
          });
        return [lines.length ? { kind: "text", label: labelled ? b.title : null, text: lines.join("\n") } : { kind: "missing", label: b.title }];
      }
      return [];
    });
    return { title: s.title, number, parts };
  });
}

export function deliverableToText(title: string, sections: DeliverableSection[]): string {
  const out = [title.toUpperCase(), ""];
  sections.forEach((s) => {
    out.push(s.number ? `${s.number}. ${s.title}` : s.title, "");
    for (const p of s.parts) {
      if (p.kind === "text") out.push(...(p.label ? [`${p.label} :`] : []), p.text, "");
      if (p.kind === "table") out.push(tableToText(p.columns, p.rows), "");
      if (p.kind === "missing") out.push(`[${p.label} : à compléter]`, "");
    }
  });
  return out.join("\n").trim() + "\n";
}
