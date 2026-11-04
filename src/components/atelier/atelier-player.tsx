"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  CopyIcon,
  LaptopIcon,
  MailIcon,
  MessageCircleQuestionIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import { forLearner } from "@/lib/sessions/display";
import { sessionKey } from "@/lib/sessions/progress";
import { trackSession } from "@/lib/sessions/track";
import { recordDownload, useDownloads } from "@/lib/sessions/downloads";
import { panneauLabel, type AtelierEtape, type AtelierSession } from "@/lib/sessions/atelier";
import type { ExerciseInputs, ExerciseValue } from "@/lib/content/types";
import {
  DownloadCard,
  FicheView,
  OutilPanel,
  PersonnaliserPanel,
  QuizPanel,
  TestPanel,
  panelOrbState,
  type FilEvent,
  type OrbState,
  type PanelCtx,
} from "./panels";

const ORB_LABEL: Record<OrbState, string> = {
  idle: "En attente",
  active: "En cours",
  success: "C'est bon",
  warn: "À revoir",
};

function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/* ---------------- Mission (toujours visible en haut) ---------------- */

function MissionBar({ session, relances }: { session: AtelierSession; relances: { expediteur: string; message: string; etape: number }[] }) {
  const m = session.mission;
  const [open, setOpen] = React.useState(false);
  const latest = relances[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.a_copier);
      toast.success("Contexte copié : collez-le dans Claude.");
    } catch {
      toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
    }
  }

  return (
    <section aria-label="Mission" className="relative z-30 border-b bg-card">
      {/* Une relance qui arrive fait briller la barre, sans couvrir l'espace de travail. */}
      {latest && (
        <motion.span
          key={relances.length}
          className="pointer-events-none absolute inset-0 bg-primary/15"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2.4, ease: "easeOut" }}
          aria-hidden
        />
      )}
      <div className="relative mx-auto flex max-w-[90rem] items-center gap-3 px-6 py-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials(m.expediteur)}
        </span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">
              <span className="font-semibold">{m.expediteur}</span>
              <span className="text-muted-foreground"> · {latest ? `Nouveau message : ${latest.message}` : m.objet}</span>
            </span>
          </span>
          {latest && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-foreground">{relances.length} relance{relances.length > 1 ? "s" : ""}</span>}
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium xl:inline-flex">
            <ClockIcon className="size-3" aria-hidden /> {m.echeance}
          </span>
          <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
        </button>
        <Button size="sm" variant="outline" onClick={copy}>
          <CopyIcon /> Copier le contexte
        </Button>
      </div>
      {open && <button type="button" aria-label="Fermer la mission" className="fixed inset-0 z-0 cursor-default" onClick={() => setOpen(false)} />}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: duration.rapide, ease: ease.out }}
            className="absolute inset-x-0 top-full max-h-[65vh] overflow-y-auto border-b bg-card shadow-lg"
          >
            <div className="mx-auto max-w-[90rem] space-y-3 px-6 py-4">
              {relances.map((r) => (
                <div key={r.etape} className="rounded-lg border-l-2 border-primary bg-accent/50 px-4 py-2.5">
                  <p className="text-caption font-semibold text-primary">
                    {r.expediteur} · relance à l&apos;étape {r.etape + 1}
                  </p>
                  <p className="mt-0.5 text-body">{r.message}</p>
                </div>
              ))}
              <div className="rounded-lg border bg-background px-4 py-3">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MailIcon className="size-4 text-primary" aria-hidden /> {m.objet}
                </p>
                <p className="mt-2 text-body whitespace-pre-line">{m.message}</p>
                <p className="mt-3 text-sm">
                  <span className="font-medium">Livrable attendu : </span>
                  <span className="text-muted-foreground">{m.livrable}</span>
                  <span className="text-muted-foreground"> · pour {m.echeance}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------------- Tuteur (zone de gauche) ---------------- */

function TutorBubble({ children, me = false }: { children: React.ReactNode; me?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.standard, ease: ease.out }}
      className={cn("rounded-2xl px-4 py-3 text-sm leading-relaxed", me ? "ml-8 rounded-br-md bg-primary text-primary-foreground" : "mr-4 rounded-bl-md border bg-card")}
    >
      {children}
    </motion.div>
  );
}

