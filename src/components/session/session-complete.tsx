"use client";

import Link from "next/link";
import { motion, type Variants } from "motion/react";
import { ArrowRightIcon, BookmarkIcon, DownloadIcon, FileSpreadsheetIcon, LockIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawCheck } from "@/components/motion/draw-check";
import { CountUp } from "@/components/motion/count-up";
import { duration, ease, stagger } from "@/lib/motion";
import { formatSeconds } from "@/lib/sessions/progress";
import type { FicheBlock, OutilBlock, Session } from "@/lib/sessions/types";
import type { ExerciseInputs } from "@/lib/content/types";

export interface NextSession {
  titre: string;
  duree_min: number;
  /** Absent tant que la session n'est pas publiée. */
  href?: string;
}

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: stagger * 2, delayChildren: 0.35 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: duration.lent, ease: ease.out } },
};

function minutes(sec: number) {
  return Math.round(sec / 60);
}
const minLabel = (n: number) => `${n} min`;

// Fin de session : la réussite est ancrée (coche, chiffres réels), puis on montre la suite.
export function SessionComplete({
  session,
  moduleLabel,
  inputs,
  savedTotalSec,
  fileUrl,
  exitHref,
  next,
  onReview,
}: {
  session: Session;
  moduleLabel: string;
  inputs: ExerciseInputs;
  savedTotalSec: number;
  fileUrl: (name: string) => string;
  exitHref: string;
  next: NextSession | null;
  onReview: () => void;
}) {
  const start = Number(inputs["session:debut"]) || 0;
  const end = Number(inputs["session:fin"]) || 0;
  const realSec = start && end > start ? (end - start) / 1000 : 0;
  const gainSec = Number(inputs.gain_sec) || 0;
  const tools = session.blocs.filter((b): b is OutilBlock => b.type === "outil");
  const fiches = session.blocs.filter((b): b is FicheBlock => b.type === "fiche");

  const stats = [
    realSec > 0 && { label: "Durée réelle", value: Math.round(realSec), format: formatSeconds, sub: `pour ${session.duree_min} min prévues` },
    gainSec > 0 && { label: "Gagné sur la tâche", value: gainSec, format: formatSeconds, sub: "par rapport à votre défi" },
    savedTotalSec >= 60 && {
      label: "Temps gagné depuis le début",
      value: minutes(savedTotalSec),
      format: minLabel,
      sub: "toutes sessions confondues",
      strong: true,
    },
  ].filter(Boolean) as { label: string; value: number; format: (n: number) => string; sub: string; strong?: boolean }[];

  return (
    <div className="min-h-svh bg-background px-5 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18 }}
          className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <DrawCheck className="size-8" delay={0.15} />
        </motion.span>
        <p className="mt-6 text-sm text-muted-foreground">
          {moduleLabel} · session {session.session}
        </p>
        <h1 className="mt-1 text-title text-balance">Session terminée : {session.titre.charAt(0).toLowerCase() + session.titre.slice(1)}</h1>

        <motion.div variants={list} initial="hidden" animate="show" className="mt-10 space-y-10">
          <motion.dl variants={item} className={stats.length > 2 ? "grid gap-3 sm:grid-cols-3" : "grid gap-3 sm:grid-cols-2"}>
            {stats.map((s) => (
              <div
                key={s.label}
                className={s.strong ? "rounded-xl bg-primary p-4 text-primary-foreground" : "rounded-xl border bg-card p-4"}
              >
                <dt className={s.strong ? "text-sm opacity-85" : "text-sm text-muted-foreground"}>{s.label}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tight">
                  <CountUp value={s.value} format={s.format} duration={duration.recompense} />
                </dd>
                <dd className={s.strong ? "text-caption opacity-75" : "text-caption text-muted-foreground"}>{s.sub}</dd>
              </div>
            ))}
          </motion.dl>

          {(tools.length > 0 || fiches.length > 0) && (
            <motion.section variants={item} aria-labelledby="emporte" className="space-y-3">
              <h2 id="emporte" className="text-heading">
                Ce que vous emportez
              </h2>
              <ul className="divide-y overflow-hidden rounded-xl border bg-card">
                {tools.map((t) => (
                  <li key={t.fichier}>
                    <a href={fileUrl(t.fichier)} download className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
                      <FileSpreadsheetIcon className="size-5 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{t.fichier}</span>
                        <span className="block truncate text-caption text-muted-foreground">{t.description}</span>
                      </span>
                      <DownloadIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden />
                    </a>
                  </li>
                ))}
                {fiches.map((f) => (
                  <li key={f.titre} className="flex items-center gap-3 px-4 py-3">
                    <BookmarkIcon className="size-5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">Fiche : {f.titre}</span>
                      <span className="block text-caption text-muted-foreground">Rangée dans Ma boîte à outils</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.section>
          )}

          {next && (
            <motion.section variants={item} aria-labelledby="suite" className="rounded-xl border bg-card p-5">
              <p id="suite" className="text-sm text-muted-foreground">
                Session suivante · {next.duree_min} min
              </p>
              <p className="mt-1 font-semibold">{next.titre}</p>
              <div className="mt-4">
                {next.href ? (
                  <Button asChild>
                    <Link href={next.href}>
                      Commencer <ArrowRightIcon />
                    </Link>
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <LockIcon className="size-3.5" aria-hidden /> Bientôt disponible
                  </span>
                )}
              </div>
            </motion.section>
          )}

          <motion.div variants={item} className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant={next?.href ? "outline" : "default"}>
              <Link href={exitHref}>Revenir à l&apos;accueil</Link>
            </Button>
            <Button size="lg" variant="ghost" onClick={onReview}>
              <RotateCcwIcon /> Revoir la session
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
