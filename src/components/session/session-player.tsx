"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, BotIcon, CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import { AI_CHOICES, aiLabel, setAiTool, useAiTool, type AiChoice } from "@/lib/sessions/ai-tool";
import { sessionKey, totalSavedSec } from "@/lib/sessions/progress";
import { duration, ease } from "@/lib/motion";
import { blockLabel, type Session } from "@/lib/sessions/types";
import type { ExerciseInputs, ExerciseValue } from "@/lib/content/types";
import { BlockView, blockGate, methodSpan, useNow, type BlockCtx } from "./blocks";
import { forLearner } from "@/lib/sessions/display";
import { trackSession } from "@/lib/sessions/track";
import { SessionComplete, type NextSession } from "./session-complete";

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

// Barre segmentée : un segment par écran. Les écrans déjà vus restent accessibles.
function Segments({
  session,
  current,
  furthest,
  onGo,
}: {
  session: Session;
  current: number;
  furthest: number;
  onGo: (i: number) => void;
}) {
  return (
    <ol className="mx-auto flex max-w-3xl gap-1 px-4 pb-2" aria-label="Écrans de la session">
      {session.blocs.map((b, i) => {
        const reachable = i <= furthest;
        return (
          <li key={i} className="flex-1">
            <button
              type="button"
              onClick={() => onGo(i)}
              disabled={!reachable}
              aria-label={`${i + 1}. ${blockLabel[b.type]}`}
              aria-current={i === current ? "step" : undefined}
              title={blockLabel[b.type]}
              className="group flex h-4 w-full items-center enabled:cursor-pointer"
            >
              <span className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted transition-[height] group-enabled:group-hover:h-2">
                <motion.span
                  className="absolute inset-0 origin-left rounded-full bg-primary"
                  initial={false}
                  animate={{ scaleX: i < current || (i <= furthest && i !== current) ? 1 : i === current ? 0.5 : 0, opacity: i === current ? 1 : 0.85 }}
                  transition={{ duration: duration.lent, ease: ease.out }}
                />
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// Lecteur d'une session : un écran par bloc, bouton Suivant, barre de progression.
export function SessionPlayer({
  session: raw,
  moduleLabel,
  exitHref,
  fileBase,
  next,
  keyPrefix = "",
  measure = true,
  askAiTool = true,
}: {
  session: Session;
  moduleLabel: string;
  exitHref: string;
  /** Adresse des fichiers de la session (données et outils). */
  fileBase: string;
  /** Session suivante, montrée à la fin pour donner envie de continuer. */
  next?: NextSession | null;
  /** Préfixe de la progression : « apercu- » dans l'espace réservé, pour ne pas la mêler au site. */
  keyPrefix?: string;
  /** Envoie la mesure anonyme (désactivé pour les aperçus). */
  measure?: boolean;
  /** Demande l'outil d'IA dès l'ouverture (désactivé dans l'aperçu intégré de l'import). */
  askAiTool?: boolean;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  // Côté apprenant, les mentions « (À vérifier) » des rédacteurs sont masquées.
  const session = React.useMemo(() => forLearner(raw), [raw]);
  const span = methodSpan(session.blocs);
  const ready = useProgressReady();
  const progress = useProgress();
  const aiTool = useAiTool();
  const baseKey = sessionKey(session.formation, session.module, session.session);
  const key = keyPrefix + baseKey;
  const saved = progress[key];
  const inputs = React.useMemo(() => saved?.inputs ?? {}, [saved?.inputs]);
  const total = session.blocs.length;

  const [index, setIndex] = React.useState<number | null>(null);
  const [direction, setDirection] = React.useState(1);
  const [picking, setPicking] = React.useState(false);
  const [review, setReview] = React.useState(false);
  const methodRunning = Boolean(inputs["methode:debut"]) && !inputs["methode:fin"] && !inputs["gain:methode_sec"];
  const now = useNow(methodRunning);
  const methodSec = methodRunning && now ? Math.max(0, Math.floor((now - Number(inputs["methode:debut"])) / 1000)) : 0;

  // « Enregistré » s'affiche brièvement après chaque saisie.
  const [showSaved, setShowSaved] = React.useState(false);
  const savedTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const top = React.useRef<HTMLDivElement>(null);

  const current = index ?? (ready && saved ? Math.min(saved.screen, total - 1) : 0);
  const furthest = Math.max(current, Number(saved?.inputs?.["session:max"]) || 0);
  const finished = Boolean(saved?.done) && !review;
  const block = session.blocs[current];
  const last = current === total - 1;

  const setMany = React.useCallback(
    (values: ExerciseInputs) => {
      saveStep(key, { inputs: { ...inputs, ...values } });
      setShowSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setShowSaved(false), 1600);
    },
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
  const gate = blockGate(block, { index: current, inputs });

  function go(target: number) {
    const t = Math.min(Math.max(target, 0), total - 1);
    if (t === current) return;
    setDirection(t > current ? 1 : -1);
    setIndex(t);
    const now = String(Date.now());
    if (!inputs["session:debut"] && measure) trackSession(baseKey, "started");
    saveStep(key, {
      screen: t,
      inputs: {
        ...inputs,
        "session:max": String(Math.max(furthest, t)),
        ...(inputs["session:debut"] ? {} : { "session:debut": now }),
        // Chrono « avec la méthode » : démarre à l'ouverture de l'outil...
        ...(t === span.outil && !inputs["methode:debut"] ? { "methode:debut": now } : {}),
        // ... et s'arrête quand l'apprenant valide le contrôle qui suit.
        ...(current === span.controle && t > current && inputs["methode:debut"] && !inputs["methode:fin"] ? { "methode:fin": now } : {}),
      },
    });
    top.current?.scrollIntoView({ block: "start" });
  }

  function finish() {
    const end = Date.now();
    saveStep(key, { done: true, inputs: { ...inputs, "session:max": String(total - 1), "session:fin": String(end) } });
    if (measure) {
      const start = Number(inputs["session:debut"]) || 0;
      trackSession(baseKey, "completed", {
        duration_sec: start ? (end - start) / 1000 : undefined,
        gain_sec: inputs.gain_sec !== undefined ? Number(inputs.gain_sec) : undefined,
        found: inputs["score:total"] ? Number(inputs["score:trouvees"]) : undefined,
        expected: inputs["score:total"] ? Number(inputs["score:total"]) : undefined,
      });
    }
    setReview(false);
    window.scrollTo({ top: 0 });
  }

  // Clavier : → ou Entrée pour Suivant, ← pour revenir, Échap pour quitter.
  const onKey = React.useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || finished) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, button, a, [role=dialog], [contenteditable]")) return;
    if ((e.key === "ArrowRight" || e.key === "Enter") && !gate) {
      if (last) finish();
      else go(current + 1);
    }
    if (e.key === "ArrowLeft") go(current - 1);
    if (e.key === "Escape") router.push(exitHref);
  });
  React.useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (ready && finished) {
    return (
      <SessionComplete
        session={session}
        moduleLabel={moduleLabel}
        inputs={inputs}
        savedTotalSec={ctx.savedTotalSec}
        fileUrl={ctx.fileUrl}
        exitHref={exitHref}
        next={next ?? null}
        onReview={() => {
          // En revue, les cases des contrôles repartent décochées.
          const cleared = Object.fromEntries(
            Object.entries(inputs).filter(([id]) => !session.blocs.some((b, i) => b.type === "controle" && id === `b${i}:coches`)),
          );
          saveStep(key, { inputs: cleared });
          setReview(true);
          setIndex(0);
        }}
      />
    );
  }

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
          <AnimatePresence>
            {showSaved && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.rapide }}
                className="hidden items-center gap-1 text-caption text-muted-foreground sm:inline-flex"
                role="status"
              >
                <CheckIcon className="size-3.5 text-success" aria-hidden /> Enregistré
              </motion.span>
            )}
          </AnimatePresence>
          {methodRunning && (
            <span
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-2 py-1 font-mono text-xs font-medium text-accent-foreground tabular-nums"
              title="Temps avec la méthode, comparé ensuite à votre défi"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
              {String(Math.floor(methodSec / 60)).padStart(2, "0")}:{String(methodSec % 60).padStart(2, "0")}
            </span>
          )}
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
        <Segments session={session} current={current} furthest={furthest} onGo={go} />
      </header>

      <main className="flex-1 px-5 py-8 sm:py-12">
        <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between text-caption text-muted-foreground">
          <span className="font-medium tracking-wide uppercase">{blockLabel[block.type]}</span>
          <span className="tabular-nums">
            {current + 1} / {total}
          </span>
        </div>
        {/* L'écran suivant s'affiche tout de suite : il glisse légèrement en entrant, sans attendre la sortie du précédent. */}
        <motion.div
          key={current}
          initial={reduce || !ready ? false : { opacity: 0.4, x: 12 * direction }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: duration.rapide, ease: ease.out }}
          className={cn("mx-auto max-w-2xl", !ready && "invisible")}
        >
          <BlockView block={block} ctx={ctx} active={ready} />
        </motion.div>
        <p className="mx-auto mt-12 max-w-2xl text-caption text-muted-foreground">
          Contenu à jour au {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(session.maj))}. Données
          fictives, version de test.
        </p>
      </main>

      <footer className="sticky bottom-0 border-t bg-background/95 backdrop-blur">
        {gate && <p className="px-4 pt-2 text-center text-caption text-muted-foreground sm:hidden">{gate}</p>}
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

      <AiToolDialog open={(askAiTool && aiTool === null) || picking} current={aiTool ?? null} onClose={() => setPicking(false)} />
    </div>
  );
}
