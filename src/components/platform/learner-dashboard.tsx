"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, DownloadIcon, FileSpreadsheetIcon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion/count-up";
import { AmbientHero, FloatCard, ProgressRing, Soft, StatusLabel } from "./kit";
import { duration, ease, stagger } from "@/lib/motion";
import { displayName, useAuth } from "@/lib/auth/session";
import { useProgress, useProgressReady, type ProgressState } from "@/lib/progress/store";
import { formatSeconds, totalSavedSec } from "@/lib/sessions/progress";
import { recordDownload, useDownloads } from "@/lib/sessions/downloads";
import type { FormationWithModules, Module } from "@/lib/content/types";
import { moduleState, stepHref, type ModuleRef } from "./module-progress";
import { sessionState, type SessionItem } from "./session-list";

// Apparition en cascade : chaque bloc arrive un peu après le précédent.
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger * 1.5, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: duration.lent, ease: ease.out } },
};

type ModuleStatus = "done" | "current" | "todo" | "soon";

interface ModuleRow {
  module: Module;
  status: ModuleStatus;
  /** Part faite (étapes et sessions), de 0 à 1. */
  ratio: number;
  started: boolean;
  href: string;
  duration: string | null;
  /** Prochaine chose à faire dans ce module. */
  resume: { title: string; meta: string; href: string; started: boolean } | null;
}

function rows(
  formation: FormationWithModules,
  refs: ModuleRef[],
  sessions: Record<string, SessionItem[]>,
  durations: Record<string, string | null>,
  progress: ProgressState,
): ModuleRow[] {
  let currentFound = false;
  return formation.modules.map((m) => {
    const key = `${formation.slug}/${m.slug}`;
    const href = `/app/formations/${formation.slug}/${m.slug}`;
    const ref = refs.find((r) => r.formationSlug === formation.slug && r.module.slug === m.slug);
    const list = sessions[key] ?? [];
    if (m.availability !== "open" || (!ref && list.length === 0)) {
      return { module: m, status: "soon", ratio: 0, started: false, href: `/app/formations/${formation.slug}`, duration: null, resume: null };
    }
    const st = ref ? moduleState(progress, ref) : null;
    const sStates = list.map((s) => sessionState(progress, formation.slug, m.slug, s.number));
    const total = (ref?.steps.length ?? 0) + list.length;
    const done = (st?.doneCount ?? 0) + sStates.filter((x) => x === "done").length;
    const started = Boolean(st?.started) || sStates.some((x) => x !== "done" && x !== "todo") || sStates.includes("done");
    const finished = total > 0 && done === total;

    let resume: ModuleRow["resume"] = null;
    const nextSession = sStates.findIndex((x) => x !== "done");
    if (nextSession !== -1) {
      const s = list[nextSession];
      resume = {
        title: `Session ${s.number} : ${s.title}`,
        meta: `Module ${m.position} · ${s.durationMin} min`,
        href: `${href}/session/${s.number}`,
        started: sStates[nextSession] === "started",
      };
    } else if (ref && st && !st.finished) {
      const step = ref.steps[st.current];
      resume = { title: step.title, meta: `Module ${m.position}${step.duration ? ` · ${step.duration}` : ""}`, href: stepHref(ref, step.slug), started: st.started };
    }

    let status: ModuleStatus = finished ? "done" : "todo";
    if (!finished && !currentFound) {
      status = "current";
      currentFound = true;
    }
    return { module: m, status, ratio: total ? done / total : 0, started, href, duration: durations[key] ?? m.durationLabel, resume };
  });
}

// Pastille d'état d'un module : coche pleine (terminé), anneau qui se remplit (en cours), numéro (à faire).
function StatusDot({ row }: { row: ModuleRow }) {
  const n = row.module.position;
  if (row.status === "done") {
    return (
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-105">
        <CheckIcon className="size-4" strokeWidth={3} aria-label="terminé" />
      </span>
    );
  }
  if (row.status === "current") {
    const r = 15;
    const c = 2 * Math.PI * r;
    return (
      <span className="relative grid size-9 shrink-0 place-items-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r={r} fill="none" strokeWidth="3" className="stroke-primary/20" />
          <motion.circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className="stroke-primary"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - Math.max(row.ratio, 0.04)) }}
            transition={{ duration: duration.recompense, ease: ease.out, delay: 0.35 }}
          />
        </svg>
        <span className="text-sm font-semibold tabular-nums text-primary">{n}</span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-sm font-semibold tabular-nums",
        row.status === "soon" ? "text-muted-foreground" : "text-foreground/80",
      )}
    >
      {n}
    </span>
  );
}

