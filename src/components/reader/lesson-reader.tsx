"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { PromptBlock } from "./prompt-block";
import { ReaderFrame, StepComplete } from "./reader-frame";
import { cn } from "@/lib/utils";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { CheckQuestion, LessonContent } from "@/lib/content/types";

export interface StepLink {
  href: string;
  title: string;
  duration?: string | null;
}

type Screen =
  | { type: "text"; title: string; html: string; showPrompt: boolean }
  | { type: "question"; index: number; q: CheckQuestion }
  | { type: "end" };

function buildScreens(c: LessonContent): Screen[] {
  return [
    ...c.screens.map((s): Screen => ({ type: "text", title: s.title, html: s.html, showPrompt: Boolean(s.showPrompt) })),
    ...c.questions.map((q, index): Screen => ({ type: "question", index, q })),
    { type: "end" },
  ];
}

function QuestionScreen({
  q,
  index,
  total,
  chosen,
  checked,
  onChoose,
}: {
  q: CheckQuestion;
  index: number;
  total: number;
  chosen: number | undefined;
  checked: boolean;
  onChoose: (i: number) => void;
}) {
  const correct = chosen === q.answer;
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Question {index + 1} sur {total}
      </p>
      <h1 className="text-heading">{q.question}</h1>
      <RadioGroup
        value={chosen === undefined ? "" : String(chosen)}
        onValueChange={(v) => onChoose(Number(v))}
        disabled={checked}
        className="gap-3"
      >
        {q.options.map((opt, i) => {
          const id = `q${index}-o${i}`;
          return (
            <Label
              key={id}
              htmlFor={id}
              className={cn(
                "flex min-h-12 cursor-pointer items-start gap-3 rounded-md border p-4 text-body leading-snug font-normal transition-colors hover:bg-muted",
                chosen === i && !checked && "border-brand bg-brand-soft",
                checked && i === q.answer && "border-brand bg-brand-soft",
                checked && chosen === i && i !== q.answer && "border-destructive/60",
                checked && "cursor-default hover:bg-transparent",
              )}
            >
              <RadioGroupItem id={id} value={String(i)} className="mt-0.5" />
              <span className="flex-1">{opt}</span>
              {checked && i === q.answer && <CheckIcon className="mt-0.5 size-4 text-brand" aria-label="bonne réponse" />}
            </Label>
          );
        })}
      </RadioGroup>
      {checked && (
        <div role="status" className="border-l-2 border-brand pl-4 text-body">
          <p className="font-medium">{correct ? "Exact." : "Pas tout à fait."}</p>
          <p className="mt-1 text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function LessonReader({
  progressKey,
  content,
  exitHref,
  next,
}: {
  progressKey: string;
  stepTitle: string;
  moduleLabel: string;
  content: LessonContent;
  exitHref: string;
  next: StepLink | null;
}) {
  const router = useRouter();
  const ready = useProgressReady();
  const progress = useProgress();
  const saved = progress[progressKey];
  const screens = React.useMemo(() => buildScreens(content), [content]);

  const [index, setIndex] = React.useState<number | null>(null);
  // Choix en cours, pas encore vérifié. Une réponse vérifiée est enregistrée dans la progression.
  const [pick, setPick] = React.useState<Record<number, number>>({});

  // Reprise : on rouvre l'étape à l'écran où l'apprenant l'avait laissée.
  const current = index ?? (ready && saved && !saved.done ? Math.min(saved.screen, screens.length - 1) : 0);
  const screen = screens[current];
  const answers = saved?.answers ?? {};
  const questionPending = screen.type === "question" && answers[screen.index] === undefined;

  const go = React.useCallback(
    (delta: number) => {
      const target = Math.min(Math.max(current + delta, 0), screens.length - 1);
      if (target === current) return;
      setIndex(target);
      saveStep(progressKey, { screen: target, ...(target === screens.length - 1 ? { done: true } : {}) });
      window.scrollTo({ top: 0 });
    },
    [current, screens.length, progressKey],
  );

  function verify(qIndex: number) {
    const option = pick[qIndex];
    if (option === undefined) return;
    saveStep(progressKey, { answers: { ...answers, [qIndex]: option } });
  }

  const pct = ((current + 1) / screens.length) * 100;
  const end = screen.type === "end";

  const primary = end
    ? next
      ? { label: "Passer à l'étape suivante", onClick: () => router.push(next.href) }
      : { label: "Revenir au module", onClick: () => router.push(exitHref) }
    : questionPending
      ? {
          label: "Vérifier",
          onClick: () => screen.type === "question" && verify(screen.index),
          disabled: screen.type !== "question" || pick[screen.index] === undefined,
        }
      : { label: "Continuer", onClick: () => go(1) };

  return (
    <ReaderFrame
      exitHref={exitHref}
      progress={pct}
      onBack={current > 0 ? () => go(-1) : undefined}
      onNext={!end && !questionPending ? () => go(1) : undefined}
      primary={primary}
    >
      {screen.type === "text" && (
        <article className="space-y-6">
          {current === 0 && content.objective && (
            <p className="text-sm text-muted-foreground">
              Objectif : {content.objective.charAt(0).toLowerCase() + content.objective.slice(1)}
            </p>
          )}
          <h1 className="text-title text-balance">{screen.title}</h1>
          <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: screen.html }} />
          {screen.showPrompt && content.prompt && <PromptBlock {...content.prompt} />}
        </article>
      )}

      {screen.type === "question" && (
        <QuestionScreen
          q={screen.q}
          index={screen.index}
          total={content.questions.length}
          chosen={answers[screen.index] ?? pick[screen.index]}
          checked={!questionPending}
          onChoose={(o) => setPick((p) => ({ ...p, [screen.index]: o }))}
        />
      )}

      {end && <StepComplete learned={content.recap} sourcesHtml={content.sourcesHtml} next={next} />}
    </ReaderFrame>
  );
}
