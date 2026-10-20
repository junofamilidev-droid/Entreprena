"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClipboardPasteIcon,
  CopyIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  PlayIcon,
  SquareIcon,
  TimerIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DrawCheck } from "@/components/motion/draw-check";
import { CountUp } from "@/components/motion/count-up";
import { aiLabel, type AiChoice } from "@/lib/sessions/ai-tool";
import { formatSeconds } from "@/lib/sessions/progress";
import { scoreAnswers } from "@/lib/sessions/score";
import { recordDownload, useDownloads } from "@/lib/sessions/downloads";
import type {
  CollageBlock,
  ControleBlock,
  DefiBlock,
  FicheBlock,
  GainBlock,
  MissionBlock,
  OutilBlock,
  PromptBlock,
  RepereErreurBlock,
  Session,
  SessionBlock,
  TexteBlock,
} from "@/lib/sessions/types";
import type { ExerciseInputs, ExerciseValue } from "@/lib/content/types";
import { Input } from "@/components/ui/input";
import { duration, ease } from "@/lib/motion";

export interface BlockCtx {
  /** Position du bloc dans la session (préfixe de ses saisies). */
  index: number;
  session: Session;
  inputs: ExerciseInputs;
  set: (id: string, value: ExerciseValue) => void;
  /** Plusieurs saisies d'un coup (une seule écriture). */
  setMany: (values: ExerciseInputs) => void;
  aiTool: AiChoice | null | undefined;
  fileUrl: (name: string) => string;
  savedTotalSec: number;
}

// Titre d'un bloc : assez grand pour guider l'œil, sans écraser la consigne.
const TITLE = "text-2xl font-bold leading-tight tracking-tight text-balance sm:text-[1.75rem]";

const str = (v: ExerciseValue | undefined) => (typeof v === "string" ? v : "");
const rec = (v: ExerciseValue | undefined) => (v && !Array.isArray(v) && typeof v === "object" ? v : {});

/** Un bloc peut-il être quitté ? Sinon, la raison affichée près du bouton Suivant. */
export function blockGate(block: SessionBlock, ctx: Pick<BlockCtx, "index" | "inputs">): string | null {
  const k = `b${ctx.index}`;
  if (block.type === "defi" && !str(ctx.inputs[`${k}:sec`]) && !str(ctx.inputs[`${k}:passe`]))
    return "Lancez le chronomètre et faites le défi, ou passez-le.";
  if (block.type === "controle") {
    const checks = rec(ctx.inputs[`${k}:coches`]);
    if (block.items.some((_, i) => checks[i] !== "1")) return "Cochez chaque vérification pour continuer.";
  }
  if (block.type === "repere-erreur" && !str(ctx.inputs[`${k}:trouve`]) && !str(ctx.inputs[`${k}:solution`]))
    return "Cliquez sur la ligne qui contient l'erreur.";
  return null;
}

/* ---------------- Mission ---------------- */

function initials(name: string) {
  return name
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function Mission({ b }: { b: MissionBlock }) {
  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-primary">Nouveau message</p>
      <article className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <header className="flex items-start gap-3 border-b px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {initials(b.expediteur)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{b.expediteur}</p>
            <p className="text-sm text-muted-foreground">À : vous</p>
          </div>
          <span className="shrink-0 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-foreground">
            Pour {b.echeance}
          </span>
        </header>
        <div className="space-y-3 px-5 py-5">
          <h1 className="text-heading text-balance">{b.objet}</h1>
          <p className="text-body whitespace-pre-line">{b.message}</p>
        </div>
        <footer className="border-t bg-muted/40 px-5 py-3 text-sm">
          <span className="font-medium">Livrable attendu : </span>
          <span className="text-muted-foreground">{b.livrable}</span>
        </footer>
      </article>
    </div>
  );
}

/* ---------------- Défi ---------------- */

