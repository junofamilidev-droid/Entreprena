"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ChevronDownIcon, CopyIcon, GraduationCapIcon, LaptopIcon, MailIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

const STATE_LABEL: Record<OrbState, string> = {
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

/** Texte du tuteur : les passages écrits **ainsi** sont en gras. */
function Rich({ text }: { text: string }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    /^\*\*.+\*\*$/.test(part) ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

function Appear({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.lent, ease: ease.out, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- Messages de la cheffe de mission ---------------- */

async function copyContext(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Contexte copié : collez-le dans Claude.");
  } catch {
    toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
  }
}

function MissionMessage({ session, compact = false }: { session: AtelierSession; compact?: boolean }) {
  const m = session.mission;
  return (
    <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
      <p className="flex items-center gap-1.5 text-caption font-medium text-muted-foreground">
        <MailIcon className="size-3.5" aria-hidden /> Mission reçue · votre cheffe de mission vous écrit
      </p>
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initials(m.expediteur)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{m.expediteur}</p>
          <p className="truncate text-caption text-muted-foreground">
            Objet : {m.objet} · pour {m.echeance}
          </p>
        </div>
      </div>
      <p className={cn("text-[0.9375rem] leading-relaxed whitespace-pre-line", compact && "line-clamp-4")}>{m.message}</p>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Livrable : </span>
        {m.livrable}
      </p>
      <Button size="sm" variant="secondary" className="rounded-full bg-background" onClick={() => copyContext(m.a_copier)}>
        <CopyIcon /> Copier le contexte
      </Button>
    </div>
  );
}

function RelanceMessage({ expediteur, message }: { expediteur: string; message: string }) {
  return (
    <div className="flex gap-2.5 rounded-2xl bg-accent/70 p-4">
      <MailIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="text-caption font-semibold text-primary">Nouveau message de {expediteur}</p>
        <p className="mt-0.5 text-[0.9375rem] leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

/* ---------------- Fil du tuteur (colonne de gauche) ---------------- */

function TutorSays({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 text-[1.125rem] leading-[1.7] text-foreground/85">{children}</div>;
}

function StepThread({ session, etape, index, fil }: { session: AtelierSession; etape: AtelierEtape; index: number; fil: FilEvent[] }) {
  const p = etape.panneau;
  return (
    <div className="space-y-7">
      {etape.relance && (
        <Appear>
          <RelanceMessage {...etape.relance} />
        </Appear>
      )}
      <Appear delay={etape.relance ? 0.15 : 0}>
        <TutorSays>
          <p className="text-[1.25rem] leading-snug font-semibold text-balance text-foreground">
            <Rich text={etape.objectif} />
          </p>
          <p>
            <Rich text={etape.pourquoi} />
          </p>
          <ol className="space-y-2">
            {etape.a_faire.map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-[0.3rem] grid size-5 shrink-0 place-items-center rounded-full bg-foreground/[0.07] text-[0.6875rem] font-semibold text-foreground/70 tabular-nums">
                  {i + 1}
                </span>
                <span className="text-base leading-relaxed">
                  <Rich text={t} />
                </span>
              </li>
            ))}
          </ol>
        </TutorSays>
      </Appear>
      {fil.map((e, key) => {
        if (e.t === "aide") {
          const a = etape.aides[Number(e.r)];
          if (!a) return null;
          return (
            <Appear key={key} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-foreground/[0.06] px-3.5 py-2 text-sm">{a.question}</p>
              <TutorSays>
                <p>
                  <Rich text={a.reponse} />
                </p>
              </TutorSays>
            </Appear>
          );
        }
        if (e.t === "quiz" && p.type === "quiz")
          return (
            <Appear key={key}>
              <TutorSays>
                <p>
                  <strong className="font-semibold text-foreground">{Number(e.r) === p.bonne ? "Exact. " : "Pas tout à fait. "}</strong>
                  <Rich text={p.explication} />
                </p>
              </TutorSays>
            </Appear>
          );
        if (e.t === "regle" && p.type === "outil") {
          const r = p.regles[Number(e.r)];
          return r ? (
            <Appear key={key}>
              <TutorSays>
                <p>
                  <strong className="font-semibold text-foreground">{r.titre}. </strong>
                  <Rich text={r.explication} />
                </p>
              </TutorSays>
            </Appear>
          ) : null;
        }
        if (e.t === "verif" && p.type === "test")
          return (
            <Appear key={key}>
              <ul className="space-y-3 text-base leading-relaxed text-foreground/85">
                {p.verifications.map((v, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={cn("mt-2 size-2 shrink-0 rounded-full", e.r[i] === "1" ? "bg-success" : "bg-warning")} aria-hidden />
                    <span>
                      <Rich text={e.r[i] === "1" ? v.si_reussi : v.si_manque} />
                    </span>
                  </li>
                ))}
              </ul>
            </Appear>
          );
        return null;
      })}
      <span className="sr-only">
        Étape {index + 1} sur {session.etapes.length}
      </span>
    </div>
  );
}

/* ---------------- Barre latérale fine (droite) ---------------- */

function ProgressRing({ pct }: { pct: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5" role="img" aria-label={`Progression : ${pct} %`}>
      <span className="relative grid size-14 place-items-center">
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
        <span className="text-xs font-semibold tabular-nums">{pct}%</span>
      </span>
      <span className="text-[0.6875rem] text-muted-foreground">Progression</span>
    </div>
  );
}

function RailButton({ label, onClick, children, dot }: { label: string; onClick: () => void; children: React.ReactNode; dot?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="group flex flex-col items-center gap-1.5" aria-label={label}>
      <span className="relative grid size-11 place-items-center rounded-full bg-muted/70 text-foreground/70 transition-colors group-hover:bg-muted group-hover:text-foreground">
        {children}
        {dot && <span className="absolute top-0.5 right-0.5 size-2.5 rounded-full border-2 border-background bg-primary" aria-hidden />}
      </span>
      <span className="text-[0.6875rem] text-muted-foreground">{label}</span>
    </button>
  );
}

/* ---------------- Cartes de l'accueil et de la fin (droite) ---------------- */

function WelcomeCard({ session }: { session: AtelierSession }) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {session.duree_min} min · {session.etapes.length} étapes
        </p>
        <h1 className="text-[2rem] leading-tight font-bold tracking-tight text-balance">{session.titre}</h1>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Ce que vous emportez</h2>
        <ul className="space-y-2">
          {session.accueil.ce_que_vous_emportez.map((t) => (
            <li key={t} className="flex gap-3 text-body">
              <CheckIcon className="mt-1 size-4 shrink-0 text-success" strokeWidth={3} aria-hidden />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Le plan</h2>
        <ol className="space-y-1">
          {session.etapes.map((e, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-xs font-semibold tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate">{e.titre}</span>
              <span className="text-caption text-muted-foreground">{panneauLabel[e.panneau.type]}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function FinishCard({ session, fileUrl }: { session: AtelierSession; fileUrl: (n: string) => string }) {
  const fiche = session.etapes.map((e) => e.panneau).find((p) => p.type === "fiche");
  const outils = session.etapes.map((e) => e.panneau).filter((p) => p.type === "outil");
  const downloads = useDownloads();
  return (
    <div className="space-y-8">
      {outils.map((o) =>
        o.type === "outil" ? (
          <div key={o.fichier} onClick={() => recordDownload({ name: o.fichier, href: fileUrl(o.fichier), source: session.titre }, downloads)}>
            <DownloadCard name={o.fichier} href={fileUrl(o.fichier)} label="Votre outil, à garder" icon={/\.zip$/i.test(o.fichier) ? "zip" : "file"} />
          </div>
        ) : null,
      )}
      {fiche && fiche.type === "fiche" && <FicheView p={fiche} />}
    </div>
  );
}

/* ---------------- Lecteur ---------------- */

// Lecteur du format « atelier ». À gauche, le fil du tuteur (mission, relances, consignes,
// réponses) en grand texte ; à droite, un canevas d'ambiance dont la teinte suit l'état, avec
// le travail dans une carte flottante ; tout à droite, une barre fine (progression, mission).
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
  const [missionOpen, setMissionOpen] = React.useState(false);
  const thread = React.useRef<HTMLDivElement>(null);

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
  const state: OrbState = p
    ? panelOrbState(p.type, i, inputs, p.type === "test" ? p.verifications.length : 0, p.type === "personnaliser" ? p.items.length : 0, p.type === "quiz" ? p.bonne : -1)
    : screen === n + 1
      ? "success"
      : "idle";
  const pct = Math.round((Math.min(screen === n + 1 ? n : Math.max(screen - 1, 0), n) / n) * 100);
  const relances = session.etapes.map((e, j) => (e.relance && j + 1 <= furthest ? { ...e.relance, etape: j } : null)).filter((r) => r !== null);
  const openedAides = new Set(fil.filter((e) => e.t === "aide").map((e) => e.r));

  // Nouvel écran : le fil repart du haut. Nouveau message : il défile jusqu'en bas.
  React.useEffect(() => {
    thread.current?.scrollTo({ top: 0 });
  }, [screen]);
  React.useEffect(() => {
    const el = thread.current;
    if (el && fil.length) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [fil.length, reduce]);

  return (
    <>
      {/* Sous 1 024 px : la session se fait sur ordinateur. */}
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 px-8 text-center lg:hidden">
        <span className="grid size-14 place-items-center rounded-full bg-accent text-primary">
          <LaptopIcon className="size-7" aria-hidden />
        </span>
        <h1 className="text-title text-balance">Cette session se fait sur ordinateur</h1>
        <p className="max-w-sm text-body text-muted-foreground">Elle se travaille sur deux zones, avec Claude ouvert à côté : un écran large est nécessaire.</p>
        <Button asChild>
          <Link href="/">Revenir à l&apos;accueil</Link>
        </Button>
      </div>

      <div className={cn("hidden h-svh grid-cols-[minmax(22rem,34rem)_1fr_5.5rem] bg-background lg:grid", !ready && "invisible")}>
        {/* ----- Colonne du tuteur ----- */}
        <section aria-label={`${session.tuteur.nom}, votre tuteur`} className="flex min-h-0 flex-col border-r">
          <header className="flex items-center gap-2 px-6 pt-5 pb-3">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter la session">
              <Link href={exitHref}>
                <XIcon />
              </Link>
            </Button>
            <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {moduleLabel} <span className="text-foreground/30">/</span> <span className="text-foreground">{session.titre}</span>
            </p>
            {screen >= 1 && screen <= n && (
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/70 px-3 py-1.5 text-xs font-medium tabular-nums hover:bg-muted">
                  {screen} / {n} <ChevronDownIcon className="size-3.5" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {session.etapes.map((e, j) => (
                    <DropdownMenuItem key={j} disabled={j + 1 > furthest} onSelect={() => go(j + 1)} className={cn(j + 1 === screen && "font-semibold")}>
                      <span className="w-4 text-muted-foreground tabular-nums">{j + 1}</span>
                      <span className="flex-1 truncate">{e.titre}</span>
                      {j + 1 < furthest && <CheckIcon className="size-3.5 text-success" aria-hidden />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          <div ref={thread} className="min-h-0 flex-1 overflow-y-auto px-8 pt-4 pb-8">
            <div className="flex items-center gap-2.5 pb-6">
              <span className="grid size-8 place-items-center rounded-xl bg-foreground text-background" aria-hidden>
                <GraduationCapIcon className="size-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold">{session.tuteur.nom}, votre tuteur</span>
                <span className="block text-caption text-muted-foreground">{session.tuteur.role} · il vous guide pas à pas</span>
              </span>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={screen}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: duration.standard, ease: ease.out }}
              >
                {screen === 0 && (
                  <div className="space-y-7">
                    <Appear>
                      <MissionMessage session={session} />
                    </Appear>
                    <Appear delay={0.15}>
                      <TutorSays>
                        <p>
                          Bonjour, je suis {session.tuteur.nom}, votre tuteur pour cette session ({session.tuteur.role.toLowerCase()}). {session.mission.expediteur.split(",")[0]} vous a confié la mission ci-dessus : je vous accompagne pendant {session.duree_min} minutes pour la réaliser.
                        </p>
                        <p>
                          <Rich text={session.accueil.ce_que_vous_allez_faire} />
                        </p>
                        <p>
                          <Rich text={session.accueil.pourquoi} />
                        </p>
                        <p className="text-base text-muted-foreground">Gardez votre Claude ouvert à côté : c&apos;est là que l&apos;outil travaille.</p>
                      </TutorSays>
                    </Appear>
                  </div>
                )}
                {etape && <StepThread session={session} etape={etape} index={i} fil={fil} />}
                {screen === n + 1 && (
                  <TutorSays>
                    <p className="text-[1.25rem] font-semibold text-foreground">C&apos;est terminé. Voici ce que vous avez obtenu :</p>
                    <ul className="space-y-2.5">
                      {session.fin.recapitulatif.map((t, j) => (
                        <Appear key={t} delay={0.1 + j * 0.08}>
                          <li className="flex gap-3 text-base">
                            <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-success text-white">
                              <CheckIcon className="size-3" strokeWidth={3} aria-hidden />
                            </span>
                            {t}
                          </li>
                        </Appear>
                      ))}
                    </ul>
                  </TutorSays>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Aides et navigation */}
          <div className="space-y-3 px-6 pt-3 pb-5">
            {etape && etape.aides.some((_, j) => !openedAides.has(String(j))) && (
              <div className="flex flex-wrap gap-2">
                {etape.aides.map((a, j) =>
                  openedAides.has(String(j)) ? null : (
                    <button
                      key={j}
                      type="button"
                      onClick={() => push({ t: "aide", r: String(j) })}
                      className="rounded-full bg-accent/70 px-3.5 py-1.5 text-left text-sm font-medium text-accent-foreground transition-colors hover:bg-accent"
                    >
                      {a.question}
                    </button>
                  ),
                )}
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              {screen === 0 ? (
                <span />
              ) : (
                <Button variant="ghost" className="rounded-full" onClick={() => go(screen - 1)}>
                  <ArrowLeftIcon /> {screen === 1 ? "Accueil" : "Précédent"}
                </Button>
              )}
              {screen === 0 && (
                <Button size="lg" className="rounded-full px-6" onClick={() => go(Math.max(1, Math.min(furthest, n)))}>
                  {furthest > 0 ? "Reprendre" : "Commencer"} <ArrowRightIcon />
                </Button>
              )}
              {screen >= 1 && screen <= n && (
                <Button size="lg" className="rounded-full px-6" onClick={() => go(screen + 1)}>
                  {screen === n ? "Terminer" : "Suivant"} <ArrowRightIcon />
                </Button>
              )}
              {screen === n + 1 && (
                <div className="flex gap-2">
                  <Button variant="ghost" className="rounded-full" onClick={() => go(1)}>
                    Revoir
                  </Button>
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link href={exitHref}>Revenir au module</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ----- Canevas de travail ----- */}
        <section aria-label="Espace de travail" className="relative min-h-0 overflow-hidden bg-muted/20">
          <div className="ambient" data-state={state} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <div className="relative flex h-full items-center justify-center p-8 xl:p-12">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={screen}
                initial={reduce ? false : { opacity: 0, y: 14 * direction, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 * direction }}
                transition={{ duration: duration.lent, ease: ease.out }}
                className="max-h-full w-full max-w-3xl overflow-y-auto rounded-[1.75rem] bg-background/90 p-8 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.18)] ring-1 ring-foreground/5 backdrop-blur-xl xl:p-10"
              >
                {etape && p && (
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-muted-foreground">
                      {panneauLabel[p.type]} · {etape.titre}
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
                      <span
                        className={cn(
                          "size-2 rounded-full transition-colors duration-700",
                          state === "idle" && "bg-foreground/25",
                          state === "active" && "bg-primary",
                          state === "success" && "bg-success",
                          state === "warn" && "bg-warning",
                        )}
                        aria-hidden
                      />
                      {STATE_LABEL[state]}
                    </p>
                  </div>
                )}
                {screen === 0 && <WelcomeCard session={session} />}
                {screen === n + 1 && <FinishCard session={session} fileUrl={fileUrl} />}
                {p?.type === "quiz" && <QuizPanel p={p} ctx={ctx} />}
                {p?.type === "outil" && <OutilPanel p={p} ctx={ctx} />}
                {p?.type === "test" && <TestPanel p={p} ctx={ctx} />}
                {p?.type === "personnaliser" && <PersonnaliserPanel p={p} ctx={ctx} />}
                {p?.type === "fiche" && <FicheView p={p} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ----- Barre fine ----- */}
        <aside aria-label="Session" className="flex flex-col items-center gap-7 border-l py-8">
          <ProgressRing pct={pct} />
          <RailButton label="Mission" onClick={() => setMissionOpen(true)} dot={relances.length > 0}>
            <MailIcon className="size-[1.125rem]" aria-hidden />
          </RailButton>
          <RailButton label="Contexte" onClick={() => copyContext(session.mission.a_copier)}>
            <CopyIcon className="size-[1.125rem]" aria-hidden />
          </RailButton>
        </aside>
      </div>

      <Sheet open={missionOpen} onOpenChange={setMissionOpen}>
        <SheetContent side="right" className="w-[28rem] sm:max-w-md">
          <SheetHeader>
            <SheetTitle>La mission</SheetTitle>
            <SheetDescription>Le message de départ et les relances reçues.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 overflow-y-auto px-4 pb-6">
            {[...relances].reverse().map((r) => (
              <RelanceMessage key={r.etape} expediteur={r.expediteur} message={r.message} />
            ))}
            <MissionMessage session={session} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
