// Comparaison des réponses de l'apprenant au défi avec les réponses attendues.
// Tolérante : accents, majuscules et ponctuation ignorés ; un numéro de compte suffit à reconnaître une ligne.

export function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Une ligne par élément ; les puces et numéros en début de ligne sont ignorés. */
export function answerLines(text: string) {
  return text
    .split(/\r?\n|;/)
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim())
    .filter((l) => normalize(l).length > 0);
}

function matches(line: string, expected: string) {
  const l = normalize(line);
  const e = normalize(expected);
  const code = e.match(/\b\d{3,}\b/)?.[0];
  if (code) return l.split(" ").includes(code);
  if (l.includes(e) || (l.length >= 4 && e.includes(l))) return true;
  const words = e.split(" ").filter((w) => w.length > 2);
  const hit = words.filter((w) => l.split(" ").includes(w)).length;
  return words.length > 0 && hit / words.length >= 0.6;
}

export interface AnswerScore {
  /** Pour chaque réponse attendue : trouvée ou non. */
  found: boolean[];
  /** Lignes de l'apprenant qui ne correspondent à aucune réponse attendue. */
  extra: string[];
  count: number;
  total: number;
}

export function scoreAnswers(text: string, expected: string[]): AnswerScore {
  const lines = answerLines(text);
  const found = expected.map((e) => lines.some((l) => matches(l, e)));
  const extra = lines.filter((l) => !expected.some((e) => matches(l, e)));
  return { found, extra, count: found.filter(Boolean).length, total: expected.length };
}