/** Heure courante, rafraîchie quatre fois par seconde tant que `active` ; 0 avant le premier tic. */
export function useNow(active: boolean) {
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

function Clock({ sec, target }: { sec: number; target: number }) {
  const over = sec > target * 60;
  const m = Math.floor(sec / 60);
  return (
    <span className={cn("font-mono text-4xl font-semibold tabular-nums tracking-tight", over && "text-warning")}>
      {String(m).padStart(2, "0")}:{String(Math.floor(sec % 60)).padStart(2, "0")}
    </span>
  );
}

function Defi({ b, ctx }: { b: DefiBlock; ctx: BlockCtx }) {
  const k = `b${ctx.index}`;
  const start = Number(str(ctx.inputs[`${k}:debut`])) || 0;
  const stopped = str(ctx.inputs[`${k}:sec`]);
  const running = start > 0 && !stopped;
  const now = useNow(running);
  const sec = stopped ? Number(stopped) : running ? Math.max(0, ((now || start) - start) / 1000) : 0;

  function stop() {
    ctx.set(`${k}:sec`, String(Math.round((Date.now() - start) / 1000)));
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Défi · faites-le d&apos;abord à votre façon</p>
        <h1 className={TITLE}>{b.consigne}</h1>
      </div>
      <a
        href={ctx.fileUrl(b.donnees)}
        download
        className="group flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
      >
        <FileSpreadsheetIcon className="size-5 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{b.donnees}</span>
          <span className="block text-caption text-muted-foreground">Données fictives</span>
        </span>
        <DownloadIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-y-0.5" aria-hidden />
      </a>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-xl border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          <TimerIcon className="size-5 text-muted-foreground" aria-hidden />
          <Clock sec={sec} target={b.temps_cible_min} />
        </div>
        <p className="text-sm text-muted-foreground">Temps cible : {b.temps_cible_min} min</p>
        <div className="ml-auto">
          {!start && !stopped ? (
            <Button size="lg" onClick={() => ctx.set(`${k}:debut`, String(Date.now()))}>
              <PlayIcon /> Lancer le chrono
            </Button>
          ) : running ? (
            <Button size="lg" variant="outline" onClick={stop}>
              <SquareIcon /> J&apos;ai terminé
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckIcon className="size-4" aria-hidden /> Défi chronométré
            </span>
          )}
        </div>
      </div>

      {start > 0 && (
        <div className="-mt-3 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className={cn("h-full rounded-full transition-[width] duration-300 ease-linear", sec > b.temps_cible_min * 60 ? "bg-warning" : "bg-primary")}
            style={{ width: `${Math.min(100, (sec / (b.temps_cible_min * 60)) * 100)}%` }}
          />
        </div>
      )}
      {stopped && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.standard, ease: ease.out }}
          className="text-sm text-muted-foreground"
        >
          {sec <= b.temps_cible_min * 60
            ? `${formatSeconds(sec)} : dans le temps cible. Voyons si la méthode fait mieux.`
            : `${formatSeconds(sec)} : au-delà des ${b.temps_cible_min} min visées. C'est le temps que la méthode va vous faire gagner.`}
        </motion.p>
      )}
      <div className="space-y-2">
        <label htmlFor={`${k}-reponse`} className="text-sm font-medium">
          Votre réponse <span className="font-normal text-muted-foreground">· un élément par ligne</span>
        </label>
        <Textarea
          id={`${k}-reponse`}
          rows={5}
          value={str(ctx.inputs[`${k}:reponse`])}
          onChange={(e) => ctx.set(`${k}:reponse`, e.target.value)}
          placeholder={"Par exemple :\n411000 Clients\n408100 Factures non parvenues"}
          className="bg-card"
        />
      </div>

      {b.criteres.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">C&apos;est réussi si :</p>
          <ul className="space-y-1.5 text-body text-muted-foreground">
            {b.criteres.map((c) => (
              <li key={c} className="flex gap-2">
                <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!start && !stopped && (
        <button
          type="button"
          onClick={() => ctx.set(`${k}:passe`, "1")}
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {str(ctx.inputs[`${k}:passe`]) ? "Défi passé : le temps gagné ne sera pas mesuré." : "Passer le défi"}
        </button>
      )}
    </div>
  );
}

/* ---------------- Prompt ---------------- */

const FIELD = /(\[[^\]\n]+\])/g;

/** Champs que l'apprenant remplit sur la page ; « [Collez …] » reste à compléter dans son outil d'IA. */
function promptFields(text: string) {
  const names = [...text.matchAll(FIELD)].map((m) => m[1].slice(1, -1));
  return [...new Set(names)].filter((n) => !/^coll/i.test(n));
}

function fillPrompt(text: string, values: Record<string, string>) {
  return text.replace(FIELD, (m) => values[m.slice(1, -1)]?.trim() || m);
}

