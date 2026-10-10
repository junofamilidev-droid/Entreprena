"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Screen =
  | { kind: "lesson"; kicker: string; title: string; html: string }
  | { kind: "quiz"; question: string; options: string[]; answer: number; explanation: string }
  | { kind: "recap"; text: string };

export function LessonDemo({
  moduleTitle,
  lessonTitle,
  screens,
}: {
  moduleTitle: string;
  lessonTitle: string;
  screens: Screen[];
}) {
  const [index, setIndex] = React.useState(0);
  const [choice, setChoice] = React.useState<string>("");
  const [checked, setChecked] = React.useState(false);
  const [direction, setDirection] = React.useState(1);
  const reduce = useReducedMotion();

  const screen = screens[index];
  const progress = Math.round(((index + 1) / screens.length) * 100);
  const canContinue = screen.kind !== "quiz" || checked;

  function go(delta: number) {
    setDirection(delta);
    setIndex((i) => Math.min(Math.max(i + delta, 0), screens.length - 1));
    setChoice("");
    setChecked(false);
  }

  return (
    <div className="flex min-h-[640px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
        <Button variant="ghost" size="icon-sm" aria-label="Quitter la leçon">
          <XIcon />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption text-muted-foreground">{moduleTitle}</p>
          <p className="truncate text-sm font-medium">{lessonTitle}</p>
        </div>
        <span className="font-mono text-caption tabular-nums text-muted-foreground">
          {index + 1}/{screens.length}
        </span>
      </header>
      <Progress value={progress} className="h-1 rounded-none bg-muted" aria-label="Progression" />

      <div className="relative flex-1 px-5 py-10 sm:px-12 sm:py-14">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={index}
            initial={reduce ? false : { opacity: 0, x: 16 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -16 * direction }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-[62ch]"
          >
            {screen.kind === "lesson" && (
              <article className="space-y-6">
                <p className="text-kicker text-brand">{screen.kicker}</p>
                <h2 className="text-title">{screen.title}</h2>
                <div
                  className="prose-lesson text-foreground/90"
                  dangerouslySetInnerHTML={{ __html: screen.html }}
                />
              </article>
            )}

            {screen.kind === "quiz" && (
              <div className="space-y-6">
                <p className="text-kicker text-brand">Question de vérification</p>
                <h2 className="text-heading">{screen.question}</h2>
                <RadioGroup
                  value={choice}
                  onValueChange={setChoice}
                  disabled={checked}
                  className="gap-3"
                >
                  {screen.options.map((opt, i) => {
                    const id = `opt-${i}`;
                    const isAnswer = i === screen.answer;
                    const isChosen = choice === String(i);
                    return (
                      <Label
                        key={id}
                        htmlFor={id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-body leading-snug font-normal transition-colors hover:bg-muted/60",
                          isChosen && !checked && "border-brand bg-brand-soft/60",
                          checked && isAnswer && "border-success/60 bg-success/8",
                          checked && isChosen && !isAnswer && "border-destructive/50 bg-destructive/5",
                        )}
                      >
                        <RadioGroupItem id={id} value={String(i)} className="mt-1" />
                        <span className="flex-1">{opt}</span>
                        {checked && isAnswer && <CheckIcon className="mt-1 size-4 text-success" />}
                      </Label>
                    );
                  })}
                </RadioGroup>
                {checked && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border-l-2 border-brand bg-muted/50 p-4 text-body"
                    role="status"
                  >
                    <p className="mb-1 font-medium">
                      {choice === String(screen.answer) ? "Exact." : "Pas tout à fait."}
                    </p>
                    <p className="text-muted-foreground">{screen.explanation}</p>
                  </motion.div>
                )}
              </div>
            )}

            {screen.kind === "recap" && (
              <div className="space-y-6">
                <p className="text-kicker text-brand">À retenir</p>
                <p className="font-serif text-heading font-normal leading-snug">{screen.text}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t bg-background/80 px-4 py-3 sm:px-6">
        <Button variant="ghost" onClick={() => go(-1)} disabled={index === 0}>
          <ArrowLeftIcon /> Retour
        </Button>
        {screen.kind === "quiz" && !checked ? (
          <Button size="lg" disabled={!choice} onClick={() => setChecked(true)}>
            Vérifier
          </Button>
        ) : (
          <Button
            size="lg"
            disabled={!canContinue || index === screens.length - 1}
            onClick={() => go(1)}
          >
            Continuer
          </Button>
        )}
      </footer>
    </div>
  );
}
