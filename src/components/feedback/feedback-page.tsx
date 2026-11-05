"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { AlertTriangleIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, ListChecksIcon, MessageSquareTextIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import { useAuth } from "@/lib/auth/session";
import { useProgress } from "@/lib/progress/store";
import { FREE_MESSAGE, FREE_TYPES, SCREENS, visibleAnswers, type Answer, type Answers } from "@/lib/feedback/questions";
import { sendFeedback } from "@/lib/feedback/actions";
import { AmbientHero, FloatCard, PageIntro, Soft } from "@/components/platform/kit";
import { QuestionField } from "./fields";

export interface FormationOption {
  id: string;
  slug: string;
  title: string;
}

type Mode = "libre" | "formulaire";

interface Draft {
  mode: Mode | null;
  formationId: string | null;
  screen: number;
  answers: Answers;
  free: { type?: string; message: string };
  /** Ordre tiré au hasard des options mélangées, gardé pour que la page ne bouge pas au rechargement. */
  orders: Record<string, string[]>;
}

const EMPTY: Draft = { mode: null, formationId: null, screen: 0, answers: {}, free: { message: "" }, orders: {} };
const draftKey = (userId: string) => `avis:brouillon:v1:${userId}`;

function readDraft(userId: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Draft) } : null;
  } catch {
    return null;
  }
}
function writeDraft(userId: string, d: Draft) {
  try {
    localStorage.setItem(draftKey(userId), JSON.stringify(d));
  } catch {
    // Navigation privée : le brouillon n'est simplement pas gardé.
  }
}
function clearDraft(userId: string) {
  try {
    localStorage.removeItem(draftKey(userId));
  } catch {}
}

function shuffled(options: readonly string[], keepLast: readonly string[]) {
  const head = options.filter((o) => !keepLast.includes(o));
  for (let i = head.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [head[i], head[j]] = [head[j], head[i]];
  }
  return [...head, ...keepLast];
}

function initialOrders(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const q of SCREENS.flatMap((s) => s.questions)) if (q.kind === "multi" && q.shuffle) out[q.id] = shuffled(q.options, q.shuffle.keepLast);
  return out;
}

export function FeedbackPage({ formations }: { formations: FormationOption[] }) {
  const auth = useAuth();
  // Page d'où vient l'apprenant (lien du menu), pour situer l'avis.
  const from = useSearchParams().get("depuis");
  const origin = from && /^\/[^\s]{0,299}$/.test(from) && !from.startsWith("//") ? from : null;
  if (auth.status === "loading") return <Skeleton className="h-96 w-full rounded-[2rem]" />;
  if (auth.status === "anon")
    return (
      <AmbientHero className="px-3 py-10 sm:px-10 sm:py-16">
        <FloatCard className="mx-auto w-full max-w-md space-y-4 p-7 sm:p-9">
          <h1 className="text-[1.75rem] leading-tight font-bold tracking-tight">Votre avis nous aide à nous améliorer</h1>
          <p className="text-body text-muted-foreground">Chaque avis est rattaché à votre compte, pour que nous puissions comprendre votre parcours. Connectez-vous pour le donner.</p>
          <Button asChild size="lg" className="w-full">
            <Link href="/connexion?next=/avis">Se connecter</Link>
          </Button>
        </FloatCard>
      </AmbientHero>
    );
  return <FeedbackForm key={auth.user.id} userId={auth.user.id} formations={formations} origin={origin} />;
}