/** Met en valeur les champs : à remplir (jaune) ou remplis (couleur de marque). */
function withFields(text: string, values: Record<string, string>) {
  return text.split(FIELD).map((part, i) => {
    if (!/^\[.*\]$/.test(part)) return <React.Fragment key={i}>{part}</React.Fragment>;
    const v = values[part.slice(1, -1)]?.trim();
    return v ? (
      <mark key={i} className="rounded bg-accent px-0.5 font-semibold text-accent-foreground">
        {v}
      </mark>
    ) : (
      <mark key={i} className="rounded bg-warning/25 px-0.5 text-foreground">
        {part}
      </mark>
    );
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
    }
  }
  return (
    <Button size="sm" onClick={copy}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? "ok" : "copy"}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-1.5"
        >
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copié" : "Copier"}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}

function ToolNote({ ctx }: { ctx: BlockCtx }) {
  const tool = ctx.aiTool;
  if (!tool) return null;
  const note = tool !== "autre" ? ctx.session.consignes_outils_ia[tool] : undefined;
  return (
    <div className="rounded-lg border-l-2 border-primary bg-accent/50 px-4 py-3 text-sm">
      <p className="font-medium">Dans {aiLabel(tool)}</p>
      <p className="mt-1 text-muted-foreground">
        {note || "Collez le prompt dans l'outil d'IA autorisé par votre employeur : il est écrit pour fonctionner partout."}
      </p>
    </div>
  );
}

function Prompt({ b, ctx }: { b: PromptBlock; ctx: BlockCtx }) {
  const k = `b${ctx.index}`;
  const values = rec(ctx.inputs[`${k}:champs`]);
  const fields = promptFields(b.texte);
  const filled = fillPrompt(b.texte, values);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Méthode</p>
        <h1 className={TITLE}>{b.usage}</h1>
      </div>
      <figure className="overflow-hidden rounded-xl border bg-card">
        <figcaption className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <span className="text-sm font-medium">Prompt à copier</span>
          <CopyButton text={filled} />
        </figcaption>
        {fields.length > 0 && (
          <div className="grid gap-3 border-b bg-muted/30 px-4 py-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f} className="space-y-1">
                <label htmlFor={`${k}-${f}`} className="text-caption font-medium text-muted-foreground">
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </label>
                <Input
                  id={`${k}-${f}`}
                  value={values[f] ?? ""}
                  onChange={(e) => ctx.set(`${k}:champs`, { ...values, [f]: e.target.value })}
                  className="h-9 bg-card"
                />
              </div>
            ))}
          </div>
        )}
        <pre className="max-h-72 overflow-auto px-4 py-4 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap">
          {withFields(b.texte, values)}
        </pre>
      </figure>
      <p className="text-caption text-muted-foreground">
        {fields.length > 0
          ? "Remplissez les champs : le prompt se complète, et le bouton Copier prend votre version."
          : "Remplacez les passages surlignés entre crochets avant d'envoyer."}
      </p>
      <ToolNote ctx={ctx} />
      <div className="space-y-1.5">
        <p className="text-sm font-medium">Ce que vous devez obtenir</p>
        <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-body whitespace-pre-line text-muted-foreground">
          {b.resultat_attendu}
        </p>
      </div>
    </div>
  );
}

/* ---------------- Collage ---------------- */

