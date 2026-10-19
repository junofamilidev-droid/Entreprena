"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, BotIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import { AI_CHOICES, aiLabel, setAiTool, useAiTool, type AiChoice } from "@/lib/sessions/ai-tool";
import { sessionKey, totalSavedSec } from "@/lib/sessions/progress";
import { blockLabel, type Session } from "@/lib/sessions/types";
import type { ExerciseInputs, ExerciseValue } from "@/lib/content/types";
import { BlockView, blockGate, type BlockCtx } from "./blocks";

function AiToolDialog({ open, current, onClose }: { open: boolean; current: AiChoice | null; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && current && onClose()}>
      <DialogContent showCloseButton={Boolean(current)} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quel outil d&apos;IA avez-vous le droit d&apos;utiliser ?</DialogTitle>
          <DialogDescription>
            Celui que votre employeur autorise. Les consignes s&apos;adaptent à votre choix ; vous pourrez le changer ensuite.
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {AI_CHOICES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  setAiTool(c.id);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  current === c.id && "border-primary bg-accent/50",
                )}
              >
                <span className="font-medium">{c.label}</span>
                <span className="text-sm text-muted-foreground">{c.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

// Lecteur d'une session : un écran par bloc, bouton Suivant, barre de progression.
export function SessionPlayer({
  session,
  moduleLabel,
  exitHref,
  fileBase,
}: {
  session: Session;
  moduleLabel: string;
  exitHref: string;
  /** Adresse des fichiers de la session (données et outils). */
  fileBase: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const ready = useProgressReady();
  const progress = useProgress();
  const aiTool = useAiTool();
  const key = sessionKey(session.formation, session.module, session.session);
  const saved = progress[key];
  const inputs = React.useMemo(() => saved?.inputs ?? {}, [saved?.inputs]);
  const total = session.blocs.length;

  const [index, setIndex] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState(1);
  const [picking, setPicking] = React.useState(false);
  const top = React.useRef<HTMLDivElement>(null);

  const current = index ?? (ready && saved ? Math.min(saved.screen, total - 1) : 0);
  const block = session.blocs[current];
  const last = current === total - 1;

  const setMany = React.useCallback(
    (values: ExerciseInputs) => saveStep(key, { inputs: { ...inputs, ...values } }),
    [key, inputs],
  );
  const ctx: BlockCtx = {
    index: current,
    session,
    inputs,
    set: (id: string, value: ExerciseValue) => setMany({ [id]: value }),
    setMany,
    aiTool,
    fileUrl: (name) => `${fileBase}/${encodeURIComponent(name)}`,
    savedTotalSec: totalSavedSec(progress),
  };
  const gate = blockGate(block, ctx);

  function go(target: number) {
    const t = Math.min(Math.max(target, 0), total - 1);
    if (t === current) return;
    setDirection(t > current ? 1 : -1);
    setIndex(t);
    saveStep(key, { screen: t, ...(saved?.inputs?.["session:debut"] ? {} : { inputs: { ...inputs, "session:debut": String(Date.now()) } }) });
    top.current?.scrollIntoView({ block: "start" });
  }

  function finish() {
    saveStep(key, { done: true, inputs: { ...inputs, "session:fin": String(Date.now()) } });
    toast.success("Session terminée. Votre outil vous attend dans Ma boîte à outils.");
    router.push(exitHref);
  }

  const pct = Math.round(((current + 1) / total) * 100);

  return (
    <div ref={top} className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter la session">
            <Link href={exitHref}>
              <XIcon />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption text-muted-foreground">
              {moduleLabel} · session {session.session} · {session.duree_min} min
            </p>
            <p className="truncate text-sm font-medium">{session.titre}</p>
          </div>
          {aiTool !== undefined && (
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              aria-label="Changer d'outil d'IA"
            >
              <BotIcon className="size-3.5 text-primary" aria-hidden />
              <span className="hidden sm:inline">{aiTool ? aiLabel(aiTool) : "Outil d'IA"}</span>
              <ChevronDownIcon className="size-3 text-muted-foreground" aria-hidden />
            </button>
          )}
        </div>
        <Progress value={pct} className="h-1 rounded-none bg-transparent" aria-label="Progression dans la session" />
      </header>

      <main className="flex-1 px-5 py-8 sm:py-12">
        <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between text-caption text-muted-foreground">
          <span className="font-medium tracking-wide uppercase">{blockLabel[block.type]}</span>
          <span className="tabular-nums">
            {current + 1} / {total}
          </span>
        </div>
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={current}
            initial={reduce ? false : { opacity: 0, x: 16 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -16 * direction }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn("mx-auto max-w-2xl", !ready && "invisible")}
          >
            <BlockView block={block} ctx={ctx} active={ready} />
          </motion.div>
        </AnimatePresence>
        <p className="mx-auto mt-12 max-w-2xl text-caption text-muted-foreground">
          Contenu à jour au {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(session.maj))}. Données
          fictives, version de test.
        </p>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={() => go(current - 1)} disabled={current === 0}>
            <ArrowLeftIcon /> Retour
          </Button>
          <div className="flex items-center gap-3">
            {gate && <p className="hidden text-right text-sm text-muted-foreground sm:block">{gate}</p>}
            <Button size="lg" disabled={Boolean(gate)} onClick={() => (last ? finish() : go(current + 1))}>
              {last ? "Terminer la session" : "Suivant"}
            </Button>
          </div>
        </div>
      </footer>

      <AiToolDialog open={aiTool === null || picking} current={aiTool ?? null} onClose={() => setPicking(false)} />
    </div>
  );
}