export function LearnerDashboard({
  formations,
  refs,
  sessions,
  durations,
}: {
  formations: FormationWithModules[];
  refs: ModuleRef[];
  sessions: Record<string, SessionItem[]>;
  durations: Record<string, string | null>;
}) {
  const auth = useAuth();
  const ready = useProgressReady();
  const progress = useProgress();
  const downloads = useDownloads();

  // La formation la plus récemment ouverte ; à défaut, la première du catalogue.
  const started = refs
    .map((r) => ({ ref: r, st: moduleState(progress, r) }))
    .filter((x) => x.st.started)
    .sort((a, b) => b.st.lastActivity - a.st.lastActivity);
  const formation = formations.find((f) => f.slug === (started[0]?.ref ?? refs[0])?.formationSlug) ?? formations[0];

  if (!formation) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-8">
        <h1 className="text-title">Choisissez une première formation</h1>
        <p className="mt-2 text-body text-muted-foreground">Le catalogue rassemble les formations ouvertes, métier par métier.</p>
        <Link href="/app/catalogue" className="mt-6 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  const moduleRows = rows(formation, refs, sessions, durations, progress);
  const total = moduleRows.length;
  const done = moduleRows.filter((r) => r.status === "done").length;
  const pct = total ? Math.round((moduleRows.reduce((s, r) => s + r.ratio, 0) / total) * 100) : 0;
  const resume = moduleRows.find((r) => r.resume)?.resume ?? null;
  const savedSec = totalSavedSec(progress);
  const firstName = auth.status === "user" ? displayName(auth.user).split(/\s+/)[0] : null;
  const shown = ready ? "show" : "hidden";

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 md:py-8">
      {/* Tête de page : le fond d'ambiance de la session, et l'action principale dans une carte flottante. */}
      <AmbientHero className="px-3 py-6 sm:px-10 sm:py-10" state={resume ? "idle" : "success"}>
        <p className="px-1 text-[1.125rem] text-foreground/75">{firstName ? `Bonjour ${firstName},` : "Bonjour,"}</p>
        <motion.div variants={item} initial="hidden" animate={shown}>
          <FloatCard aria-labelledby="reprendre" role="region" className="mt-4 flex items-center gap-8 p-6 sm:p-9">
            <div className="min-w-0 flex-1">
              {resume ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{resume.started ? "Reprendre" : "Continuer"}</span> ·{" "}
                    <Link href={`/app/formations/${formation.slug}`} className="hover:text-foreground hover:underline">
                      {formation.title}
                    </Link>
                  </p>
                  <h1 id="reprendre" className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight text-balance sm:text-[2rem]">
                    {resume.title}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">{resume.meta}</p>
                  <p className="mt-1 text-sm text-muted-foreground tabular-nums sm:hidden">
                    Votre formation : {pct} % · {done} / {total} modules
                  </p>
                  <Button asChild size="lg" className="mt-6 px-6">
                    <Link href={resume.href}>
                      {resume.started ? "Reprendre" : "Commencer"} <ArrowRightIcon />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-success">Tout est fait</p>
                  <h1 id="reprendre" className="mt-2 text-[1.75rem] leading-tight font-bold tracking-tight sm:text-[2rem]">
                    Vous avez terminé ce qui est ouvert
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">Les prochains modules s&apos;ouvriront ici.</p>
                  <Button asChild size="lg" variant="outline" className="mt-6 px-6">
                    <Link href="/app/certificat">Voir mon certificat</Link>
                  </Button>
                </>
              )}
            </div>
            <div className="hidden shrink-0 flex-col items-center gap-1 sm:flex">
              <ProgressRing pct={ready ? pct : 0} size={96} label="Votre formation" showLabel={false} />
              <p className="text-sm font-medium">Votre formation</p>
              <p className="text-caption text-muted-foreground tabular-nums">
                {done} / {total} modules
              </p>
            </div>
          </FloatCard>
        </motion.div>
      </AmbientHero>

      <motion.div variants={list} initial="hidden" animate={shown} className="mt-4 grid gap-4 sm:grid-cols-2">
        <motion.div variants={item}>
          <Soft className="h-full p-6" role="region" aria-label="Temps gagné">
            <StatusLabel tone={savedSec > 0 ? "success" : "idle"}>Temps gagné</StatusLabel>
            <p className="mt-3 text-[2rem] leading-none font-bold tracking-tight">
              <CountUp value={savedSec} format={formatSeconds} />
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Il se mesure à chaque session : votre défi, puis la méthode.</p>
            {/* Repère pour les lecteurs d'écran : la progression est aussi dans l'anneau du haut. */}
            <p className="sr-only">
              Progression : {pct} %, {done} modules terminés sur {total}.
            </p>
          </Soft>
        </motion.div>
        <motion.div variants={item}>
          <Soft className="h-full p-6" role="region" aria-labelledby="outils">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="outils">
                <StatusLabel tone={downloads.length ? "active" : "idle"}>Ma boîte à outils</StatusLabel>
              </h2>
              <Link href="/app/boite-a-outils" className="text-sm font-medium text-primary hover:underline">
                Ouvrir
              </Link>
            </div>
            {downloads.length > 0 ? (
              <ul className="mt-3 space-y-1">
                {downloads.slice(0, 3).map((d) => (
                  <li key={d.name}>
                    <a
                      href={d.href}
                      download
                      onClick={() => recordDownload({ name: d.name, href: d.href, source: d.source }, downloads)}
                      className="group -mx-2 flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-background/70"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-xs">
                        <FileSpreadsheetIcon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{d.name}</span>
                        <span className="block truncate text-caption text-muted-foreground">{d.source}</span>
                      </span>
                      <DownloadIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Les outils et les fiches de chaque session s&apos;y rangent, prêts à réutiliser en mission.</p>
            )}
          </Soft>
        </motion.div>
      </motion.div>

      <section aria-labelledby="parcours" className="mt-12">
        <h2 id="parcours" className="px-1 text-heading">
          Votre parcours
        </h2>
        <motion.ol variants={list} initial="hidden" animate={shown} className="mt-4 space-y-1.5">
          {moduleRows.map((r) => {
            const current = r.status === "current";
            const soon = r.status === "soon";
            return (
              <motion.li variants={item} key={r.module.id}>
                <Link
                  href={r.href}
                  className={cn(
                    "group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-colors sm:px-5",
                    current ? "bg-accent/60 hover:bg-accent" : "hover:bg-muted/60",
                  )}
                >
                  <StatusDot row={r} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block font-medium", soon && "text-muted-foreground")}>
                      {r.module.position}. {r.module.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">{r.module.summary}</span>
                  </span>
                  <span className="hidden shrink-0 flex-col items-end gap-0.5 text-sm sm:flex">
                    {r.status === "done" && <StatusLabel tone="success">Terminé</StatusLabel>}
                    {current && <StatusLabel tone="active">{r.started ? "En cours" : "À commencer"}</StatusLabel>}
                    {soon ? (
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                        <LockIcon className="size-3.5" aria-hidden /> À venir
                      </span>
                    ) : (
                      r.duration && <span className="text-caption text-muted-foreground">{r.duration}</span>
                    )}
                  </span>
                  <ChevronRightIcon
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
              </motion.li>
            );
          })}
        </motion.ol>
      </section>

      <p className="mt-12 px-1 text-caption text-muted-foreground">
        Version de test. Les contenus sont en cours de relecture par des professionnels.{" "}
        <Link href="/app/aide" className="underline underline-offset-4 hover:text-foreground">
          Aide, mentions et usage de vos données
        </Link>
      </p>
    </div>
  );
}
