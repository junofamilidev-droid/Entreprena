"use client";

import Link from "next/link";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

// Sessions d'un module : état de chacune et bouton vers la prochaine à faire.
export function SessionList({ formation, module, sessions }: { formation: string; module: string; sessions: SessionItem[] }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const states = sessions.map((s) => sessionState(progress, formation, module, s.number));
  const nextIndex = states.findIndex((s) => s !== "done");
  const next = sessions[nextIndex];
  const base = `/formations/${formation}/${module}/session`;

  return (
    <div className={cn("space-y-5", !ready && "invisible")}>
      {next && (
        <Button asChild size="lg">
          <Link href={`${base}/${next.number}`}>
            {states[nextIndex] === "started" ? "Reprendre" : "Commencer"} la session {next.number} · {next.durationMin} min
          </Link>
        </Button>
      )}
      <ol className="overflow-hidden rounded-lg border bg-card">
        {sessions.map((s, i) => {
          const st = states[i];
          const gain = Number(progress[sessionKey(formation, module, s.number)]?.inputs?.gain_sec) || 0;
          return (
            <li key={s.number} className="border-b last:border-b-0">
              <Link
                href={`${base}/${s.number}`}
                className={cn("group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60 sm:px-5", i === nextIndex && "bg-accent/50")}
              >
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums",
                    st === "done" ? "bg-primary text-primary-foreground" : st === "started" ? "border-2 border-primary text-primary" : "border-2 border-border",
                  )}
                >
                  {st === "done" ? <CheckIcon className="size-4" strokeWidth={3} aria-label="terminée" /> : s.number}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{s.title}</span>
                  <span className="block text-sm text-muted-foreground">
                    {s.durationMin} min
                    {st === "done" && gain > 0 && <> · {formatSeconds(gain)} gagnées</>}
                    {st === "started" && <span className="text-primary"> · en cours</span>}
                  </span>
                </span>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