function Tutor({ session, etape, index, fil, onAide }: { session: AtelierSession; etape: AtelierEtape; index: number; fil: FilEvent[]; onAide: (j: number) => void }) {
  const end = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [fil.length]);
  const p = etape.panneau;
  const opened = new Set(fil.filter((e) => e.t === "aide").map((e) => e.r));

  function reaction(e: FilEvent, key: number) {
    if (e.t === "aide") {
      const a = etape.aides[Number(e.r)];
      return a ? (
        <React.Fragment key={key}>
          <TutorBubble me>{a.question}</TutorBubble>
          <TutorBubble>{a.reponse}</TutorBubble>
        </React.Fragment>
      ) : null;
    }
    if (e.t === "quiz" && p.type === "quiz")
      return (
        <TutorBubble key={key}>
          <span className="font-semibold">{Number(e.r) === p.bonne ? "Exact. " : "Pas tout à fait. "}</span>
          {p.explication}
        </TutorBubble>
      );
    if (e.t === "regle" && p.type === "outil") {
      const r = p.regles[Number(e.r)];
      return r ? (
        <TutorBubble key={key}>
          <span className="font-semibold">{r.titre}. </span>
          {r.explication}
        </TutorBubble>
      ) : null;
    }
    if (e.t === "verif" && p.type === "test")
      return (
        <TutorBubble key={key}>
          <ul className="space-y-2">
            {p.verifications.map((v, i) => (
              <li key={i} className="flex gap-2">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", e.r[i] === "1" ? "bg-success" : "bg-warning")} aria-hidden />
                <span>{e.r[i] === "1" ? v.si_reussi : v.si_manque}</span>
              </li>
            ))}
          </ul>
        </TutorBubble>
      );
    return null;
  }

  return (
    <aside aria-label={`${session.tuteur.nom}, votre tuteur`} className="flex min-h-0 flex-col border-r bg-muted/30">
      <div className="flex items-center gap-3 border-b px-5 py-3">
        <span className="grid size-9 place-items-center rounded-full bg-foreground text-sm font-semibold text-background">{initials(session.tuteur.nom)}</span>
        <span>
          <span className="block text-sm font-semibold">{session.tuteur.nom}</span>
          <span className="block text-caption text-muted-foreground">{session.tuteur.role}, votre tuteur</span>
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="space-y-4 rounded-2xl rounded-tl-md border bg-card p-4">
          <p className="text-caption font-semibold tracking-wide text-primary uppercase">
            Étape {index + 1} · {etape.titre}
          </p>
          <div>
            <p className="text-caption font-medium text-muted-foreground">Objectif</p>
            <p className="font-semibold text-balance">{etape.objectif}</p>
          </div>
          <div>
            <p className="text-caption font-medium text-muted-foreground">Pourquoi c&apos;est utile</p>
            <p className="text-sm">{etape.pourquoi}</p>
          </div>
          <div>
            <p className="text-caption font-medium text-muted-foreground">Maintenant</p>
            <ol className="mt-1 space-y-1.5">
              {etape.a_faire.map((t, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-[0.6875rem] font-semibold text-primary-foreground tabular-nums">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        {fil.map(reaction)}
        <div ref={end} />
      </div>
      {etape.aides.some((_, j) => !opened.has(String(j))) && (
        <div className="space-y-2 border-t px-5 py-3">
          <p className="text-caption font-medium text-muted-foreground">Besoin d&apos;aide ?</p>
          <div className="flex flex-wrap gap-2">
            {etape.aides.map((a, j) =>
              opened.has(String(j)) ? null : (
                <button
                  key={j}
                  type="button"
                  onClick={() => onAide(j)}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent/40"
                >
                  <MessageCircleQuestionIcon className="size-3.5 shrink-0 text-primary" aria-hidden /> {a.question}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

/* ---------------- Accueil et fin ---------------- */

function Welcome({ session, onStart, started }: { session: AtelierSession; onStart: () => void; started: boolean }) {
  const a = session.accueil;
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 xl:grid-cols-[1.2fr_1fr] xl:gap-14">
      <div className="space-y-7">
        <div className="space-y-3">
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <ClockIcon className="size-4" aria-hidden /> {session.duree_min} min · {session.etapes.length} étapes · avec {session.tuteur.nom}, {session.tuteur.role.toLowerCase()}
          </p>
          <h1 className="text-[2.6rem] leading-[1.08] font-bold tracking-tight text-balance">{session.titre}</h1>
          <p className="text-lead text-muted-foreground">{a.ce_que_vous_allez_faire}</p>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Ce que vous emportez</h2>
          <ul className="space-y-2">
            {a.ce_que_vous_emportez.map((t) => (
              <li key={t} className="flex gap-3 text-body">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" strokeWidth={3} aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 rounded-xl border-l-2 border-primary bg-accent/40 px-5 py-4">
          <h2 className="text-sm font-semibold">Pourquoi c&apos;est utile</h2>
          <p className="text-body">{a.pourquoi}</p>
        </div>
        <Button size="lg" onClick={onStart}>
          {started ? "Reprendre" : "Commencer"} <ArrowRightIcon />
        </Button>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Le plan</h2>
        <ol className="overflow-hidden rounded-xl border bg-card">
          {session.etapes.map((e, i) => (
            <li key={i} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-primary/30 text-sm font-semibold text-primary tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{e.titre}</span>
                <span className="block text-sm text-muted-foreground">{e.objectif}</span>
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-caption text-muted-foreground">{panneauLabel[e.panneau.type]}</span>
            </li>
          ))}
        </ol>
        <p className="text-caption text-muted-foreground">
          Gardez votre Claude ouvert à côté : c&apos;est là que l&apos;outil travaille. La plateforme vous guide et vérifie.
        </p>
      </div>
    </div>
  );
}

function Finish({ session, exitHref, fileUrl, onReview }: { session: AtelierSession; exitHref: string; fileUrl: (n: string) => string; onReview: () => void }) {
  const fiche = session.etapes.map((e) => e.panneau).find((p) => p.type === "fiche");
  const outils = session.etapes.map((e) => e.panneau).filter((p) => p.type === "outil");
  const downloads = useDownloads();
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 xl:grid-cols-[1fr_1fr] xl:gap-14">
      <div className="space-y-7">
        <div className="orb size-16" data-state="success" aria-hidden />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Session terminée</p>
          <h1 className="text-title text-balance">{session.titre}</h1>
        </div>
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Ce que vous avez obtenu</h2>
          <ul className="space-y-2">
            {session.fin.recapitulatif.map((t, i) => (
              <motion.li
                key={t}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: duration.lent, ease: ease.out, delay: 0.2 + i * 0.08 }}
                className="flex gap-3 text-body"
              >
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-success text-white">
                  <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {t}
              </motion.li>
            ))}
          </ul>
        </div>
        {outils.map((o) =>
          o.type === "outil" ? (
            <div key={o.fichier} onClick={() => recordDownload({ name: o.fichier, href: fileUrl(o.fichier), source: session.titre }, downloads)}>
              <DownloadCard name={o.fichier} href={fileUrl(o.fichier)} label="Votre outil, à garder" icon={/\.zip$/i.test(o.fichier) ? "zip" : "file"} />
            </div>
          ) : null,
        )}
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={exitHref}>Revenir au module</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/boite-a-outils">Ma boîte à outils</Link>
          </Button>
          <Button size="lg" variant="ghost" onClick={onReview}>
            Revoir la session
          </Button>
        </div>
      </div>
      {fiche && fiche.type === "fiche" && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Votre fiche</h2>
          <FicheView p={fiche} />
        </div>
      )}
    </div>
  );
}

/* ---------------- Lecteur ---------------- */

// Lecteur du format « atelier » : la mission en haut, le tuteur à gauche, l'espace de travail
// à droite. Une étape à la fois ; la progression est enregistrée comme pour les autres sessions.
export function AtelierPlayer({
  session: raw,
  moduleLabel,
  exitHref,
  fileBase,
  keyPrefix = "",
  measure = true,
}: {
  session: AtelierSession;
  moduleLabel: string;
  exitHref: string;
  fileBase: string;
  keyPrefix?: string;
  measure?: boolean;
}) {
  const reduce = useReducedMotion();
  const ready = useProgressReady();
  const progress = useProgress();
  const session = React.useMemo(() => forLearner(raw), [raw]);
  const baseKey = sessionKey(session.formation, session.module, session.session);
  const key = keyPrefix + baseKey;
  const saved = progress[key];
  const inputs = React.useMemo(() => saved?.inputs ?? {}, [saved?.inputs]);
  const n = session.etapes.length;
  // Écran : 0 = accueil, 1..n = étapes, n + 1 = fin.
  const [screenState, setScreen] = React.useState<number | null>(null);
  const screen = screenState ?? (ready && saved ? (saved.done ? n + 1 : Math.min(saved.screen, n + 1)) : 0);
  const furthest = Math.max(screen, Number(inputs["session:max"]) || 0);
  const [direction, setDirection] = React.useState(1);

  const setMany = React.useCallback((values: ExerciseInputs) => saveStep(key, { inputs: { ...inputs, ...values } }), [key, inputs]);
  const fileUrl = (name: string) => `${fileBase}/${encodeURIComponent(name)}`;

  function go(t: number) {
    const target = Math.max(0, Math.min(t, n + 1));
    setDirection(target >= screen ? 1 : -1);
    setScreen(target);
    const now = String(Date.now());
    const first = !inputs["session:debut"];
    if (first && target > 0 && measure) trackSession(baseKey, "started");
    const done = target === n + 1;
    saveStep(key, {
      screen: target,
      ...(done ? { done: true } : {}),
      inputs: {
        ...inputs,
        "session:max": String(Math.max(furthest, target)),
        ...(first && target > 0 ? { "session:debut": now } : {}),
        ...(done ? { "session:fin": now } : {}),
      },
    });
    if (done && measure) {
      const start = Number(inputs["session:debut"]) || 0;
      trackSession(baseKey, "completed", { duration_sec: start ? (Date.now() - start) / 1000 : undefined });
    }
  }

  // Relances des étapes déjà atteintes, la plus récente en tête.
  const relances = session.etapes
    .map((e, i) => (e.relance && i + 1 <= furthest && furthest <= n + 1 ? { ...e.relance, etape: i } : null))
    .filter((r): r is { expediteur: string; message: string; etape: number } => r !== null)
    .reverse();

  const i = screen - 1;
  const etape = screen >= 1 && screen <= n ? session.etapes[i] : null;
  const filKey = `e${i}:fil`;
  const fil = (Array.isArray(inputs[filKey]) ? (inputs[filKey] as Record<string, string>[]) : []) as unknown as FilEvent[];
  const push = (e: FilEvent, extra: ExerciseInputs = {}) => setMany({ [filKey]: [...fil, e] as unknown as Record<string, string>[], ...extra });
  const ctx: PanelCtx = {
    index: i,
    inputs,
    set: (id: string, v: ExerciseValue) => setMany({ [id]: v }),
    setMany,
    push,
    fileUrl,
    tuteur: session.tuteur.nom,
  };
  const p = etape?.panneau;
  const orb: OrbState = p
    ? panelOrbState(p.type, i, inputs, p.type === "test" ? p.verifications.length : 0, p.type === "personnaliser" ? p.items.length : 0, p.type === "quiz" ? p.bonne : -1)
    : "idle";

  const progressPct = Math.round((Math.min(screen, n) / n) * 100);

  return (
    <>
      {/* Sous 1 024 px : la session se fait sur ordinateur. */}
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-8 text-center lg:hidden">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
          <LaptopIcon className="size-7" aria-hidden />
        </span>
        <h1 className="text-title text-balance">Cette session se fait sur ordinateur</h1>
        <p className="max-w-sm text-body text-muted-foreground">
          Elle se travaille sur deux zones, avec Claude ouvert à côté : un écran large est nécessaire.
        </p>
        <Button asChild>
          <Link href="/">Revenir à l&apos;accueil</Link>
        </Button>
      </div>

      <div className={cn("hidden h-svh flex-col bg-background lg:flex", !ready && "invisible")}>
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 max-w-[90rem] items-center gap-4 px-6">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter la session">
              <Link href={exitHref}>
                <XIcon />
              </Link>
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-caption text-muted-foreground">
                {moduleLabel} · session {session.session} · {session.duree_min} min
              </p>
              <p className="truncate text-sm font-semibold">{session.titre}</p>
            </div>
            <nav aria-label="Étapes" className="flex items-center gap-1.5">
              {session.etapes.map((e, j) => {
                const done = j + 1 < screen || screen === n + 1;
                const current = j + 1 === screen;
                const reachable = j + 1 <= furthest;
                return (
                  <button
                    key={j}
                    type="button"
                    disabled={!reachable}
                    onClick={() => go(j + 1)}
                    title={e.titre}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors",
                      current && "bg-primary text-primary-foreground",
                      !current && done && "bg-accent text-accent-foreground hover:bg-accent/70",
                      !current && !done && "text-muted-foreground",
                      !reachable && "opacity-50",
                    )}
                  >
                    {done && !current ? <CheckIcon className="size-3" strokeWidth={3} aria-hidden /> : <span className="tabular-nums">{j + 1}</span>}
                    <span className={cn(!current && "hidden 2xl:inline")}>{e.titre}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="h-0.5 bg-muted">
            <motion.div className="h-full bg-primary" initial={false} animate={{ width: `${progressPct}%` }} transition={{ duration: duration.lent, ease: ease.out }} />
          </div>
        </header>

        <MissionBar session={session} relances={relances} />

        <main className="min-h-0 flex-1">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={screen}
              initial={reduce ? false : { opacity: 0, x: 18 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: -18 * direction }}
              transition={{ duration: duration.standard, ease: ease.out }}
              className="h-full"
            >
              {screen === 0 ? (
                <div className="h-full overflow-y-auto">
                  <Welcome session={session} started={furthest > 0} onStart={() => go(Math.max(1, Math.min(furthest, n)))} />
                </div>
              ) : screen === n + 1 ? (
                <div className="h-full overflow-y-auto">
                  <Finish session={session} exitHref={exitHref} fileUrl={fileUrl} onReview={() => go(1)} />
                </div>
              ) : etape && p ? (
                <div className="mx-auto grid h-full max-w-[90rem] grid-cols-[minmax(20rem,26rem)_1fr]">
                  <Tutor session={session} etape={etape} index={i} fil={fil} onAide={(j) => push({ t: "aide", r: String(j) })} />
                  <section aria-label="Espace de travail" className="flex min-h-0 flex-col">
                    <div className="flex items-center justify-between gap-4 border-b px-8 py-3">
                      <div>
                        <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">{panneauLabel[p.type]}</p>
                        <h2 className="text-lg font-semibold">{etape.titre}</h2>
                      </div>
                      <div className="flex items-center gap-3" role="status" aria-live="polite">
                        <span className="text-sm text-muted-foreground">{ORB_LABEL[orb]}</span>
                        <div className="orb size-11" data-state={orb} aria-hidden />
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
                      <div className="mx-auto max-w-3xl">
                        {p.type === "quiz" && <QuizPanel p={p} ctx={ctx} />}
                        {p.type === "outil" && <OutilPanel p={p} ctx={ctx} />}
                        {p.type === "test" && <TestPanel p={p} ctx={ctx} />}
                        {p.type === "personnaliser" && <PersonnaliserPanel p={p} ctx={ctx} />}
                        {p.type === "fiche" && <FicheView p={p} />}
                      </div>
                    </div>
                  </section>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </main>

        {screen >= 1 && screen <= n && (
          <footer className="border-t bg-background">
            <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-6 py-3">
              <Button variant="ghost" onClick={() => go(screen - 1)}>
                <ArrowLeftIcon /> {screen === 1 ? "Accueil" : "Étape précédente"}
              </Button>
              <p className="text-sm text-muted-foreground tabular-nums">
                Étape {screen} sur {n}
              </p>
              <Button size="lg" onClick={() => go(screen + 1)}>
                {screen === n ? "Terminer la session" : "Étape suivante"} <ArrowRightIcon />
              </Button>
            </div>
          </footer>
        )}
      </div>
    </>
  );
}