function Checklist({
  items,
  checks,
  onToggle,
  idPrefix,
}: {
  items: string[];
  checks: Record<string, string>;
  onToggle: (i: number, v: boolean) => void;
  idPrefix: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, i) => {
        const on = checks[i] === "1";
        return (
          <li key={item}>
            <label
              htmlFor={`${idPrefix}-${i}`}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border bg-card px-4 py-3 text-body transition-colors hover:bg-muted/60",
                on && "border-primary/40 bg-accent/40",
              )}
            >
              <Checkbox id={`${idPrefix}-${i}`} checked={on} onCheckedChange={(v) => onToggle(i, v === true)} className="mt-0.5" />
              <span className={cn("flex-1", on && "text-muted-foreground")}>{item}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Collage({ b, ctx }: { b: CollageBlock; ctx: BlockCtx }) {
  const k = `b${ctx.index}`;
  const checks = rec(ctx.inputs[`${k}:coches`]);
  // Résultat attendu du dernier prompt : affiché à côté de la réponse collée, pour comparer.
  const expected = [...ctx.session.blocs.slice(0, ctx.index)].reverse().find((x): x is PromptBlock => x.type === "prompt")
    ?.resultat_attendu;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Réponse de votre IA</p>
        <h1 className={TITLE}>{b.consigne}</h1>
      </div>
      <div className={cn("grid gap-4", expected && "md:grid-cols-[3fr_2fr]")}>
      <div className="relative">
        <ClipboardPasteIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
        <Textarea
          rows={8}
          aria-label="Réponse de votre IA"
          value={str(ctx.inputs[`${k}:texte`])}
          onChange={(e) => ctx.set(`${k}:texte`, e.target.value)}
          placeholder="Collez ici la réponse de votre IA"
          className="h-full bg-card pl-9 font-mono text-[0.8125rem]"
        />
      </div>
      {expected && (
        <aside className="rounded-lg border border-dashed bg-muted/30 px-4 py-3">
          <p className="text-caption font-medium text-muted-foreground">À comparer avec le résultat attendu</p>
          <p className="mt-1.5 text-sm whitespace-pre-line text-muted-foreground">{expected}</p>
        </aside>
      )}
      </div>
      {b.a_verifier.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">À vérifier dans la réponse</p>
          <Checklist
            items={b.a_verifier}
            checks={checks}
            idPrefix={k}
            onToggle={(i, v) => ctx.set(`${k}:coches`, { ...checks, [i]: v ? "1" : "0" })}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- Contrôle ---------------- */

function Controle({ b, ctx }: { b: ControleBlock; ctx: BlockCtx }) {
  const k = `b${ctx.index}`;
  const checks = rec(ctx.inputs[`${k}:coches`]);
  const done = b.items.filter((_, i) => checks[i] === "1").length;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Contrôle</p>
        <h1 className={TITLE}>Avant d&apos;aller plus loin, vérifiez</h1>
        <p className="text-sm text-muted-foreground tabular-nums">
          {done} sur {b.items.length} vérifié{done > 1 ? "s" : ""}
        </p>
      </div>
      <Checklist
        items={b.items}
        checks={checks}
        idPrefix={k}
        onToggle={(i, v) => ctx.set(`${k}:coches`, { ...checks, [i]: v ? "1" : "0" })}
      />
    </div>
  );
}

/* ---------------- Repérez l'erreur ---------------- */

function RepereErreur({ b, ctx }: { b: RepereErreurBlock; ctx: BlockCtx }) {
  const k = `b${ctx.index}`;
  const found = str(ctx.inputs[`${k}:trouve`]) === "1";
  const tries = Number(str(ctx.inputs[`${k}:essais`]) || 0);
  const [wrong, setWrong] = React.useState<number | null>(null);
  const reveal = found || str(ctx.inputs[`${k}:solution`]) === "1";
  const faulty = b.ligne_fautive - 1;

  function pick(i: number) {
    if (reveal) return;
    if (i === faulty) ctx.set(`${k}:trouve`, "1");
    else {
      setWrong(i);
      ctx.set(`${k}:essais`, String(tries + 1));
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Repérez l&apos;erreur</p>
        <h1 className={TITLE}>Une IA a produit ces lignes. L&apos;une d&apos;elles est fausse : laquelle ?</h1>
      </div>
      <ol className="overflow-hidden rounded-xl border bg-card font-mono text-[0.8125rem]">
        {b.lignes.map((line, i) => {
          const isFaulty = reveal && i === faulty;
          const isWrong = !reveal && wrong === i;
          return (
            <motion.li
              key={i}
              animate={isWrong ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className="border-b last:border-b-0"
            >
              <button
                type="button"
                onClick={() => pick(i)}
                disabled={reveal}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left leading-relaxed transition-colors enabled:hover:bg-muted/60",
                  isFaulty && "bg-destructive/10",
                  isWrong && "bg-muted",
                )}
              >
                <span className="w-5 shrink-0 text-muted-foreground tabular-nums">{i + 1}</span>
                <span className="flex-1">{line}</span>
                {isFaulty && <XIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-label="ligne fautive" />}
              </button>
            </motion.li>
          );
        })}
      </ol>
      {!reveal && tries > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <p className="text-muted-foreground">
            {wrong !== null ? `La ligne ${wrong + 1} est juste.` : ""} Regardez les calculs, pas seulement les libellés.
          </p>
          <button type="button" onClick={() => ctx.set(`${k}:solution`, "1")} className="font-medium text-primary underline-offset-4 hover:underline">
            Voir la solution
          </button>
        </div>
      )}
      {reveal && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border-l-2 border-primary bg-muted/50 px-4 py-3 text-body"
        >
          <p className="flex items-center gap-2 font-medium">
            {found ? (
              <>
                <DrawCheck className="size-5 text-success" /> Bien vu : ligne {b.ligne_fautive}.
              </>
            ) : (
              <>L&apos;erreur était à la ligne {b.ligne_fautive}.</>
            )}
          </p>
          <p className="mt-1 text-muted-foreground">{b.explication}</p>
        </motion.div>
      )}
    </div>
  );
}

