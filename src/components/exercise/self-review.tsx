"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CircleAlertIcon, CircleCheckIcon, SparklesIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { assemble } from "@/lib/exercise/logic";
import { autoValue, formatPoints, isChecked, scoreReview, type Answers } from "@/lib/exercise/self-review";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ExerciseContent, SelfReviewContent, SelfReviewItem } from "@/lib/content/types";
import type { StepLink } from "@/components/reader/lesson-reader";
import { DeliverableParts } from "./blocks";

function Html({ html, className }: { html: string; className?: string }) {
  return <div className={cn("prose-lesson overflow-x-auto text-[0.9375rem]", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}

function ItemRow({
  item,
  checked,
  disabled,
  auto,
  danger,
  onChange,
}: {
  item: Omit<SelfReviewItem, "points"> & { points?: number };
  checked: boolean;
  disabled: boolean;
  auto: boolean;
  danger?: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = `sr-${item.id}`;
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(v) => onChange(v === true)}
          className={cn("mt-0.5", danger && "data-[state=checked]:border-destructive data-[state=checked]:bg-destructive")}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Label htmlFor={id} className={cn("leading-snug font-normal", disabled && "text-muted-foreground")}>
              {item.label}
            </Label>
            {item.points !== undefined && (
              <span className="text-caption tabular-nums text-muted-foreground">
                {formatPoints(item.points)} pt{item.points > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {auto && (
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <SparklesIcon className="size-3.5" aria-hidden /> Repéré dans vos saisies : vérifiez.
            </p>
          )}
          {disabled && item.requires && (
            <p className="text-caption text-muted-foreground">Compte seulement si l&apos;anomalie est repérée.</p>
          )}
          {item.detail && <Html html={item.detail} className="text-muted-foreground" />}
        </div>
      </div>
    </li>
  );
}

export function SelfReviewRunner({
  progressKey,
  exerciseKey,
  exerciseHref,
  stepTitle,
  moduleLabel,
  content,
  exercise,
  exitHref,
  next,
}: {
  progressKey: string;
  exerciseKey: string;
  exerciseHref: string;
  stepTitle: string;
  moduleLabel: string;
  content: SelfReviewContent;
  exercise: ExerciseContent;
  exitHref: string;
  next: StepLink | null;
}) {
  const router = useRouter();
  const ready = useProgressReady();
  const progress = useProgress();
  const inputs = progress[exerciseKey]?.inputs ?? {};
  const deposited = Boolean(progress[exerciseKey]?.done);
  const saved = progress[progressKey];
  const stored = saved?.inputs?.answers;
  const answers: Answers = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  const result = saved?.inputs?.result as Record<string, string> | undefined;

  const score = scoreReview(content, exercise, inputs, answers);
  const value = (it: Pick<SelfReviewItem, "id" | "auto">) => isChecked(it, answers, exercise, inputs);
  const byId = new Map(content.criteria.flatMap((c) => c.items.map((it) => [it.id, it] as const)));
  const isAuto = (it: Pick<SelfReviewItem, "id" | "auto">) =>
    answers[it.id] === undefined && Boolean(it.auto) && autoValue(it.auto!, exercise, inputs);

  function set(id: string, v: boolean) {
    saveStep(progressKey, { inputs: { ...saved?.inputs, answers: { ...answers, [id]: v ? "1" : "0" } } });
  }

  function record() {
    saveStep(progressKey, {
      done: true,
      inputs: {
        ...saved?.inputs,
        answers,
        result: {
          score: String(score.score),
          passed: score.passed ? "1" : "0",
          eliminated: score.eliminated ? "1" : "0",
          date: new Date().toISOString(),
        },
      },
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  const recorded = result && Number(result.score) === score.score && (result.passed === "1") === score.passed;

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter l'auto-correction">
            <Link href={exitHref}>
              <XIcon />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption text-muted-foreground">{moduleLabel}</p>
            <p className="truncate text-sm font-medium">{stepTitle}</p>
          </div>
        </div>
      </header>

      {ready && !deposited ? (
        <main className="mx-auto flex w-full max-w-[64ch] flex-1 flex-col justify-center gap-4 px-5 py-16">
          <h1 className="text-title">{content.title}</h1>
          <p className="text-lead text-muted-foreground">
            Le corrigé s&apos;ouvre une fois votre feuille de travail déposée, à la dernière étape de l&apos;exercice.
          </p>
          <div className="pt-2">
            <Button asChild size="lg">
              <Link href={exerciseHref}>Revenir à l&apos;exercice</Link>
            </Button>
          </div>
        </main>
      ) : (
        <>
          <main className="flex-1 px-5 py-10 sm:py-12">
            <div className="mx-auto max-w-3xl space-y-8">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Sur {content.total} points{content.duration ? ` · ${content.duration}` : ""}
                </p>
                <h1 className="text-title">{content.title}</h1>
                <Html html={content.intro} className="text-body" />
              </div>

              <ol className="space-y-6">
                {content.criteria.map((c, i) => {
                  const cs = score.criteria[i];
                  const mine = c.sources?.length ? assemble(exercise, inputs, [{ title: c.title, sources: c.sources }])[0] : null;
                  return (
                    <li key={c.id} className="rounded-lg border bg-card">
                      <div className="flex items-start justify-between gap-4 border-b px-4 py-3 sm:px-5">
                        <div className="space-y-1">
                          <h2 className="font-semibold">
                            {i + 1}. {c.title}
                          </h2>
                          {c.help && <p className="text-sm text-muted-foreground">{c.help}</p>}
                        </div>
                        <span className="shrink-0 font-mono text-sm tabular-nums">
                          {formatPoints(cs.score)} / {formatPoints(cs.max)}
                        </span>
                      </div>
                      <div className="space-y-4 px-4 py-4 sm:px-5">
                        {mine && (
                          <details className="rounded-md border border-dashed px-3 py-2">
                            <summary className="cursor-pointer text-sm font-medium">Ma copie</summary>
                            <div className="mt-3 space-y-3">
                              <DeliverableParts parts={mine.parts} />
                            </div>
                          </details>
                        )}
                        <ul className="divide-y">
                          {c.items.map((it) => {
                            const blocked = Boolean(it.requires) && !value(byId.get(it.requires!) ?? { id: it.requires! });
                            return (
                              <ItemRow
                                key={it.id}
                                item={it}
                                checked={value(it) && !blocked}
                                disabled={blocked}
                                auto={isAuto(it)}
                                onChange={(v) => set(it.id, v)}
                              />
                            );
                          })}
                        </ul>
                        {c.detail && (
                          <details className="rounded-md bg-muted/40 px-3 py-2">
                            <summary className="cursor-pointer text-sm font-medium">Corrigé</summary>
                            <Html html={c.detail} className="mt-2" />
                          </details>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <section className="rounded-lg border border-destructive/30 bg-card">
                <div className="space-y-1 border-b px-4 py-3 sm:px-5">
                  <h2 className="font-semibold">{content.eliminatory.title}</h2>
                  {content.eliminatory.help && <p className="text-sm text-muted-foreground">{content.eliminatory.help}</p>}
                </div>
                <ul className="divide-y px-4 py-4 sm:px-5">
                  {content.eliminatory.items.map((it) => (
                    <ItemRow
                      key={it.id}
                      item={it}
                      checked={value(it)}
                      disabled={false}
                      auto={isAuto(it)}
                      danger
                      onChange={(v) => set(it.id, v)}
                    />
                  ))}
                </ul>
              </section>

              {content.overview && (
                <section className="space-y-2 rounded-lg border-l-2 border-primary bg-muted/40 px-4 py-3">
                  <h2 className="font-semibold">{content.overview.title}</h2>
                  <Html html={content.overview.html} />
                </section>
              )}

              {recorded && result && (
                <motion.section
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  role="status"
                  className={cn(
                    "space-y-3 rounded-lg border p-5",
                    score.passed ? "border-success/40 bg-success/10" : "border-warning/50 bg-warning/10",
                  )}
                >
                  <p className="flex items-center gap-2 text-heading">
                    {score.passed ? (
                      <CircleCheckIcon className="size-6 text-success" aria-hidden />
                    ) : (
                      <CircleAlertIcon className="size-6 text-warning" aria-hidden />
                    )}
                    {formatPoints(score.score)} sur {content.total} : {score.passed ? "copie validée" : "copie à reprendre"}
                  </p>
                  <p className="text-body">
                    {score.passed
                      ? "Votre note est enregistrée : le module est validé."
                      : score.eliminated
                        ? "Un critère éliminatoire est coché : la copie revient à vous, quelle que soit la note. Corrigez la phrase en cause dans l'exercice, puis refaites l'auto-correction."
                        : `Il faut ${content.passMark} sur ${content.total}. Complétez votre feuille de travail dans l'exercice, puis refaites l'auto-correction.`}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {score.passed && next ? (
                      <Button onClick={() => router.push(next.href)}>Voir le bilan du module</Button>
                    ) : (
                      <Button asChild>
                        <Link href={exerciseHref}>Reprendre ma feuille de travail</Link>
                      </Button>
                    )}
                  </div>
                </motion.section>
              )}
            </div>
          </main>

          <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-xl tabular-nums">{formatPoints(score.score)}</span>
                <span className="text-sm text-muted-foreground">/ {content.total}</span>
                {score.eliminated ? (
                  <Badge variant="destructive">Critère éliminatoire</Badge>
                ) : (
                  <span className="hidden text-sm text-muted-foreground sm:inline">validation à {content.passMark}</span>
                )}
              </div>
              <Button size="lg" onClick={record}>
                {recorded ? "Note enregistrée" : "Enregistrer ma note"}
              </Button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
