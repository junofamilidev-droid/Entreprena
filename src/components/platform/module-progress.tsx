"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { resumeIndex, stepKey, useProgress, useProgressReady, type ProgressState } from "@/lib/progress/store";
import type { Module, StepKind } from "@/lib/content/types";

export interface StepRef {
  slug: string;
  title: string;
  kind: StepKind;
  duration: string | null;
  objective: string | null;
}

export interface ModuleRef {
  formationSlug: string;
  formationTitle: string;
  module: Pick<Module, "slug" | "title" | "position" | "durationLabel">;
  steps: StepRef[];
}

/** Types d'étape, pour l'espace réservé. L'apprenant, lui, ne voit que des « étapes ». */
export const kindLabel: Record<StepKind, string> = {
  lesson: "Leçon",
  quiz: "Questions",
  exercise: "Exercice guidé",
  self_review: "Auto-correction",
  module_end: "Fin du module",
};

type StepState = "done" | "current" | "todo";

export function moduleState(state: ProgressState, ref: ModuleRef) {
  const keys = ref.steps.map((s) => stepKey(ref.formationSlug, ref.module.slug, s.slug));
  const doneCount = keys.filter((k) => state[k]?.done).length;
  const started = keys.some((k) => state[k]);
  const current = resumeIndex(state, keys);
  const states: StepState[] = keys.map((k, i) => (state[k]?.done ? "done" : i === current ? "current" : "todo"));
  const lastActivity = Math.max(0, ...keys.map((k) => state[k]?.updatedAt ?? 0));
  return { doneCount, started, current, states, lastActivity, finished: doneCount === keys.length && keys.length > 0 };
}

export function stepHref(ref: ModuleRef, slug: string) {
  return `/formations/${ref.formationSlug}/${ref.module.slug}/${slug}`;
}

export function moduleHref(ref: ModuleRef) {
  return `/formations/${ref.formationSlug}/${ref.module.slug}`;
}

/** Durée affichable d'une étape : « 6 min », « 60 min ». Rien quand le contenu n'en donne pas. */
export function stepMinutes(duration: string | null | undefined) {
  const m = duration?.match(/(\d+)\s*min/);
  return m ? `${m[1]} min` : null;
}

export function ModuleProgressBar({ refData, className }: { refData: ModuleRef; className?: string }) {
  const progress = useProgress();
  const st = moduleState(progress, refData);
  const total = refData.steps.length;
  const pct = total ? Math.round((st.doneCount / total) * 100) : 0;
  return (
    <div className={cn("space-y-2", className)}>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={st.doneCount}
        aria-label="Étapes terminées dans le module"
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {st.doneCount} étape{st.doneCount > 1 ? "s" : ""} terminée{st.doneCount > 1 ? "s" : ""} sur {total}
      </p>
    </div>
  );
}

/** Le bouton principal : reprendre (ou commencer, ou revoir) l'étape en cours. */
export function ResumeButton({ refData }: { refData: ModuleRef }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const st = moduleState(progress, refData);
  const step = refData.steps[st.current];
  if (!step) return null;
  const verb = st.finished ? "Revoir" : st.started ? "Reprendre" : "Commencer";
  const minutes = stepMinutes(step.duration);
  return (
    <Link
      href={stepHref(refData, step.slug)}
      className={cn(
        "flex min-h-14 w-full items-center rounded-md bg-brand px-6 py-4 text-left text-lg font-medium text-brand-foreground transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-2",
        !ready && "invisible",
      )}
    >
      <span className="min-w-0">
        {verb} : {step.title}
        {minutes && <span className="font-normal opacity-85"> · {minutes}</span>}
      </span>
    </Link>
  );
}

const ACTION: Record<StepState, string> = { done: "Revoir", current: "Reprendre", todo: "Ouvrir" };

/** Les étapes du module, en colonne, reliées par une ligne verticale. Une action par étape. */
export function StepTrail({ refData }: { refData: ModuleRef }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const st = moduleState(progress, refData);
  return (
    <ol className="relative">
      {refData.steps.map((s, i) => {
        const state: StepState = ready ? st.states[i] : "todo";
        const current = state === "current";
        const action = current && !st.started ? "Commencer" : ACTION[state];
        const minutes = stepMinutes(s.duration);
        const last = i === refData.steps.length - 1;
        return (
          <li key={s.slug} className="relative grid grid-cols-[2rem_1fr] gap-x-4">
            {/* La ligne qui relie les étapes : pleine jusqu'à l'étape en cours, pointillée ensuite. */}
            {!last && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-10 bottom-0 left-4 -translate-x-1/2 border-l-2",
                  state === "done" ? "border-brand" : "border-dashed border-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-[1] mt-4 grid size-8 place-items-center rounded-full border-2 bg-background text-sm font-medium tabular-nums",
                state === "done" && "border-brand bg-brand text-brand-foreground",
                current && "border-brand text-brand",
                state === "todo" && "border-border text-subtle-foreground",
              )}
            >
              {state === "done" ? <CheckIcon className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <Link
              href={stepHref(refData, s.slug)}
              className={cn(
                "group my-1.5 flex items-center justify-between gap-4 rounded-md px-4 py-3 outline-offset-2",
                current ? "border border-brand/40 bg-brand-soft" : "hover:bg-muted",
              )}
            >
              <span className="min-w-0">
                <span
                  className={cn(
                    "block",
                    current && "font-semibold",
                    state === "todo" && "text-muted-foreground",
                  )}
                >
                  {s.title}
                </span>
                <span className="mt-0.5 block text-sm text-subtle-foreground">
                  {state === "done" ? "Terminée" : current ? (st.started ? "En cours" : "À faire") : "À faire"}
                  {minutes && <span className="sr-only">, </span>}
                  {minutes && <span className="ml-3 tabular-nums">{minutes}</span>}
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-md text-sm font-medium",
                  current
                    ? "bg-brand px-4 py-2 text-brand-foreground group-hover:bg-brand-hover"
                    : "px-2 py-1 text-muted-foreground group-hover:text-foreground",
                )}
              >
                {action}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