/* ---------------- Outil ---------------- */

function Outil({ b, ctx }: { b: OutilBlock; ctx: BlockCtx }) {
  const downloads = useDownloads();
  const source = `Session ${ctx.session.session} : ${ctx.session.titre}`;
  const steps = b.mode_emploi.split("\n").map((s) => s.trim()).filter(Boolean);
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Votre outil</p>
        <h1 className={TITLE}>{b.description}</h1>
      </div>
      <a
        href={ctx.fileUrl(b.fichier)}
        download
        onClick={() => recordDownload({ name: b.fichier, href: ctx.fileUrl(b.fichier), source }, downloads)}
        className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <FileSpreadsheetIcon className="size-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{b.fichier}</span>
          <span className="block text-sm text-muted-foreground">À télécharger et à adapter à vos dossiers</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <DownloadIcon className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden /> Télécharger
        </span>
      </a>
      {b.champs_a_adapter.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Champs à adapter</p>
          <ul className="flex flex-wrap gap-2">
            {b.champs_a_adapter.map((c) => (
              <li key={c} className="rounded-md border bg-warning/15 px-2.5 py-1 text-sm">
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="space-y-2">
        <p className="text-sm font-medium">Mode d&apos;emploi</p>
        <ol className="space-y-2 text-body">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{s.replace(/^\d+[.)]\s*/, "")}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ---------------- Gain ---------------- */

const NONE: string[] = [];

/** Où commence et s'arrête le chrono « avec la méthode » dans une session. */
export function methodSpan(blocs: SessionBlock[]) {
  const outil = blocs.findIndex((b) => b.type === "outil");
  const controle = outil === -1 ? -1 : blocs.findIndex((b, i) => i > outil && b.type === "controle");
  return { outil, controle };
}

function AnswersCompare({ expected, text }: { expected: string[]; text: string }) {
  const score = scoreAnswers(text, expected);
  return (
    <section aria-labelledby="reponses" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="reponses" className="font-semibold">
          Vos réponses au défi
        </h2>
        <p className="text-sm font-medium tabular-nums">
          {score.count} sur {score.total} trouvée{score.count > 1 ? "s" : ""}
        </p>
      </div>
      <ul className="space-y-1.5">
        {expected.map((e, i) => (
          <motion.li
            key={e}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: duration.standard, ease: ease.out, delay: 0.9 + i * 0.05 }}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
              score.found[i] ? "border-success/40 bg-success/10" : "border-warning/50 bg-warning/10",
            )}
          >
            {score.found[i] ? (
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-label="trouvée" />
            ) : (
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-label="manquée" />
            )}
            <span className="flex-1">{e}</span>
            <span className="shrink-0 text-caption text-muted-foreground">{score.found[i] ? "Trouvée" : "Manquée"}</span>
          </motion.li>
        ))}
      </ul>
      {score.extra.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Vous aviez aussi noté : {score.extra.join(" ; ")}. À garder si vous pouvez le justifier.
        </p>
      )}
      {!text.trim() && <p className="text-sm text-muted-foreground">Vous n&apos;aviez rien noté pendant le défi.</p>}
    </section>
  );
}

/**
 * Temps du défi et temps avec la méthode (de l'ouverture de l'outil à la validation du contrôle
 * qui suit), figés à l'arrivée sur le bloc ; puis les réponses comparées aux réponses attendues.
 */
