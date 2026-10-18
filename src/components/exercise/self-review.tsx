"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleAlertIcon, CircleCheckIcon, SparklesIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { assemble } from "@/lib/exercise/logic";
import { autoValue, formatPoints, isChecked, scoreReview, type Answers } from "@/lib/exercise/self-review";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ExerciseContent, SelfReviewContent, SelfReviewItem } from "@/lib/content/types";
import type { StepLink } from "@/components/reader/lesson-reader";
import { DeliverableParts } from "./blocks";
import { ReaderFrame } from "@/components/reader/reader-frame";
import { stepMinutes } from "@/components/platform/module-progress";

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

  const primary = !deposited
    ? { label: "Revenir à l'exercice", onClick: () => router.push(exerciseHref) }
    : recorded && score.passed && next
      ? { label: "Passer à l'étape suivante", onClick: () => router.push(next.href) }
      : recorded && !score.passed
        ? { label: "Reprendre mon travail", onClick: () => router.push(exerciseHref) }
        : { label: "Enregistrer ma note", onClick: record };

  return (
    <ReaderFrame
      exitHref={exitHref}
      progress={deposited ? (recorded ? 100 : 50) : 0}
      wide
      primary={ready ? primary : null}
      footerStart={
        deposited ? (
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm text-muted-foreground">
            <span className="text-xl font-semibold text-foreground tabular-nums">{formatPoints(score.score)}</span>
            <span>sur {content.total}</span>
            {score.eliminated ? (
              <span className="font-medium text-destructive">critère éliminatoire</span>
            ) : (
              <span className="hidden sm:inline">validation à {content.passMark}</span>
            )}
          </p>
        ) : null
      }
    >
      {ready && !deposited ? (
        <div className="space-y-4 py-8">
          <h1 className="text-title">{content.title}</h1>
          <p className="text-lead text-muted-foreground">
            Le corrigé s&apos;ouvre une fois votre travail déposé, à la fin de l&apos;exercice.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sur {content.total} points
              {stepMinutes(content.duration) && <span className="ml-3">{stepMinutes(content.duration)}</span>}
            </p>
            <h1 className="text-title">{content.title}</h1>
            <Html html={content.intro} className="text-body" />
          </div>

          <ol className="space-y-10">
            {content.criteria.map((c, i) => {
              const cs = score.criteria[i];
              const mine = c.sources?.length ? assemble(exercise, inputs, [{ title: c.title, sources: c.sources }])[0] : null;
              return (
                <li key={c.id} className="space-y-4 border-t pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-heading">
                        {i + 1}. {c.title}
                      </h2>
                      {c.help && <p className="text-sm text-muted-foreground">{c.help}</p>}
                    </div>
                    <span className="shrink-0 text-base font-medium tabular-nums">
                      {formatPoints(cs.score)} / {formatPoints(cs.max)}
                    </span>
                  </div>
                  {mine && (
                    <details className="border-l-2 pl-4">
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
                    <details className="border-l-2 border-brand pl-4">
                      <summary className="cursor-pointer text-sm font-medium">Corrigé</summary>
                      <Html html={c.detail} className="mt-2" />
                    </details>
                  )}
                </li>
              );
            })}
          </ol>

          <section className="space-y-4 border-t-2 border-destructive/50 pt-6">
            <div className="space-y-1">
              <h2 className="text-heading">{content.eliminatory.title}</h2>
              {content.eliminatory.help && <p className="text-sm text-muted-foreground">{content.eliminatory.help}</p>}
            </div>
            <ul className="divide-y">
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
            <section className="space-y-2 border-l-2 border-brand pl-4">
              <h2 className="font-semibold">{content.overview.title}</h2>
              <Html html={content.overview.html} />
            </section>
          )}

          {recorded && result && (
            <section role="status" className="space-y-3 border-t pt-6">
              <p className="flex items-center gap-2 text-heading">
                {score.passed ? (
                  <CircleCheckIcon className="size-6 text-brand" aria-hidden />
                ) : (
                  <CircleAlertIcon className="size-6 text-warning" aria-hidden />
                )}
                {formatPoints(score.score)} sur {content.total} : {score.passed ? "copie validée" : "copie à reprendre"}
              </p>
              <p className="text-body text-muted-foreground">
                {score.passed
                  ? "Votre note est enregistrée. L'étape suivante vous donne votre attestation."
                  : score.eliminated
                    ? "Un critère éliminatoire est coché : la copie revient à vous, quelle que soit la note. Corrigez la phrase en cause dans l'exercice, puis refaites l'auto-correction."
                    : `Il faut ${content.passMark} sur ${content.total}. Complétez votre feuille de travail dans l'exercice, puis refaites l'auto-correction.`}
              </p>
            </section>
          )}
        </div>
      )}
    </ReaderFrame>
  );
}
