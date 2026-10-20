"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, DownloadIcon, FileSpreadsheetIcon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/motion/count-up";
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
    const href = `/formations/${formation.slug}/${m.slug}`;
    const ref = refs.find((r) => r.formationSlug === formation.slug && r.module.slug === m.slug);
    const list = sessions[key] ?? [];
    if (m.availability !== "open" || (!ref && list.length === 0)) {
      return { module: m, status: "soon", ratio: 0, started: false, href: `/formations/${formation.slug}`, duration: null, resume: null };
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
        "grid size-9 shrink-0 place-items-center rounded-full border-2 text-sm font-semibold tabular-nums",
        row.status === "soon" ? "border-border text-muted-foreground" : "border-foreground/25 text-foreground",
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
        <Link href="/catalogue" className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
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
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-10">
      <p className="text-sm text-muted-foreground">{firstName ? `Bonjour ${firstName},` : "Bonjour,"}</p>

      <motion.div variants={list} initial="hidden" animate={shown} className="mt-4 space-y-4">
        {/* L'action principale : reprendre là où l'apprenant s'est arrêté. */}
        <motion.section variants={item} aria-labelledby="reprendre" className="rounded-xl border bg-card p-6 sm:p-7">
          {resume ? (
            <>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">{resume.started ? "Reprendre" : "Continuer"}</span> ·{" "}
                <Link href={`/formations/${formation.slug}`} className="hover:text-foreground hover:underline">
                  {formation.title}
                </Link>
              </p>
              <h1 id="reprendre" className="mt-1 text-title text-balance">
                {resume.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{resume.meta}</p>
              <Button asChild size="lg" className="mt-5">
                <Link href={resume.href}>
                  {resume.started ? "Reprendre" : "Commencer"} <ArrowRightIcon />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-primary">Tout est fait</p>
              <h1 id="reprendre" className="mt-1 text-title">
                Vous avez terminé ce qui est ouvert
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Les prochains modules s&apos;ouvriront ici.</p>
              <Button asChild size="lg" variant="outline" className="mt-5">
                <Link href="/certificat">Voir mon certificat</Link>
              </Button>
            </>
          )}
        </motion.section>

        <div className="grid gap-4 sm:grid-cols-2">
          <motion.section variants={item} aria-label="Votre progression" className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Votre progression</h2>
            <div className="mt-3 flex items-end justify-between gap-4">
              <p className="text-3xl font-semibold tracking-tight">
                <CountUp value={pct} />
                &nbsp;%
              </p>
              <p className="pb-1 text-sm text-muted-foreground tabular-nums">
                {done} / {total} modules
              </p>
            </div>
            <div
              role="progressbar"
              aria-label="Progression dans la formation"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: ready ? `${pct}%` : 0 }}
                transition={{ duration: duration.recompense, ease: ease.out, delay: 0.2 }}
              />
            </div>
          </motion.section>

          <motion.section variants={item} aria-label="Temps gagné" className="rounded-xl border bg-primary p-5 text-primary-foreground">
            <h2 className="text-sm font-semibold opacity-90">Temps gagné</h2>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              <CountUp value={savedSec} format={formatSeconds} />
            </p>
            <p className="mt-1 text-sm opacity-80">
              {savedSec > 0 ? "mesuré à chaque session : votre défi, puis la méthode" : "Il se mesure à chaque session : votre défi, puis la méthode."}
            </p>
          </motion.section>
        </div>

        {downloads.length > 0 && (
          <motion.section variants={item} aria-labelledby="outils" className="rounded-xl border bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="outils" className="text-sm font-semibold">
                Derniers outils téléchargés
              </h2>
              <Link href="/boite-a-outils" className="text-sm text-primary hover:underline">
                Ma boîte à outils
              </Link>
            </div>
            <ul className="mt-3 divide-y">
              {downloads.slice(0, 3).map((d) => (
                <li key={d.name}>
                  <a
                    href={d.href}
                    download
                    onClick={() => recordDownload({ name: d.name, href: d.href, source: d.source }, downloads)}
                    className="group flex items-center gap-3 py-2.5"
                  >
                    <FileSpreadsheetIcon className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{d.name}</span>
                      <span className="block truncate text-caption text-muted-foreground">{d.source}</span>
                    </span>
                    <DownloadIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </motion.div>

      <section aria-labelledby="parcours" className="mt-10">
        <h2 id="parcours" className="text-heading">
          Votre parcours
        </h2>
        <motion.ol variants={list} initial="hidden" animate={shown} className="mt-3 overflow-hidden rounded-lg border bg-card">
          {moduleRows.map((r) => {
            const current = r.status === "current";
            const soon = r.status === "soon";
            return (
              <motion.li variants={item} key={r.module.id} className="border-b last:border-b-0">
                <Link
                  href={r.href}
                  className={cn(
                    "group flex items-center gap-4 px-4 py-3.5 transition-colors sm:px-5",
                    current ? "bg-accent/70 hover:bg-accent" : "hover:bg-muted/60",
                  )}
                >
                  <StatusDot row={r} />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block font-medium", soon && "text-muted-foreground")}>
                      {r.module.position}. {r.module.title}
                    </span>
                    <span className="block truncate text-sm text-muted-foreground">{r.module.summary}</span>
                  </span>
                  <span className="hidden shrink-0 text-right text-sm sm:block">
                    {current && <span className="block font-medium text-primary">{r.started ? "En cours" : "À commencer"}</span>}
                    {soon ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <LockIcon className="size-3.5" aria-hidden /> À venir
                      </span>
                    ) : (
                      r.duration && <span className="block text-muted-foreground">{r.duration}</span>
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

      <p className="mt-10 text-caption text-muted-foreground">
        Version de test. Les contenus sont en cours de relecture par des professionnels.{" "}
        <Link href="/aide" className="underline underline-offset-4 hover:text-foreground">
          Aide, mentions et usage de vos données
        </Link>
      </p>
    </div>
  );
}
