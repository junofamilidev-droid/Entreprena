"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

// Briques visuelles partagées par les pages apprenant, reprises du lecteur de session « atelier » :
// fond d'ambiance en tête de page, carte flottante, surfaces douces sans bordure, anneau de progression.

/** Zone de tête de page posée sur le fond d'ambiance de la session. */
export function AmbientHero({ children, className, state = "idle" }: { children: React.ReactNode; className?: string; state?: "idle" | "active" | "success" }) {
  return (
    <section className={cn("relative isolate overflow-hidden rounded-[2rem] bg-muted/30", className)}>
      <div className="ambient" data-state={state} data-tone="soft" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

/** Carte flottante : fond translucide, flou, ombre douce, sans bordure visible. */
export function FloatCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[1.75rem] bg-background/90 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.18)] ring-1 ring-foreground/5 backdrop-blur-xl", className)}
      {...props}
    />
  );
}

/** Surface douce, sans bordure, pour les blocs secondaires. */
export function Soft({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-3xl bg-muted/50", className)} {...props}>
      {children}
    </div>
  );
}

/** Anneau de progression, comme dans la barre de la session. */
export function ProgressRing({ pct, size = 56, label = "Progression", showLabel = true }: { pct: number; size?: number; label?: string; showLabel?: boolean }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5" role="img" aria-label={`${label} : ${pct} %`}>
      <span className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 52 52" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="26" cy="26" r={r} fill="none" strokeWidth="4" className="stroke-foreground/[0.08]" />
          <motion.circle
            cx="26"
            cy="26"
            r={r}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            className="stroke-success"
            strokeDasharray={c}
            initial={false}
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: duration.recompense, ease: ease.out }}
          />
        </svg>
        <span className={cn("font-semibold tabular-nums", size >= 80 ? "text-lg" : "text-xs")}>{pct}%</span>
      </span>
      {showLabel && <span className="text-[0.6875rem] text-muted-foreground">{label}</span>}
    </div>
  );
}

export type Tone = "idle" | "active" | "success" | "warn";

/** Petit voyant d'état avec son libellé : « En cours », « Terminé »… */
export function StatusLabel({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          tone === "idle" && "bg-foreground/25",
          tone === "active" && "bg-primary",
          tone === "success" && "bg-success",
          tone === "warn" && "bg-warning",
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}
