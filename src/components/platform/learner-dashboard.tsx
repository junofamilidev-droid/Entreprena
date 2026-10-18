"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRightIcon, CheckIcon, ChevronRightIcon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Marked } from "@/components/ui/marked";
import { CountUp } from "@/components/motion/count-up";
import { displayName, useAuth } from "@/lib/auth/session";
import { useProgress, useProgressReady, type ProgressState } from "@/lib/progress/store";
import type { FormationWithModules, Module } from "@/lib/content/types";
import { moduleState, type ModuleRef } from "./module-progress";

/** Minutes d'une durée écrite « 6 min de lecture », « 60 min en 5 étapes » ; 0 si aucune. */
export function minutesOf(duration: string | null | undefined) {
  const m = duration?.match(/(\d+)\s*min/);
  return m ? Number(m[1]) : 0;
}

function formatDuration(total: number) {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

// Apparition en cascade : chaque bloc arrive un peu après le précédent.
const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

type ModuleStatus = "done" | "current" | "todo" | "soon";

interface ModuleRow {
  module: Module;
  status: ModuleStatus;
  /** Part des étapes faites, de 0 à 1. */
  ratio: number;
  started: boolean;
  href: string;
}

function rows(formation: FormationWithModules, refs: ModuleRef[], progress: ProgressState): ModuleRow[] {
  let currentFound = false;
  return formation.modules.map((m) => {
    const ref = refs.find((r) => r.formationSlug === formation.slug && r.module.slug === m.slug);
    if (m.availability !== "open" || !ref) {
      return { module: m, status: "soon", ratio: 0, started: false, href: `/formations/${formation.slug}` };
    }
    const st = moduleState(progress, ref);
    const ratio = ref.steps.length ? st.doneCount / ref.steps.length : 0;
    let status: ModuleStatus = st.finished ? "done" : "todo";
    if (!st.finished && !currentFound) {
      status = "current";
      currentFound = true;
    }
    return { module: m, status, ratio, started: st.started, href: `/formations/${formation.slug}/${m.slug}` };
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
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
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

export function LearnerDashboard({ formations, refs }: { formations: FormationWithModules[]; refs: ModuleRef[] }) {
  const auth = useAuth();
  const ready = useProgressReady();
  const progress = useProgress();

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

  const moduleRows = rows(formation, refs, progress);
  const total = moduleRows.length;
  const done = moduleRows.filter((r) => r.status === "done").length;
  const pct = total ? Math.round((moduleRows.reduce((s, r) => s + r.ratio, 0) / total) * 100) : 0;
  const shown = ready ? "show" : "hidden";

  // Temps restant : les durées connues des étapes des modules ouverts.
  let all = 0;
  let left = 0;
  for (const r of refs.filter((x) => x.formationSlug === formation.slug)) {
    for (const s of r.steps) {
      const m = minutesOf(s.duration);
      all += m;
      if (!progress[`${r.formationSlug}/${r.module.slug}/${s.slug}`]?.done) left += m;
    }
  }
  const final = [...formation.modules].sort((a, b) => b.position - a.position)[0];
  const firstName = auth.status === "user" ? displayName(auth.user).split(/\s+/)[0] : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-10">
      <p className="text-sm text-muted-foreground">{firstName ? `Bonjour ${firstName},` : "Bonjour,"}</p>
      <h1 className="mt-1 text-title text-balance">{formation.title}</h1>
      <p className="mt-2 max-w-3xl text-body text-muted-foreground">
        <Marked text={`${formation.promise} ${formation.summary}`} />
      </p>

      <motion.div variants={list} initial="hidden" animate={shown} className="mt-6 grid gap-4 lg:grid-cols-[1fr_17rem]">
        <motion.section variants={item} aria-label="Votre progression" className="grid rounded-lg border bg-card sm:grid-cols-[1fr_auto]">
          <div className="p-5">
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
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              />
            </div>
          </div>
          {all > 0 && (
            <div className="border-t p-5 sm:min-w-52 sm:border-t-0 sm:border-l">
              <h2 className="text-sm text-muted-foreground">Temps estimé restant</h2>
              <p className="mt-3 text-3xl font-semibold tracking-tight"><CountUp value={left} format={formatDuration} /></p>
              <p className="mt-1 text-sm text-muted-foreground">sur {formatDuration(all)} estimées</p>
            </div>
          )}
        </motion.section>

        {final && (
          <motion.section
            variants={item}
            aria-labelledby="projet-final"
            className="group flex flex-col rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <h2 id="projet-final" className="text-sm font-semibold">
              Votre projet final
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {final.title} : {final.deliverable.charAt(0).toLowerCase() + final.deliverable.slice(1)}
            </p>
            <Link
              href={`/formations/${formation.slug}`}
              className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-medium text-primary hover:underline"
            >
              En savoir plus <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </motion.section>
        )}
      </motion.div>

      <section aria-labelledby="parcours" className="mt-8">
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
                    {current && (
                      <span className="block font-medium text-primary">{r.started ? "En cours" : "À commencer"}</span>
                    )}
                    {soon ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <LockIcon className="size-3.5" aria-hidden /> À venir
                      </span>
                    ) : (
                      r.module.durationLabel && <span className="block text-muted-foreground">{r.module.durationLabel}</span>
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
