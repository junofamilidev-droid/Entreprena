"use client";

import * as React from "react";
import { WhereSaved } from "@/components/auth/where-saved";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PromptBlock } from "./prompt-block";
import { cn } from "@/lib/utils";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { CheckQuestion, LessonContent } from "@/lib/content/types";

export interface StepLink {
  href: string;
  title: string;
}

type Screen =
  | { type: "text"; title: string; html: string; showPrompt: boolean }
  | { type: "question"; index: number; q: CheckQuestion }
  | { type: "recap" };

function buildScreens(c: LessonContent): Screen[] {
  return [
    ...c.screens.map((s): Screen => ({ type: "text", title: s.title, html: s.html, showPrompt: Boolean(s.showPrompt) })),
    ...c.questions.map((q, index): Screen => ({ type: "question", index, q })),
    { type: "recap" },
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
      <h2 className="text-heading">{q.question}</h2>
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
                "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-body leading-snug font-normal transition-colors hover:bg-muted/60",
                chosen === i && !checked && "border-primary bg-accent/60",
                checked && i === q.answer && "border-success/60 bg-success/10",
                checked && chosen === i && i !== q.answer && "border-destructive/50 bg-destructive/5",
                checked && "cursor-default hover:bg-transparent",
              )}
            >
              <RadioGroupItem id={id} value={String(i)} className="mt-0.5" />
              <span className="flex-1">{opt}</span>
              {checked && i === q.answer && <CheckIcon className="mt-0.5 size-4 text-success" aria-label="bonne réponse" />}
            </Label>
          );
        })}
      </RadioGroup>
      {checked && (
        <div role="status" className="rounded-lg border-l-2 border-primary bg-muted/50 px-4 py-3 text-body">
          <p className="font-medium">{correct ? "Exact." : "Pas tout à fait."}</p>
          <p className="mt-1 text-muted-foreground">{q.explanation}</p>
        </div>
      )}
    </div>
  );
}

export function LessonReader({
  progressKey,
  stepTitle,
  moduleLabel,
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
  const reduce = useReducedMotion();
  const ready = useProgressReady();
  const progress = useProgress();
  const saved = progress[progressKey];
  const screens = React.useMemo(() => buildScreens(content), [content]);

  const [index, setIndex] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState(1);
  // Choix en cours, pas encore vérifié. Une réponse vérifiée est enregistrée dans la progression.
  const [pick, setPick] = React.useState<Record<number, number>>({});
  const top = React.useRef<HTMLDivElement>(null);

  // Reprise : on rouvre la leçon à l'écran où l'apprenant l'avait laissée.
  const current = index ?? (ready && saved && !saved.done ? Math.min(saved.screen, screens.length - 1) : 0);
  const screen = screens[current];
  const answers = saved?.answers ?? {};
  const last = current === screens.length - 1;
  const questionPending = screen.type === "question" && answers[screen.index] === undefined;

  const go = React.useCallback(
    (delta: number) => {
      const target = Math.min(Math.max(current + delta, 0), screens.length - 1);
      if (target === current) return;
      setDirection(delta);
      setIndex(target);
      saveStep(progressKey, { screen: target, ...(target === screens.length - 1 ? { done: true } : {}) });
      top.current?.scrollIntoView({ block: "start" });
    },
    [current, screens.length, progressKey],
  );

  function verify(qIndex: number) {
    const option = pick[qIndex];
    if (option === undefined) return;
    saveStep(progressKey, { answers: { ...answers, [qIndex]: option } });
  }

  // Navigation au clavier : flèches gauche et droite.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [role=radiogroup], [contenteditable]")) return;
      if (e.key === "ArrowRight" && !questionPending && !last) go(1);
      if (e.key === "ArrowLeft") go(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, questionPending, last]);

  const pct = Math.round(((current + 1) / screens.length) * 100);
  const textScreens = content.screens.length;

  return (
    <div ref={top} className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter la leçon">
            <Link href={exitHref}>
              <XIcon />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption text-muted-foreground">{moduleLabel}</p>
            <p className="truncate text-sm font-medium">{stepTitle}</p>
          </div>
          <span className="text-caption tabular-nums text-muted-foreground">
            {current + 1} / {screens.length}
          </span>
        </div>
        <Progress value={pct} className="h-0.5 rounded-none bg-transparent" aria-label="Progression dans la leçon" />
      </header>

      <main className="flex-1 px-5 py-10 sm:py-14">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            initial={reduce ? false : { opacity: 0, x: 14 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -14 * direction }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-[64ch]"
          >
            {screen.type === "text" && (
              <article className="space-y-6">
                {current === 0 && (
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

            {screen.type === "recap" && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-title">À retenir</h1>
                  <p className="font-serif text-xl leading-relaxed">{content.recap}</p>
                </div>
                {content.next && <p className="text-body text-muted-foreground">{content.next}</p>}
                {content.sourcesHtml && (
                  <Accordion type="single" collapsible className="rounded-lg border px-4">
                    <AccordionItem value="sources" className="border-none">
                      <AccordionTrigger>Sources et points à relire</AccordionTrigger>
                      <AccordionContent>
                        <div className="prose-lesson prose-sources" dangerouslySetInnerHTML={{ __html: content.sourcesHtml }} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                <p className="text-caption text-muted-foreground">
                  Leçon terminée : {textScreens} écrans et {content.questions.length} question
                  {content.questions.length > 1 ? "s" : ""}. <WhereSaved invite={false} />
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={() => go(-1)} disabled={current === 0}>
            <ArrowLeftIcon /> Retour
          </Button>
          {last ? (
            next ? (
              <Button size="lg" onClick={() => router.push(next.href)}>
                Étape suivante
              </Button>
            ) : (
              <Button size="lg" asChild>
                <Link href={exitHref}>Revenir au module</Link>
              </Button>
            )
          ) : questionPending ? (
            <Button
              size="lg"
              disabled={screen.type !== "question" || pick[screen.index] === undefined}
              onClick={() => screen.type === "question" && verify(screen.index)}
            >
              Vérifier
            </Button>
          ) : (
            <Button size="lg" onClick={() => go(1)}>
              Continuer
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