function Gain({ b, ctx, active }: { b: GainBlock; ctx: BlockCtx; active: boolean }) {
  const blocs = ctx.session.blocs;
  const defiIndex = blocs.findIndex((x) => x.type === "defi");
  const defi = defiIndex === -1 ? null : (blocs[defiIndex] as DefiBlock);
  const defiSec = Number(str(ctx.inputs[`b${defiIndex}:sec`])) || 0;
  const answer = str(ctx.inputs[`b${defiIndex}:reponse`]);
  const expected = defi?.reponses_attendues ?? NONE;
  const methodStart = Number(str(ctx.inputs["methode:debut"])) || 0;
  const methodEnd = Number(str(ctx.inputs["methode:fin"])) || 0;
  const recorded = str(ctx.inputs["gain:methode_sec"]);
  const { setMany } = ctx;

  React.useEffect(() => {
    if (!active || recorded) return;
    const score = expected.length ? scoreAnswers(answer, expected) : null;
    const scoreValues: ExerciseInputs = score ? { "score:trouvees": String(score.count), "score:total": String(score.total) } : {};
    if (!methodStart) return void setMany({ "gain:methode_sec": "non-mesure", ...scoreValues });
    const methodSec = Math.round(((methodEnd || Date.now()) - methodStart) / 1000);
    // Au-delà d'une heure, l'apprenant a fait une pause : la mesure n'a plus de sens.
    if (methodSec > 3600) return void setMany({ "gain:methode_sec": "pause", ...scoreValues });
    setMany({
      "gain:methode_sec": String(methodSec),
      ...(defiSec ? ({ gain_sec: String(Math.max(0, defiSec - methodSec)) } as ExerciseInputs) : {}),
      ...scoreValues,
    });
  }, [active, recorded, defiSec, methodStart, methodEnd, answer, expected, setMany]);

  const methodSec = Number(recorded) || 0;
  const measured = defiSec > 0 && methodSec > 0;
  const saved = Math.max(0, defiSec - methodSec);
  const pct = defiSec ? Math.round((saved / defiSec) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Temps gagné</p>
        <h1 className={TITLE}>{b.tache}</h1>
      </div>

      {measured ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Défi, à votre façon", sec: defiSec, bar: "bg-muted-foreground/40" },
              { label: "Avec la méthode", sec: methodSec, bar: "bg-primary" },
            ].map((row, i) => (
              <div key={row.label} className="rounded-xl border bg-card p-4">
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl">
                  {String(Math.floor(row.sec / 60)).padStart(2, "0")}:{String(row.sec % 60).padStart(2, "0")}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className={cn("h-full rounded-full", row.bar)}
                    initial={{ width: 0 }}
                    animate={{ width: `${(row.sec / Math.max(defiSec, methodSec)) * 100}%` }}
                    transition={{ duration: duration.recompense, ease: ease.out, delay: 0.15 + i * 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm text-muted-foreground">Gagné sur cette tâche</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-primary">
                <CountUp value={saved} format={formatSeconds} duration={duration.recompense} />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {pct > 0 ? `soit ${pct} % de temps en moins` : "Pas de gain au premier essai : la méthode se rentabilise à la suivante."}
              </p>
            </div>
            <div className="rounded-xl border bg-primary p-5 text-primary-foreground">
              <p className="text-sm opacity-85">Temps gagné depuis le début</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                <CountUp value={ctx.savedTotalSec} format={formatSeconds} />
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-body text-muted-foreground">
          {recorded === "pause"
            ? "La session a été interrompue trop longtemps : le temps avec la méthode n'a pas pu être mesuré."
            : !defiSec
              ? "Le défi n'a pas été chronométré : le temps gagné n'est pas mesuré pour cette session."
              : "Le temps avec la méthode n'a pas pu être mesuré pour cette session."}
        </p>
      )}

      {expected.length > 0 && <AnswersCompare expected={expected} text={answer} />}
    </div>
  );
}

/* ---------------- Fiche et texte ---------------- */

function Fiche({ b }: { b: FicheBlock }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-primary">Fiche juste-à-temps</p>
        <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
          Rangée dans Ma boîte à outils
        </span>
      </div>
      <article className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-heading">{b.titre}</h1>
        <ol className="mt-4 space-y-2.5 text-body">
          {b.etapes.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        {b.pieges.length > 0 && (
          <div className="mt-6 rounded-lg bg-warning/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangleIcon className="size-4 text-warning" aria-hidden /> Pièges
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {b.pieges.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}

function Texte({ b }: { b: TexteBlock }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">À savoir</p>
      <p className="text-2xl leading-snug font-medium text-balance whitespace-pre-line">{b.contenu}</p>
    </div>
  );
}

export function BlockView({ block, ctx, active }: { block: SessionBlock; ctx: BlockCtx; active: boolean }) {
  switch (block.type) {
    case "mission":
      return <Mission b={block} />;
    case "defi":
      return <Defi b={block} ctx={ctx} />;
    case "prompt":
      return <Prompt b={block} ctx={ctx} />;
    case "collage":
      return <Collage b={block} ctx={ctx} />;
    case "controle":
      return <Controle b={block} ctx={ctx} />;
    case "repere-erreur":
      return <RepereErreur b={block} ctx={ctx} />;
    case "outil":
      return <Outil b={block} ctx={ctx} />;
    case "gain":
      return <Gain b={block} ctx={ctx} active={active} />;
    case "fiche":
      return <Fiche b={block} />;
    case "texte":
      return <Texte b={block} />;
  }
}
