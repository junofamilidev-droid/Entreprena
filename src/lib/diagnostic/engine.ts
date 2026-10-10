// Moteur de diagnostic générique : il ne connaît aucune formation.
// Tout ce qui est propre à un métier (questions, pondérations, règles) vient de la configuration.

import type {
  DiagnosticCondition,
  DiagnosticConfig,
  DiagnosticGridRow,
  DiagnosticQuestion,
  Module,
} from "@/lib/content/types";

export type DiagnosticAnswers = Record<string, string | string[] | Record<string, number>>;

export interface TaskPart {
  row: DiagnosticGridRow;
  share: number;
  contribution: number;
}

export interface DiagnosticResult {
  score: number;
  band: { label: string; message: string };
  parts: TaskPart[];
  points: number;
  level: string;
  entry: { label: string; stepSlug: string | null; moduleSlug: string; reason: string };
  advice: string[];
  topTask: { part: TaskPart; text: string } | null;
  nextTask: { part: TaskPart; module: Pick<Module, "position" | "title"> } | null;
}

function gridQuestion(config: DiagnosticConfig) {
  const q = config.questions.find((x) => x.id === config.score.gridQuestion);
  if (!q || q.type !== "grid") throw new Error("Configuration de diagnostic invalide : question en grille introuvable.");
  return q;
}

export function isAnswered(q: DiagnosticQuestion, answers: DiagnosticAnswers): boolean {
  const a = answers[q.id];
  if (q.type === "grid") {
    return !!a && typeof a === "object" && !Array.isArray(a) && Object.values(a).some((v) => v > 0);
  }
  if (q.type === "single") return typeof a === "string" && a.length > 0;
  return Array.isArray(a) && a.length > 0;
}

function matches(when: DiagnosticCondition, answers: DiagnosticAnswers, level: string): boolean {
  if ("always" in when) return true;
  if ("level" in when) return when.level === level;
  const a = answers[when.question];
  const values = Array.isArray(a) ? a : typeof a === "string" ? [a] : [];
  return values.some((v) => when.in.includes(v));
}

export function computeDiagnostic(
  config: DiagnosticConfig,
  answers: DiagnosticAnswers,
  modules: Pick<Module, "position" | "title" | "slug" | "availability">[] = [],
): DiagnosticResult | null {
  const grid = gridQuestion(config);
  const raw = (answers[grid.id] ?? {}) as Record<string, number>;
  const weights = grid.rows.map((r) => Number(raw[r.id] ?? 0));
  const total = weights.reduce((s, x) => s + x, 0);
  if (!total) return null;

  const parts: TaskPart[] = grid.rows.map((row, i) => ({
    row,
    share: weights[i] / total,
    contribution: (weights[i] / total) * row.weight,
  }));
  const mean = parts.reduce((s, p) => s + p.contribution, 0);
  const score = Math.round((mean / config.score.max) * 100);
  const bands = [...config.score.bands].sort((a, b) => b.min - a.min);
  const band = bands.find((b) => score >= b.min) ?? bands[bands.length - 1];

  let points = 0;
  for (const q of config.questions) {
    if (q.type === "grid") continue;
    const a = answers[q.id];
    const chosen = Array.isArray(a) ? a : typeof a === "string" ? [a] : [];
    for (const o of q.options) if (chosen.includes(o.value)) points += o.points ?? 0;
  }
  const levels = [...config.level.bands].sort((a, b) => b.min - a.min);
  const level = (levels.find((b) => points >= b.min) ?? levels[levels.length - 1]).label;

  const rule = config.entryRules.find((r) => matches(r.when, answers, level)) ?? config.entryRules[config.entryRules.length - 1];
  const entry = { ...rule.entry, reason: rule.reason };

  const advice = config.advice
    .filter((a) => matches(a.when, answers, level))
    .map((a) => a.text.replaceAll("{entry}", entry.label));

  const sorted = [...parts].sort((a, b) => b.contribution - a.contribution);
  const moduleAt = (pos?: number) => modules.find((m) => m.position === pos);
  const entryModule = modules.find((m) => m.slug === entry.moduleSlug);

  let topTask: DiagnosticResult["topTask"] = null;
  const top = sorted[0];
  if (top && top.share > 0) {
    const m = moduleAt(top.row.modulePosition);
    let text = `Sur votre tâche la plus exposée, « ${top.row.label} » (${Math.round(top.share * 100)} % de votre temps)`;
    text += top.row.aiCan ? ` : une IA sait aujourd'hui ${top.row.aiCan}.` : ".";
    if (top.row.limit) text += ` Limite à garder en tête : ${top.row.limit}.`;
    text += m
      ? m.slug === entry.moduleSlug
        ? ` C'est la tâche du module ${m.position}.`
        : ` Elle est traitée au module ${m.position}${m.availability === "coming_soon" ? " (à venir)" : ""}.`
      : " Elle n'a pas de module dédié dans cette formation.";
    topTask = { part: top, text };
  }

  let nextTask: DiagnosticResult["nextTask"] = null;
  const next = sorted.find(
    (p) => p.share > 0 && p.row.modulePosition && p.row.modulePosition !== entryModule?.position,
  );
  const nextModule = moduleAt(next?.row.modulePosition);
  if (next && nextModule) nextTask = { part: next, module: nextModule };

  return {
    score,
    band: { label: band.label, message: band.message },
    parts: sorted,
    points,
    level,
    entry,
    advice,
    topTask,
    nextTask,
  };
}