function FeedbackForm({ userId, formations, origin }: { userId: string; formations: FormationOption[]; origin: string | null }) {
  const reduce = useReducedMotion();
  const progress = useProgress();
  // Ce formulaire n'est rendu que dans le navigateur (après la lecture de la session) :
  // le brouillon peut être lu dès le premier rendu.
  const [restored] = React.useState(() => readDraft(userId));
  const [d, setD] = React.useState<Draft>(() => (restored ? { ...restored, orders: { ...initialOrders(), ...restored.orders } } : { ...EMPTY, orders: initialOrders() }));
  const [sent, setSent] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const top = React.useRef<HTMLDivElement>(null);

  // Formations concernées : celles que l'apprenant a commencées (plus tard : achetées).
  const started = formations.filter((f) => Object.keys(progress).some((k) => k.startsWith(`${f.slug}/`)));
  const choices = started.length ? started : formations;
  const formationId = d.formationId && choices.some((f) => f.id === d.formationId) ? d.formationId : (choices[0]?.id ?? null);
  const formation = choices.find((f) => f.id === formationId);

  // Brouillon : enregistré à chaque changement ; signalé s'il a été repris.
  React.useEffect(() => {
    if (restored && (restored.mode === "formulaire" ? Object.keys(restored.answers).length > 0 : restored.free.message.trim())) toast("Votre brouillon a été repris.");
  }, [restored]);
  React.useEffect(() => {
    if (!sent) writeDraft(userId, d);
  }, [d, sent, userId]);

  const update = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const setAnswer = (id: string, v: Answer) => setD((x) => ({ ...x, answers: { ...x.answers, [id]: v } }));

  async function submit(payload: unknown) {
    setPending(true);
    setError(null);
    const r = await sendFeedback(payload);
    setPending(false);
    if (!r.ok) return setError(r.error);
    clearDraft(userId);
    setSent(true);
    top.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  if (sent)
    return (
      <AmbientHero className="px-3 py-10 sm:px-10 sm:py-16" state="success">
        <FloatCard className="mx-auto w-full max-w-lg space-y-4 p-7 text-center sm:p-9">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-success text-white">
            <CheckIcon className="size-6" strokeWidth={3} aria-hidden />
          </span>
          <h1 className="text-[1.5rem] leading-tight font-bold tracking-tight">Merci, votre avis est bien envoyé</h1>
          <p className="text-body text-muted-foreground">Nous lisons chaque avis. Il nous aide à choisir quoi améliorer en premier.</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button asChild>
              <Link href="/">Revenir à l&apos;accueil</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSent(false);
                setD({ ...EMPTY, orders: initialOrders() });
              }}
            >
              Donner un autre avis
            </Button>
          </div>
        </FloatCard>
      </AmbientHero>
    );

  const modes = [
    { mode: "libre" as const, icon: MessageSquareTextIcon, title: "Écrire un message libre", time: "1 minute", text: "Un problème, une erreur, une idée : en quelques mots." },
    { mode: "formulaire" as const, icon: ListChecksIcon, title: "Répondre au questionnaire", time: "4 à 5 minutes", text: "Six écrans courts. Seule la note finale est obligatoire." },
  ];

  return (
    <div ref={top} className="scroll-mt-24 space-y-8">
      <PageIntro eyebrow="Donner mon avis" title="Votre avis nous aide à nous améliorer">
        <p>Deux façons de nous le dire, au choix. Votre avis porte sur toute la plateforme et reste rattaché à votre compte.</p>
      </PageIntro>

      <p className="flex items-start gap-2.5 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium" role="note">
        <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        N&apos;écrivez aucune donnée réelle d&apos;un client ni d&apos;un cabinet.
      </p>

      {choices.length > 1 && (
        <fieldset className="space-y-2 px-1">
          <legend className="mb-2 text-sm font-medium text-muted-foreground">Votre avis porte sur la formation</legend>
          <div className="flex flex-wrap gap-2">
            {choices.map((f) => (
              <label
                key={f.id}
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                  f.id === formationId ? "border-foreground bg-foreground text-background" : "border-foreground/15 hover:border-foreground/35",
                )}
              >
                <input type="radio" name="formation" className="sr-only" checked={f.id === formationId} onChange={() => update({ formationId: f.id })} />
                {f.title}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Façon de donner votre avis">
        {modes.map((m) => {
          const on = d.mode === m.mode;
          return (
            <button
              key={m.mode}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                update({ mode: m.mode });
                setError(null);
              }}
              className={cn(
                "flex items-start gap-4 rounded-3xl p-6 text-left transition-colors",
                on ? "bg-accent/70 ring-2 ring-primary/40" : "bg-muted/50 hover:bg-muted",
              )}
            >
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl shadow-xs", on ? "bg-primary text-primary-foreground" : "bg-background text-primary")}>
                <m.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold">{m.title}</span>
                <span className="block text-sm font-medium text-primary">{m.time}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{m.text}</span>
              </span>
            </button>
          );
        })}
      </div>

      {d.mode === "libre" && (
        <FreeForm
          draft={d}
          update={update}
          pending={pending}
          error={error}
          onSubmit={() => submit({ mode: "libre", formation_id: formationId, type: d.free.type, message: d.free.message, page_origine: origin ?? undefined })}
        />
      )}
      {d.mode === "formulaire" && (
        <Questionnaire
          draft={d}
          update={update}
          setAnswer={setAnswer}
          formationTitle={formation?.title ?? "cette formation"}
          pending={pending}
          error={error}
          setError={setError}
          onSubmit={() => submit({ mode: "formulaire", formation_id: formationId, answers: clean(visibleAnswers(d.answers)), page_origine: origin ?? undefined })}
        />
      )}
    </div>
  );
}

/** Retire les réponses vides avant l'envoi. */
function clean(a: Answers): Answers {
  return Object.fromEntries(Object.entries(a).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)));
}

