"use client";

import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Ligne de pointage : une case par étape du module, cochée quand elle est faite.
export function TickLine({ states, titles }: { states: StepState[]; titles: string[] }) {
  return (
    <ol className="flex gap-1.5" aria-label="Étapes du module">
      {states.map((s, i) => (
        <li
          key={i}
          title={titles[i]}
          className={cn(
            "grid h-7 flex-1 place-items-center rounded-[5px] border text-xs tabular-nums",
            s === "done" && "border-primary bg-primary text-primary-foreground",
            s === "current" && "border-primary text-primary ring-2 ring-primary/20",
            s === "todo" && "border-dashed text-muted-foreground",
          )}
        >
          {s === "done" ? <CheckIcon className="size-3.5" strokeWidth={3} aria-label="fait" /> : i + 1}
        </li>
      ))}
    </ol>
  );
}

export function ResumePanel({ refData, headingLevel = 1 }: { refData: ModuleRef; headingLevel?: 1 | 2 }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const st = moduleState(progress, refData);
  const step = refData.steps[st.current];
  if (!step) return null;
  const H = headingLevel === 1 ? "h1" : "h2";
  const action = st.finished ? "Revoir le module" : st.started ? "Reprendre" : "Commencer";

  return (
    <section aria-label="Reprendre" className="rounded-xl border bg-card p-6 sm:p-8">
      <p className="text-sm text-muted-foreground">
        {refData.formationTitle}, module {refData.module.position} : {refData.module.title}
      </p>
      <H className="mt-3 text-title text-balance">{step.title}</H>
      {step.objective && <p className="mt-3 max-w-[62ch] text-lead text-muted-foreground">{step.objective}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Button asChild size="lg" className={cn(!ready && "invisible")}>
          <Link href={stepHref(refData, step.slug)}>{action}</Link>
        </Button>
        {step.duration && <span className="text-sm text-muted-foreground">{step.duration}</span>}
      </div>
      <div className="mt-8 space-y-2">
        <TickLine states={st.states} titles={refData.steps.map((s) => s.title)} />
        <p className="text-caption text-muted-foreground">
          {st.doneCount} étape{st.doneCount > 1 ? "s" : ""} faite{st.doneCount > 1 ? "s" : ""} sur {refData.steps.length}
        </p>
      </div>
    </section>
  );
}

export function StepList({ refData }: { refData: ModuleRef }) {
  const progress = useProgress();
  const st = moduleState(progress, refData);
  return (
    <ol className="divide-y border-y">
      {refData.steps.map((s, i) => {
        const state = st.states[i];
        return (
          <li key={s.slug}>
            <Link
              href={stepHref(refData, s.slug)}
              className={cn(
                "grid grid-cols-[1.75rem_1fr_auto] items-baseline gap-x-3 py-3.5 outline-offset-2 transition-colors hover:bg-muted/50 sm:px-2",
                state === "current" && "bg-accent/50 hover:bg-accent/70",
              )}
            >
              <span className="text-sm tabular-nums text-muted-foreground">
                {state === "done" ? (
                  <CheckIcon className="inline size-4 text-primary" strokeWidth={2.5} aria-label="fait" />
                ) : (
                  `${i + 1}.`
                )}
              </span>
              <span className="min-w-0">
                <span className={cn("block", state === "current" && "font-medium")}>{s.title}</span>
                {kindLabel[s.kind] !== s.title && (
                  <span className="block text-caption text-muted-foreground">{kindLabel[s.kind]}</span>
                )}
              </span>
              <span className="text-right text-caption text-muted-foreground">
                {state === "current" && st.started ? <span className="font-medium text-primary">En cours</span> : s.duration}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
