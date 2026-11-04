"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  AlertTriangleIcon,
  CheckIcon,
  CircleCheckIcon,
  CircleDotIcon,
  CopyIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileSpreadsheetIcon,
  MousePointerClickIcon,
  PackageOpenIcon,
  PlayIcon,
  SettingsIcon,
  ToggleRightIcon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";
import {
  checkVerification,
  type FichePanneau,
  type OutilPanneau,
  type PersonnaliserPanneau,
  type QuizPanneau,
  type TestPanneau,
} from "@/lib/sessions/atelier";
import type { ExerciseInputs, ExerciseValue } from "@/lib/content/types";

export type OrbState = "idle" | "active" | "success" | "warn";

/** Événement du fil du tuteur : une aide ouverte, une réponse au quiz, une règle, une vérification. */
export type FilEvent = { t: "aide" | "quiz" | "regle" | "verif"; r: string };

export interface PanelCtx {
  index: number;
  inputs: ExerciseInputs;
  set: (id: string, value: ExerciseValue) => void;
  setMany: (values: ExerciseInputs) => void;
  /** Ajoute un message au fil du tuteur de l'étape. */
  push: (e: FilEvent, extra?: ExerciseInputs) => void;
  fileUrl: (name: string) => string;
  /** Prénom du tuteur, pour les renvois « … vous explique à gauche ». */
  tuteur: string;
}

export const str = (v: ExerciseValue | undefined) => (typeof v === "string" ? v : "");
export const rec = (v: ExerciseValue | undefined) => (v && !Array.isArray(v) && typeof v === "object" ? v : {});

/** État de l'orbe pour l'étape, déduit de ce que l'apprenant a fait. */
export function panelOrbState(type: string, i: number, inputs: ExerciseInputs, nVerif = 0, nItems = 0, bonne = -1): OrbState {
  const k = `e${i}`;
  if (type === "quiz") {
    const c = str(inputs[`${k}:choix`]);
    return c === "" ? "idle" : Number(c) === bonne ? "success" : "warn";
  }
  if (type === "outil") return str(inputs[`${k}:installe`]) === "1" ? "success" : str(inputs[`${k}:regle`]) ? "active" : "idle";
  if (type === "test") {
    const text = str(inputs[`${k}:reponse`]);
    const checked = str(inputs[`${k}:verifie`]);
    if (!text.trim()) return "idle";
    if (checked !== text) return "active";
    const res = str(inputs[`${k}:resultat`]);
    return res.length === nVerif && !res.includes("0") ? "success" : "warn";
  }
  if (type === "personnaliser") {
    const c = Object.values(rec(inputs[`${k}:coches`])).filter((v) => v === "1").length;
    return c === 0 ? "idle" : c >= nItems ? "success" : "active";
  }
  return "success";
}

export function DownloadCard({ name, href, label, icon = "file" }: { name: string; href: string; label: string; icon?: "zip" | "file" }) {
  const Icon = icon === "zip" ? FileArchiveIcon : FileSpreadsheetIcon;
  return (
    <a href={href} download className="group flex items-center gap-4 rounded-2xl bg-muted/60 px-4 py-3.5 transition-colors hover:bg-muted">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-background text-primary shadow-xs">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{name}</span>
        <span className="block text-sm text-muted-foreground">{label}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        <DownloadIcon className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden /> Télécharger
      </span>
    </a>
  );
}

