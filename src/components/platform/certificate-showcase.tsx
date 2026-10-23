"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, LockIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { displayName, useAuth } from "@/lib/auth/session";
import { saveInput, useProgress, useProgressReady, type ProgressState } from "@/lib/progress/store";
import { site } from "@/lib/site";
import { moduleState, type ModuleRef } from "./module-progress";

export interface CertificateModule {
  position: number;
  title: string;
  href: string;
  /** Absent tant que le module n'est pas ouvert. */
  ref: ModuleRef | null;
  /** Clé de l'auto-correction du module, quand il en a une : elle doit être validée. */
  reviewKey: string | null;
  /** Clés de progression des sessions publiées du module : toutes doivent être terminées. */
  sessionKeys: string[];
}

function moduleStatus(progress: ProgressState, m: CertificateModule) {
  if (!m.ref && m.sessionKeys.length === 0) return { ratio: 0, validated: false, soon: true, lastActivity: 0 };
  const st = m.ref ? moduleState(progress, m.ref) : null;
  const passed = !m.reviewKey || (progress[m.reviewKey]?.inputs?.result as Record<string, string> | undefined)?.passed === "1";
  const sessionsDone = m.sessionKeys.filter((k) => progress[k]?.done).length;
  const total = (m.ref?.steps.length ?? 0) + m.sessionKeys.length;
  const done = (st?.doneCount ?? 0) + sessionsDone;
  return {
    ratio: total ? done / total : 0,
    validated: (!st || (st.finished && passed)) && sessionsDone === m.sessionKeys.length,
    soon: false,
    lastActivity: Math.max(st?.lastActivity ?? 0, ...m.sessionKeys.map((k) => progress[k]?.updatedAt ?? 0)),
  };
}

