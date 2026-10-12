"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, CheckIcon, LifeBuoyIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { saveInput, saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ExerciseContent, ExerciseValue } from "@/lib/content/types";
import type { StepLink } from "@/components/reader/lesson-reader";
import { ExerciseBlockView, type BlockContext } from "./blocks";

// Exercice guidé : un écran de mission, puis une partie par écran.
// Les saisies sont enregistrées à chaque frappe, avec la progression de l'apprenant.
export function ExerciseRunner({
  progressKey,
  stepTitle,
  moduleLabel,
  content,
  exitHref,
  next,
  tutorUrl,
}: {
  progressKey: string;
  stepTitle: string;
  moduleLabel: string;
  content: ExerciseContent;
  exitHref: string;
  next: StepLink | null;
  tutorUrl: string | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const ready = useProgressReady();
  const progress = useProgress();
  const saved = progress[progressKey];
  const total = content.parts.length + 1;

  const [index, setIndex] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState(1);
  const top = React.useRef<HTMLDivElement>(null);

  // Reprise à la partie quittée, même après la fin (l'apprenant revient relire son livrable).
  const current = index ?? (ready && saved ? Math.min(saved.screen, total - 1) : 0);
  const part = current === 0 ? null : content.parts[current - 1];
  const last = current === total - 1;

  const ctx: BlockContext = {
    content,
    inputs: saved?.inputs ?? {},
    setInput: (id: string, value: ExerciseValue) => saveInput(progressKey, id, value),
  };

  const goTo = React.useCallback(
    (target: number) => {
      const t = Math.min(Math.max(target, 0), total - 1);
      if (t === current) return;
      setDirection(t > current ? 1 : -1);
      setIndex(t);
      saveStep(progressKey, { screen: t });
      top.current?.scrollIntoView({ block: "start" });
    },
    [current, total, progressKey],
  );

  function finish() {
    saveStep(progressKey, { done: true });
    router.push(next ? next.href : exitHref);
  }

  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div ref={top} className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter l'exercice">
            <Link href={exitHref}>
              <XIcon />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption text-muted-foreground">{moduleLabel}</p>
            <p className="truncate text-sm font-medium">{stepTitle}</p>
          </div>
          {tutorUrl && (
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <a href={tutorUrl} target="_blank" rel="noreferrer">
                <LifeBuoyIcon /> Tuteur IA
              </a>
            </Button>
          )}
        </div>
        <Progress value={pct} className="h-0.5 rounded-none bg-transparent" aria-label="Progression dans l'exercice" />
      </header>

      <nav aria-label="Étapes de l'exercice" className="border-b print:hidden">
        <ol className="mx-auto flex max-w-4xl gap-1.5 overflow-x-auto px-4 py-2.5">
          {["Mission", ...content.parts.map((p) => p.title)].map((title, i) => (
            <li key={title} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === current ? "step" : undefined}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2.5 text-sm transition-colors",
                  i === current ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full border text-[0.6875rem] tabular-nums",
                    i === current && "border-primary bg-primary text-primary-foreground",
                    i < current && "border-primary text-primary",
                  )}
                >
                  {i < current ? <CheckIcon className="size-3" strokeWidth={3} aria-hidden /> : i}
                </span>
                <span className={cn(i !== current && "hidden md:inline")}>{title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <main className="flex-1 px-5 py-10 sm:py-12">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            initial={reduce ? false : { opacity: 0, x: 14 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -14 * direction }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mx-auto max-w-3xl space-y-8"
          >
            {part === null ? (
              <>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Exercice{content.duration ? ` · ${content.duration}` : ""}
                  </p>
                  <h1 className="text-title text-balance">{content.intro.title}</h1>
                </div>
                {content.intro.blocks.map((b, i) => (
                  <ExerciseBlockView key={i} block={b} ctx={ctx} />
                ))}
                <p className="text-caption text-muted-foreground">
                  Vos saisies sont enregistrées sur cet appareil, dans ce navigateur, au fur et à mesure.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Étape {current} sur {content.parts.length}
                    {part.duration ? ` · ${part.duration}` : ""}
                  </p>
                  <h1 className="text-title text-balance">{part.title}</h1>
                  {part.lead && <p className="text-lead text-muted-foreground">{part.lead}</p>}
                </div>
                {part.blocks.map((b, i) => (
                  <ExerciseBlockView key={i} block={b} ctx={ctx} />
                ))}
              </>
            )}
            {tutorUrl && (
              <p className="text-sm text-muted-foreground sm:hidden">
                Besoin d&apos;un indice ?{" "}
                <a href={tutorUrl} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">
                  Ouvrir le tuteur IA
                </a>
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={() => goTo(current - 1)} disabled={current === 0}>
            <ArrowLeftIcon /> Retour
          </Button>
          {last ? (
            <Button size="lg" onClick={finish}>
              {saved?.done ? (next ? "Étape suivante" : "Revenir au module") : "Terminer l'exercice"}
            </Button>
          ) : (
            <Button size="lg" onClick={() => goTo(current + 1)}>
              {current === 0 ? "Commencer" : "Continuer"}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
