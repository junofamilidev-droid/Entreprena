"use client";

import Link from "next/link";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusLabel } from "./kit";
import { useProgress, useProgressReady, type ProgressState } from "@/lib/progress/store";
import { formatSeconds, sessionKey } from "@/lib/sessions/progress";

export interface SessionItem {
  number: number;
  title: string;
  durationMin: number;
}

export type SessionState = "done" | "started" | "todo";

export function sessionState(progress: ProgressState, formation: string, module: string, n: number): SessionState {
  const p = progress[sessionKey(formation, module, n)];
  if (p?.done) return "done";
  return p && (p.screen > 0 || p.inputs?.["session:debut"]) ? "started" : "todo";
}

/** Bouton vers la prochaine session à faire (« Commencer » ou « Reprendre »). */
export function SessionCta({ formation, module, sessions, className }: { formation: string; module: string; sessions: SessionItem[]; className?: string }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const states = sessions.map((s) => sessionState(progress, formation, module, s.number));
  const nextIndex = states.findIndex((s) => s !== "done");
  const next = sessions[nextIndex];
  if (!next)
    return (
      <p className={cn("text-sm font-medium text-success", !ready && "invisible", className)}>
        Module terminé : toutes ses sessions sont faites.
      </p>
    );
  return (
    <Button asChild size="lg" className={cn("px-6", !ready && "invisible", className)}>
      <Link href={`/formations/${formation}/${module}/session/${next.number}`}>
        {states[nextIndex] === "started" ? "Reprendre" : "Commencer"} la session {next.number} · {next.durationMin} min <ArrowRightIcon />
      </Link>
    </Button>
  );
}

// Sessions d'un module : état de chacune, la prochaine à faire mise en avant.
export function SessionList({ formation, module, sessions }: { formation: string; module: string; sessions: SessionItem[] }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const states = sessions.map((s) => sessionState(progress, formation, module, s.number));
  const nextIndex = states.findIndex((s) => s !== "done");
  const base = `/formations/${formation}/${module}/session`;

  return (
    <ol className={cn("space-y-1.5", !ready && "invisible")}>
      {sessions.map((s, i) => {
        const st = states[i];
        const gain = Number(progress[sessionKey(formation, module, s.number)]?.inputs?.gain_sec) || 0;
        return (
          <li key={s.number}>
            <Link
              href={`${base}/${s.number}`}
              className={cn(
                "group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors sm:px-5",
                i === nextIndex ? "bg-accent/60 hover:bg-accent" : "hover:bg-muted/60",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums",
                  st === "done" ? "bg-success text-white" : st === "started" ? "bg-primary text-primary-foreground" : "bg-foreground/[0.06] text-foreground/80",
                )}
              >
                {st === "done" ? <CheckIcon className="size-4" strokeWidth={3} aria-label="terminée" /> : s.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{s.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {s.durationMin} min
                  {st === "done" && gain > 0 && <> · {formatSeconds(gain)} gagnées</>}
                </span>
              </span>
              <span className="hidden sm:block">
                {st === "done" && <StatusLabel tone="success">Terminée</StatusLabel>}
                {st === "started" && <StatusLabel tone="active">En cours</StatusLabel>}
                {st === "todo" && i === nextIndex && <StatusLabel tone="idle">À commencer</StatusLabel>}
              </span>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