function Section({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-3", className)}>
      {title && <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}

/* ---------------- Quiz ---------------- */

export function QuizPanel({ p, ctx }: { p: QuizPanneau; ctx: PanelCtx }) {
  const k = `e${ctx.index}`;
  const chosen = str(ctx.inputs[`${k}:choix`]);
  const answered = chosen !== "";
  // Raccourcis : 1, 2, 3… choisissent une réponse.
  const choose = React.useEffectEvent((i: number) => ctx.push({ t: "quiz", r: String(i) }, { [`${k}:choix`]: String(i) }));
  React.useEffect(() => {
    if (answered) return;
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= p.choix.length) choose(n - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, p.choix.length]);
  return (
    <div className="space-y-5">
      <p className="text-xl leading-snug font-semibold text-balance">{p.question}</p>
      <ul className="space-y-2.5">
        {p.choix.map((c, i) => {
          const isRight = i === p.bonne;
          const isChosen = chosen === String(i);
          return (
            <li key={i}>
              <motion.button
                type="button"
                disabled={answered}
                onClick={() => ctx.push({ t: "quiz", r: String(i) }, { [`${k}:choix`]: String(i) })}
                animate={answered && isChosen && !isRight ? { x: [0, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-transparent bg-muted/60 px-4 py-3.5 text-left text-body transition-colors",
                  !answered && "hover:bg-accent",
                  answered && isRight && "border-success/50 bg-success/10",
                  answered && isChosen && !isRight && "border-warning/60 bg-warning/10",
                  answered && !isChosen && !isRight && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-background text-xs font-semibold text-muted-foreground shadow-xs",
                    answered && isRight && "border-success bg-success text-white",
                    answered && isChosen && !isRight && "border-warning bg-warning text-white",
                  )}
                >
                  {answered && isRight ? <CheckIcon className="size-3.5" strokeWidth={3} /> : answered && isChosen ? <XIcon className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>
                <span className="flex-1">{c}</span>
              </motion.button>
            </li>
          );
        })}
      </ul>
      {answered ? (
        <p className="text-sm text-muted-foreground">
          {chosen === String(p.bonne) ? "Bonne réponse." : "La bonne réponse est en vert."} {ctx.tuteur} vous explique à gauche.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">Cliquez sur une réponse, ou tapez son numéro.</p>
      )}
    </div>
  );
}

/* ---------------- Outil ---------------- */

/** Icône d'une étape d'installation, devinée d'après son titre. */
function installIcon(title: string) {
  const t = title.toLowerCase();
  if (/t[ée]l[ée]charg/.test(t)) return DownloadIcon;
  if (/r[ée]glage|param|ouvrir|settings/.test(t)) return SettingsIcon;
  if (/import|charger|ajouter|d[ée]poser/.test(t)) return UploadIcon;
  if (/activ/.test(t)) return ToggleRightIcon;
  if (/tester|essayer|lancer/.test(t)) return PlayIcon;
  if (/d[ée]compress|ouvr/.test(t)) return PackageOpenIcon;
  return MousePointerClickIcon;
}

const OUTIL_TABS = ["Les règles", "Télécharger", "Installer"] as const;

export function OutilPanel({ p, ctx }: { p: OutilPanneau; ctx: PanelCtx }) {
  const k = `e${ctx.index}`;
  const tab = Number(str(ctx.inputs[`${k}:onglet`]) || 0);
  const sel = str(ctx.inputs[`${k}:regle`]);
  const rule = sel === "" ? null : p.regles[Number(sel)];
  const installed = str(ctx.inputs[`${k}:installe`]) === "1";
  const seen = new Set(
    (Array.isArray(ctx.inputs[`${k}:fil`]) ? (ctx.inputs[`${k}:fil`] as Record<string, string>[]) : []).filter((e) => e.t === "regle").map((e) => e.r),
  );
  const done = [seen.size === p.regles.length, false, installed];
  return (
    <div className="space-y-6">
      <p className="text-body text-muted-foreground">{p.presentation}</p>

      {/* Une partie à la fois : comprendre, télécharger, installer. */}
      <div role="tablist" aria-label="L'outil" className="inline-flex rounded-full bg-muted/70 p-1">
        {OUTIL_TABS.map((t, i) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === i}
            onClick={() => ctx.set(`${k}:onglet`, String(i))}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === i ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {done[i] ? <CheckIcon className="size-3.5 text-success" strokeWidth={3} aria-hidden /> : <span className="tabular-nums">{i + 1}</span>}
            {t}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.standard, ease: ease.out }}>
        {tab === 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {p.regles.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => (seen.has(String(i)) ? ctx.set(`${k}:regle`, String(i)) : ctx.push({ t: "regle", r: String(i) }, { [`${k}:regle`]: String(i) }))}
                  aria-pressed={sel === String(i)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    sel === String(i) ? "bg-foreground text-background" : "bg-muted/70 hover:bg-muted",
                  )}
                >
                  {seen.has(String(i)) ? <CheckIcon className="size-3.5" aria-hidden /> : <CircleDotIcon className="size-3.5" aria-hidden />}
                  {r.titre}
                </button>
              ))}
            </div>
            {rule ? (
              <motion.div key={sel} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: duration.standard, ease: ease.out }} className="space-y-3">
                <p className="font-mono text-[0.8125rem] text-muted-foreground">{rule.extrait}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-success/10 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                      <CircleCheckIcon className="size-4" aria-hidden /> Avec la règle
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">{rule.avec}</p>
                  </div>
                  <div className="rounded-2xl bg-warning/10 p-4">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground/80">
                      <AlertTriangleIcon className="size-4 text-warning" aria-hidden /> Sans la règle
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{rule.sans}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Choisissez une règle pour voir ce qu&apos;elle change dans la réponse de Claude.</p>
            )}
            {seen.size === p.regles.length && (
              <Button variant="ghost" onClick={() => ctx.set(`${k}:onglet`, "1")}>
                Télécharger l&apos;outil →
              </Button>
            )}
          </div>
        )}
        {tab === 1 && (
          <div className="space-y-4">
            <DownloadCard name={p.fichier} href={ctx.fileUrl(p.fichier)} label="Skill Claude, à importer sans le décompresser" icon={/\.zip$/i.test(p.fichier) ? "zip" : "file"} />
            <Button variant="ghost" onClick={() => ctx.set(`${k}:onglet`, "2")}>
              L&apos;installer dans Claude →
            </Button>
          </div>
        )}
        {tab === 2 && (
          <div className="space-y-4">
            <ol className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(p.installation.length, 4)}, minmax(0, 1fr))` }}>
              {p.installation.map((s, i) => {
                const Icon = installIcon(s.titre);
                return (
                  <li key={i} className="rounded-2xl bg-muted/60 p-4">
                    <span className="grid size-9 place-items-center rounded-xl bg-background text-primary shadow-xs">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <p className="mt-3 text-sm font-semibold">
                      <span className="text-muted-foreground tabular-nums">{i + 1}. </span>
                      {s.titre}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
                  </li>
                );
              })}
            </ol>
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-2xl bg-muted/60 px-4 py-3 transition-colors hover:bg-muted",
                installed && "bg-success/10 hover:bg-success/15",
              )}
            >
              <Checkbox checked={installed} onCheckedChange={(v) => ctx.set(`${k}:installe`, v === true ? "1" : "0")} />
              <span className="font-medium">C&apos;est installé</span>
            </label>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ---------------- Test ---------------- */

export function TestPanel({ p, ctx }: { p: TestPanneau; ctx: PanelCtx }) {
  const k = `e${ctx.index}`;
  const text = str(ctx.inputs[`${k}:reponse`]);
  const verifiedText = str(ctx.inputs[`${k}:verifie`]);
  const res = str(ctx.inputs[`${k}:resultat`]);
  const fresh = verifiedText !== "" && verifiedText === text;

  function verify() {
    const r = p.verifications.map((v) => (checkVerification(text, v) ? "1" : "0")).join("");
    ctx.push({ t: "verif", r }, { [`${k}:verifie`]: text, [`${k}:resultat`]: r });
  }

  return (
    <div className="space-y-6">
      <DownloadCard name={p.fichier_donnees} href={ctx.fileUrl(p.fichier_donnees)} label="Données fictives, à joindre dans Claude" />
      <Section title="La réponse de Claude">
        <p className="text-body">{p.consigne}</p>
        <Textarea
          value={text}
          onChange={(e) => ctx.set(`${k}:reponse`, e.target.value)}
          rows={9}
          aria-label="Réponse de Claude"
          placeholder="Collez ici la réponse de Claude"
          className="rounded-2xl border-transparent bg-muted/60 font-mono text-[0.8125rem] focus-visible:bg-background"
        />
        <div className="flex items-center gap-3">
          <Button onClick={verify} disabled={!text.trim() || fresh}>
            Vérifier
          </Button>
          {text.trim() && !fresh && verifiedText && <span className="text-sm text-muted-foreground">Réponse modifiée : vérifiez de nouveau.</span>}
        </div>
      </Section>
      <Section title="Vérifications">
        <ul className="space-y-1.5">
          {p.verifications.map((v, i) => {
            const state = !fresh ? "wait" : res[i] === "1" ? "ok" : "miss";
            return (
              <motion.li
                key={i}
                layout
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  state === "ok" && "bg-success/10",
                  state === "miss" && "bg-warning/10",
                )}
              >
                <span
                  className={cn(
                    "size-3 shrink-0 rounded-full transition-colors duration-500",
                    state === "wait" && "bg-muted-foreground/25",
                    state === "ok" && "bg-success shadow-[0_0_0_4px] shadow-success/20",
                    state === "miss" && "bg-warning shadow-[0_0_0_4px] shadow-warning/25",
                  )}
                  aria-hidden
                />
                <span className="flex-1 text-sm font-medium">{v.libelle}</span>
                <span className="text-caption text-muted-foreground">{state === "wait" ? "à vérifier" : state === "ok" ? "trouvé" : "à revoir"}</span>
              </motion.li>
            );
          })}
        </ul>

      </Section>
    </div>
  );
}

/* ---------------- Personnaliser ---------------- */

export function PersonnaliserPanel({ p, ctx }: { p: PersonnaliserPanneau; ctx: PanelCtx }) {
  const k = `e${ctx.index}`;
  const checks = rec(ctx.inputs[`${k}:coches`]);
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="space-y-6">
      <Section title="La commande">
        <figure className="overflow-hidden rounded-2xl bg-muted/60">
          <figcaption className="flex items-center justify-between gap-3 px-4 pt-3">
            <span className="text-sm font-medium">À coller dans Claude</span>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(p.commande);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
                }
              }}
            >
              {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copié" : "Copier"}
            </Button>
          </figcaption>
          <pre className="px-4 py-3 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap">{p.commande}</pre>
        </figure>
      </Section>
      <Section title="Étapes">
        <ol className="space-y-2">
          {p.etapes.map((e, i) => (
            <li key={i} className="flex gap-3 text-body">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">{i + 1}</span>
              {e}
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Fait ?">
        <ul className="space-y-2">
          {p.items.map((it, i) => {
            const on = checks[i] === "1";
            return (
              <li key={i}>
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60", on && "bg-success/10 hover:bg-success/15")}>
                  <Checkbox checked={on} onCheckedChange={(v) => ctx.set(`${k}:coches`, { ...checks, [i]: v === true ? "1" : "0" })} />
                  <span className="text-body">{it}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}

/* ---------------- Fiche ---------------- */

export function FicheView({ p }: { p: FichePanneau }) {
  return (
    <article className="space-y-1">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-heading">{p.titre}</h3>
        <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">Rangée dans Ma boîte à outils</span>
      </div>
      <ol className="mt-4 space-y-2.5 text-body">
        {p.etapes.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      {p.pieges.length > 0 && (
        <div className="mt-5 rounded-lg bg-warning/10 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangleIcon className="size-4 text-warning" aria-hidden /> Pièges
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {p.pieges.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