// Sceau rond, texte en couronne autour d'une coche.
function Seal({ className }: { className?: string }) {
  const id = React.useId();
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <path id={id} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
      </defs>
      <circle cx="60" cy="60" r="56" className="fill-primary/10 stroke-primary" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="34" className="fill-none stroke-primary/50" strokeWidth="1" strokeDasharray="2 3" />
      <text className="fill-primary text-[9px] font-semibold tracking-[0.14em] uppercase">
        <textPath href={`#${id}`}>Formation terminée · Entreprena · </textPath>
      </text>
      <path d="M46 61l9 9 19-21" className="fill-none stroke-primary" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CertificateShowcase({
  formationSlug,
  formationTitle,
  modules,
}: {
  formationSlug: string;
  formationTitle: string;
  modules: CertificateModule[];
}) {
  const ready = useProgressReady();
  const progress = useProgress();
  const auth = useAuth();
  const nameKey = `${formationSlug}/certificat/nom`;

  const statuses = modules.map((m) => moduleStatus(progress, m));
  const validated = statuses.filter((s) => s.validated).length;
  const pct = modules.length ? Math.round((statuses.reduce((s, x) => s + (x.validated ? 1 : x.ratio * 0.9), 0) / modules.length) * 100) : 0;
  const unlocked = modules.length > 0 && validated === modules.length;
  const next = modules.find((m, i) => !statuses[i].validated && !statuses[i].soon);

  const savedName = progress[nameKey]?.inputs?.nom;
  const accountName = auth.status === "user" ? displayName(auth.user) : "";
  const name = typeof savedName === "string" ? savedName : accountName;
  const lastActivity = Math.max(0, ...statuses.map((s) => s.lastActivity));
  // Date de la dernière étape faite ; jamais l'heure courante, que le rendu préparé figerait.
  const date = unlocked && lastActivity ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(lastActivity) : "À la fin du parcours";

  // Plus l'apprenant avance, plus le brouillard s'éclaircit et plus le certificat devient net.
  const fog = unlocked ? 0 : 0.9 - (pct / 100) * 0.5;
  const blur = unlocked ? 0 : 1.2 + (1 - pct / 100) * 2.6;

  return (
    <section aria-label={`Certificat : ${formationTitle}`} className={cn("space-y-6", !ready && "invisible")}>
      <div className={cn("relative isolate overflow-hidden rounded-2xl border bg-card p-3 shadow-sm sm:p-5", !unlocked && "pb-44 sm:pb-40")}>
        <article
          className={cn("relative transition-[filter] duration-1000", unlocked && "print-area")}
          style={{ filter: blur ? `blur(${blur}px)` : undefined }}
          aria-hidden={!unlocked}
        >
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 px-6 py-8 sm:px-12 sm:py-12">
            {/* Guillochage léger en fond, comme sur un document officiel. */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "repeating-radial-gradient(circle at 100% 0%, var(--primary) 0 1px, transparent 1px 9px), repeating-radial-gradient(circle at 0% 100%, var(--primary) 0 1px, transparent 1px 11px)",
              }}
            />
            <div className="absolute inset-2 rounded-lg border border-primary/20" />
            <div className="relative flex items-start justify-between gap-4">
              <p className="text-lg font-bold tracking-tight">{site.name}</p>
              <p className="text-caption tracking-[0.2em] text-muted-foreground uppercase">Version de test</p>
            </div>
            <div className="relative mt-8 text-center sm:mt-10">
              <p className="text-caption font-semibold tracking-[0.3em] text-primary uppercase">Certificat de réussite</p>
              <p className="mt-6 text-sm text-muted-foreground">décerné à</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {name.trim() || "Votre nom ici"}
              </p>
              <div className="mx-auto mt-4 h-px w-40 bg-primary/30" />
              <p className="mt-5 text-sm text-muted-foreground">pour avoir mené à terme la formation</p>
              <p className="mt-2 text-xl font-semibold text-balance sm:text-2xl">
                <mark className="marker bg-transparent">{formationTitle}</mark>
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {modules.length} modules, {modules.length} livrables réalisés sur des dossiers fictifs
              </p>
            </div>
            <div className="relative mt-10 flex items-end justify-between gap-4">
              <div className="text-sm">
                <p className="text-caption text-muted-foreground">Délivré le</p>
                <p className="font-medium">{date}</p>
              </div>
              <Seal className="size-20 shrink-0 sm:size-24" />
            </div>
          </div>
        </article>

        {/* Brouillard : il recouvre le certificat tant que la formation n'est pas finie, puis se lève. */}
        <div
          className={cn("fog", unlocked && "fog-lift")}
          style={{ "--fog": unlocked ? 1 : fog } as React.CSSProperties}
          aria-hidden
        >
          <span />
          <span />
          <span />
        </div>

        {!unlocked && (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4 text-center sm:p-6">
            <div className="w-full max-w-sm space-y-3 rounded-xl border bg-card/90 px-5 py-4 shadow-lg backdrop-blur-sm">
              <p className="flex items-center justify-center gap-2 font-semibold">
                <LockIcon className="size-4 text-primary" aria-hidden /> Se dévoile à chaque module terminé
              </p>
              <div
                role="progressbar"
                aria-label="Avancement vers le certificat"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                {validated} module{validated > 1 ? "s" : ""} validé{validated > 1 ? "s" : ""} sur {modules.length}
              </p>
              {next && (
                <Button asChild size="sm">
                  <Link href={next.href}>
                    Continuer le module {next.position} <ArrowRightIcon />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {unlocked ? (
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-64 flex-1 space-y-2 sm:max-w-sm">
            <Label htmlFor={`nom-${formationSlug}`}>Votre nom, tel qu&apos;il doit figurer sur le certificat</Label>
            <Input
              id={`nom-${formationSlug}`}
              value={name}
              autoComplete="name"
              onChange={(e) => saveInput(nameKey, "nom", e.target.value)}
              className="bg-card"
            />
          </div>
          <Button size="lg" onClick={() => window.print()} disabled={!name.trim()}>
            <PrinterIcon /> Imprimer ou enregistrer en PDF
          </Button>
        </div>
      ) : (
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const s = statuses[i];
            return (
              <li key={m.position}>
                <Link
                  href={m.href}
                  className="flex h-full items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums",
                      s.validated ? "bg-primary text-primary-foreground" : "border-2 border-border text-muted-foreground",
                    )}
                  >
                    {s.validated ? <CheckIcon className="size-3.5" strokeWidth={3} aria-label="validé" /> : m.position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-medium", s.soon && "text-muted-foreground")}>{m.title}</span>
                    <span className="block text-caption text-muted-foreground">
                      {s.validated ? "Validé" : s.soon ? "À venir" : s.ratio > 0 ? `${Math.round(s.ratio * 100)} % fait` : "À commencer"}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