function FreeForm({ draft, update, pending, error, onSubmit }: { draft: Draft; update: (p: Partial<Draft>) => void; pending: boolean; error: string | null; onSubmit: () => void }) {
  const msg = draft.free.message;
  const len = msg.trim().length;
  const tooShort = len < FREE_MESSAGE.min;
  return (
    <Soft className="space-y-5 p-6 sm:p-8">
      <fieldset>
        <legend className="mb-3 text-sm font-medium text-muted-foreground">De quoi s&apos;agit-il ? (facultatif)</legend>
        <div className="flex flex-wrap gap-2">
          {FREE_TYPES.map((t) => {
            const on = draft.free.type === t.value;
            return (
              <label
                key={t.value}
                className={cn(
                  "inline-flex cursor-pointer items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
                  on ? "border-foreground bg-foreground text-background" : "border-foreground/15 bg-background hover:border-foreground/35",
                )}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => update({ free: { ...draft.free, type: on ? undefined : t.value } })} />
                {t.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div>
        <label htmlFor="message" className="mb-2 block text-[1.0625rem] font-medium">
          Votre message
        </label>
        <Textarea
          id="message"
          value={msg}
          maxLength={FREE_MESSAGE.max}
          rows={7}
          onChange={(e) => update({ free: { ...draft.free, message: e.target.value } })}
          placeholder="Ce qui vous a plu, ce qui vous a gêné, ce que vous changeriez…"
          className="rounded-2xl border-transparent bg-background"
        />
        <div className="mt-1.5 flex justify-between text-caption text-muted-foreground tabular-nums">
          <span>{tooShort ? `${FREE_MESSAGE.min} caractères au minimum` : " "}</span>
          <span aria-live="polite">
            {msg.length} / {FREE_MESSAGE.max}
          </span>
        </div>
      </div>
      {error && (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button size="lg" disabled={tooShort || pending} onClick={onSubmit}>
        {pending ? "Envoi…" : "Envoyer mon avis"}
      </Button>
    </Soft>
  );
}

function Questionnaire({
  draft,
  update,
  setAnswer,
  formationTitle,
  pending,
  error,
  setError,
  onSubmit,
}: {
  draft: Draft;
  update: (p: Partial<Draft>) => void;
  setAnswer: (id: string, v: Answer) => void;
  formationTitle: string;
  pending: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  onSubmit: () => void;
}) {
  const reduce = useReducedMotion();
  const box = React.useRef<HTMLDivElement>(null);
  const i = Math.min(draft.screen, SCREENS.length - 1);
  const screen = SCREENS[i];
  const last = i === SCREENS.length - 1;
  const a = draft.answers;
  const shown = screen.questions.filter((q) => !q.showIf || q.showIf(a));

  function missing() {
    const q = shown.find((x) => (x.kind === "text" && x.required && !(typeof a[x.id] === "string" && (a[x.id] as string).trim())) || (x.kind === "reco" && typeof a[x.id] !== "number"));
    return q ? (q.kind === "reco" ? "Donnez une note de 0 à 10 pour envoyer votre avis." : `« ${q.label} » : à préciser avant de continuer.`) : null;
  }

  function go(to: number) {
    update({ screen: to });
    setError(null);
    box.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div ref={box} className="scroll-mt-24">
      <Soft className="p-6 sm:p-8">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground tabular-nums">
              Écran {i + 1} sur {SCREENS.length}
            </p>
            <p className="text-caption text-muted-foreground">Brouillon gardé sur cet appareil</p>
          </div>
          <div role="progressbar" aria-label="Avancement du questionnaire" aria-valuemin={1} aria-valuemax={SCREENS.length} aria-valuenow={i + 1} className="h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]">
            <motion.div className="h-full rounded-full bg-primary" initial={false} animate={{ width: `${((i + 1) / SCREENS.length) * 100}%` }} transition={{ duration: duration.standard, ease: ease.out }} />
          </div>
        </div>

        <motion.div key={i} initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.standard, ease: ease.out }} className="mt-7 space-y-8">
          <div>
            <h2 className="text-[1.5rem] leading-tight font-bold tracking-tight">{screen.title}</h2>
            {screen.intro && <p className="mt-1.5 text-body text-muted-foreground">{screen.intro}</p>}
          </div>
          {shown.map((q) => (
            <QuestionField key={q.id} q={q} value={a[q.id]} onChange={(v) => setAnswer(q.id, v)} answers={a} setAnswer={setAnswer} order={draft.orders[q.id]} formation={formationTitle} />
          ))}
        </motion.div>

        {error && (
          <p className="mt-6 text-sm font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="mt-8 flex items-center justify-between gap-3">
          {i > 0 ? (
            <Button variant="ghost" onClick={() => go(i - 1)}>
              <ArrowLeftIcon /> Retour
            </Button>
          ) : (
            <span />
          )}
          {last ? (
            <Button
              size="lg"
              disabled={pending}
              onClick={() => {
                const m = missing();
                if (m) return setError(m);
                onSubmit();
              }}
            >
              {pending ? "Envoi…" : "Envoyer mon avis"}
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => {
                const m = missing();
                if (m) return setError(m);
                go(i + 1);
              }}
            >
              Continuer <ArrowRightIcon />
            </Button>
          )}
        </div>
      </Soft>
    </div>
  );
}
