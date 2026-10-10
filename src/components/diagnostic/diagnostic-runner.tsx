"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftIcon, ArrowRightIcon, CopyIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScoreRing } from "./score-ring";
import { cn } from "@/lib/utils";
import {
  computeDiagnostic,
  isAnswered,
  type DiagnosticAnswers,
  type DiagnosticResult,
} from "@/lib/diagnostic/engine";
import type { DiagnosticConfig, DiagnosticQuestion, Module } from "@/lib/content/types";

type ModuleRef = Pick<Module, "position" | "title" | "slug" | "availability">;

interface Saved {
  answers: DiagnosticAnswers;
  index: number;
  done: boolean;
}

function storageKey(slug: string) {
  return `diagnostic:${slug}`;
}
function load(slug: string): Saved | null {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
function save(slug: string, s: Saved | null) {
  try {
    if (s) localStorage.setItem(storageKey(slug), JSON.stringify(s));
    else localStorage.removeItem(storageKey(slug));
  } catch {
    // Stockage indisponible (navigation privée) : le diagnostic fonctionne quand même.
  }
}

function initialAnswers(config: DiagnosticConfig): DiagnosticAnswers {
  const a: DiagnosticAnswers = {};
  for (const q of config.questions) {
    if (q.type === "grid") a[q.id] = Object.fromEntries(q.rows.map((r) => [r.id, 0]));
    if (q.type === "multi") a[q.id] = [];
  }
  return a;
}

function optionClass(selected: boolean) {
  return cn(
    "flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-4 text-body leading-snug font-normal transition-colors hover:bg-muted/60",
    selected && "border-brand bg-brand-soft/60 hover:bg-brand-soft/60",
  );
}

function QuestionView({
  q,
  answers,
  onChange,
  onPicked,
}: {
  q: DiagnosticQuestion;
  answers: DiagnosticAnswers;
  onChange: (value: DiagnosticAnswers[string]) => void;
  onPicked: () => void;
}) {
  const pointer = React.useRef(false);

  if (q.type === "single") {
    const value = (answers[q.id] as string) ?? "";
    return (
      <RadioGroup
        value={value}
        onValueChange={(v) => {
          onChange(v);
          if (pointer.current) onPicked();
          pointer.current = false;
        }}
        className="gap-3"
        aria-label={q.label}
      >
        {q.options.map((o) => (
          <Label
            key={o.value}
            htmlFor={`${q.id}-${o.value}`}
            className={optionClass(value === o.value)}
            onPointerDown={() => (pointer.current = true)}
          >
            <RadioGroupItem id={`${q.id}-${o.value}`} value={o.value} className="mt-0.5" />
            {o.label}
          </Label>
        ))}
      </RadioGroup>
    );
  }

  if (q.type === "multi") {
    const values = (answers[q.id] as string[]) ?? [];
    return (
      <div className="grid gap-3" role="group" aria-label={q.label}>
        {q.options.map((o) => {
          const checked = values.includes(o.value);
          return (
            <Label key={o.value} htmlFor={`${q.id}-${o.value}`} className={optionClass(checked)}>
              <Checkbox
                id={`${q.id}-${o.value}`}
                checked={checked}
                className="mt-0.5"
                onCheckedChange={(c) =>
                  onChange(c ? [...values, o.value] : values.filter((v) => v !== o.value))
                }
              />
              {o.label}
            </Label>
          );
        })}
      </div>
    );
  }

  if (q.type !== "grid") return null;
  const grid = (answers[q.id] as Record<string, number>) ?? {};
  return (
    <div className="divide-y rounded-xl border bg-card">
      {q.rows.map((r) => (
        <div
          key={r.id}
          role="group"
          aria-label={r.label}
          className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6"
        >
          <div>
            <p className="font-medium">{r.label}</p>
            {r.detail && <p className="text-caption text-muted-foreground">{r.detail}</p>}
          </div>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={String(grid[r.id] ?? 0)}
            onValueChange={(v) => v && onChange({ ...grid, [r.id]: Number(v) })}
            className="w-full sm:w-auto"
          >
            {q.levels.map((l) => (
              <ToggleGroupItem
                key={l.value}
                value={String(l.value)}
                className="flex-1 px-3 data-[state=on]:bg-brand data-[state=on]:text-brand-foreground sm:flex-none"
              >
                {l.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ))}
    </div>
  );
}

function summaryText(
  title: string,
  config: DiagnosticConfig,
  answers: DiagnosticAnswers,
  r: DiagnosticResult,
) {
  const lines = [
    `DIAGNOSTIC — ${title} (version de test)`,
    `${config.score.label} : ${r.score} / 100 (${r.band.label.toLowerCase()}) — estimation`,
    `${config.level.label} : ${r.level}`,
    `Point d'entrée : ${r.entry.label}`,
    `Temps : ${r.parts
      .filter((p) => p.share > 0)
      .map((p) => `${p.row.label} ${Math.round(p.share * 100)} %`)
      .join(" ; ")}`,
  ];
  for (const q of config.questions) {
    if (q.type === "grid") continue;
    const a = answers[q.id];
    const vals = Array.isArray(a) ? a : typeof a === "string" ? [a] : [];
    const labels = vals.map((v) => q.options.find((o) => o.value === v)?.label ?? v);
    if (labels.length) lines.push(`${q.label} ${labels.join(", ")}`);
  }
  return lines.join("\n");
}

function ResultView({
  formationSlug,
  formationTitle,
  config,
  answers,
  result: r,
  onRestart,
}: {
  formationSlug: string;
  formationTitle: string;
  config: DiagnosticConfig;
  answers: DiagnosticAnswers;
  result: DiagnosticResult;
  onRestart: () => void;
}) {
  const entryHref = `/formations/${formationSlug}/${r.entry.moduleSlug}${r.entry.stepSlug ? `?etape=${r.entry.stepSlug}` : ""}`;
  const parts = r.parts.filter((p) => p.share > 0);
  const gridQ = config.questions.find((q) => q.id === config.score.gridQuestion);
  const max = config.score.max;

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText(formationTitle, config, answers, r));
      toast.success("Résultat copié");
    } catch {
      toast.error("La copie n'a pas fonctionné sur ce navigateur.");
    }
  }

  return (
    <div className="space-y-14">
      <section className="space-y-8" aria-labelledby="resultat">
        <p className="text-kicker text-brand">Votre résultat</p>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <ScoreRing score={r.score} label={config.score.label} />
          <div className="space-y-3">
            <h2 id="resultat" className="text-title">{r.band.label}</h2>
            <p className="text-body">{r.band.message}</p>
            <p className="rounded-md border-l-2 border-brand bg-brand-soft/50 px-3 py-2 text-body">
              {config.score.caveat}
            </p>
          </div>
        </div>
        <p className="text-caption text-muted-foreground">
          <strong className="font-semibold">Comment il est calculé.</strong> {config.score.note}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="gap-2">
          <CardHeader>
            <CardDescription>{config.level.label}</CardDescription>
            <CardTitle className="font-serif text-2xl">{r.level}</CardTitle>
          </CardHeader>
          <CardContent className="text-caption text-muted-foreground">{config.level.note}</CardContent>
        </Card>
        <Card className="gap-2 border-2 border-brand">
          <CardHeader>
            <CardDescription>Votre point d&apos;entrée</CardDescription>
            <CardTitle className="font-serif text-2xl">{r.entry.label}</CardTitle>
          </CardHeader>
          <CardContent className="text-caption text-muted-foreground">{r.entry.reason}</CardContent>
        </Card>
      </section>

      <section className="space-y-6" aria-labelledby="plan-action">
        <h2 id="plan-action" className="text-heading">Votre plan d&apos;action</h2>
        <ol className="space-y-4">
          {[...r.advice, ...(r.topTask ? [r.topTask.text] : [])].map((t, i) => (
            <li key={i} className="flex gap-4 text-body">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft font-mono text-caption text-brand">
                {i + 1}
              </span>
              <span className="pt-0.5">{t}</span>
            </li>
          ))}
        </ol>
        {r.nextTask && r.nextTask.part.row.id !== r.topTask?.part.row.id && (
          <p className="text-caption text-muted-foreground">
            Ensuite : votre tâche la plus exposée parmi les autres modules est « {r.nextTask.part.row.label} »,
            traitée au module {r.nextTask.module.position} ({r.nextTask.module.title}).
          </p>
        )}
        <Button asChild size="lg">
          <Link href={entryHref}>
            Commencer : {r.entry.label} <ArrowRightIcon />
          </Link>
        </Button>
      </section>

      <section className="space-y-6" aria-labelledby="temps">
        <div className="space-y-2">
          <h2 id="temps" className="text-heading">Votre temps, tâche par tâche</h2>
          <p className="text-caption text-muted-foreground">
            La barre montre la part de votre temps. Le niveau d&apos;exposition de chaque tâche est
            une estimation, de 1 à {max}.
          </p>
        </div>
        <ul className="divide-y rounded-xl border bg-card" aria-label={gridQ?.label}>
          {parts.map((p) => (
            <li key={p.row.id} className="grid gap-2 p-4">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-medium">
                  {p.row.label}
                  {p.row.modulePosition && (
                    <span className="text-caption font-normal text-muted-foreground"> · module {p.row.modulePosition}</span>
                  )}
                </p>
                <p className="shrink-0 font-mono text-sm tabular-nums">{Math.round(p.share * 100)} %</p>
              </div>
              <Progress value={p.share * 100} className="h-1.5 bg-muted" aria-label={`Part du temps : ${Math.round(p.share * 100)} %`} />
              <p className="text-caption text-muted-foreground">
                Exposition estimée : {p.row.weight} sur {max}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3 border-t pt-8">
        <Button variant="outline" onClick={copy}>
          <CopyIcon /> Copier mon résultat
        </Button>
        <Button variant="ghost" onClick={onRestart}>
          <RotateCcwIcon /> Refaire le diagnostic
        </Button>
      </section>
    </div>
  );
}

export function DiagnosticRunner({
  formationSlug,
  formationTitle,
  config,
  modules,
}: {
  formationSlug: string;
  formationTitle: string;
  config: DiagnosticConfig;
  modules: ModuleRef[];
}) {
  const reduce = useReducedMotion();
  const [answers, setAnswers] = React.useState<DiagnosticAnswers>(() => initialAnswers(config));
  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const top = React.useRef<HTMLDivElement>(null);
  const advanceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const answersRef = React.useRef(answers);
  React.useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  React.useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  // Reprise d'un diagnostic commencé ou terminé sur cet appareil.
  React.useEffect(() => {
    const saved = load(formationSlug);
    // Le stockage du navigateur n'existe qu'après l'affichage : on restaure ici, une seule fois.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (saved) {
      setAnswers({ ...initialAnswers(config), ...saved.answers });
      setIndex(Math.min(saved.index, config.questions.length - 1));
      setDone(saved.done);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [formationSlug, config]);

  React.useEffect(() => {
    if (ready) save(formationSlug, { answers, index, done });
  }, [ready, formationSlug, answers, index, done]);

  const q = config.questions[index];
  const last = index === config.questions.length - 1;
  const result = React.useMemo(
    () => (done ? computeDiagnostic(config, answers, modules) : null),
    [done, config, answers, modules],
  );

  function scrollTop() {
    top.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }

  function next(current = answers) {
    if (!isAnswered(q, current)) {
      setError(
        q.type === "grid"
          ? "Indiquez au moins une tâche sur laquelle vous passez du temps."
          : "Choisissez une réponse pour continuer.",
      );
      return;
    }
    setError(null);
    if (last) setDone(true);
    else setIndex(index + 1);
    scrollTop();
  }

  function restart() {
    save(formationSlug, null);
    setAnswers(initialAnswers(config));
    setIndex(0);
    setDone(false);
    scrollTop();
  }

  if (!ready) return <div className="min-h-[480px]" />;

  if (done && result) {
    return (
      <div ref={top} className="scroll-mt-32">
        <ResultView
          formationSlug={formationSlug}
          formationTitle={formationTitle}
          config={config}
          answers={answers}
          result={result}
          onRestart={restart}
        />
      </div>
    );
  }

  return (
    <div ref={top} className="scroll-mt-32 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-caption text-muted-foreground">
          <span>
            Question {index + 1} sur {config.questions.length}
          </span>
          <Badge variant="outline" className="font-normal">Résultat : une estimation</Badge>
        </div>
        <Progress value={(index / config.questions.length) * 100} className="h-1 bg-muted" aria-label="Avancement du diagnostic" />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.fieldset
          key={q.id}
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? undefined : { opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
          className="min-h-[360px] space-y-6"
        >
          <legend className="sr-only">{q.label}</legend>
          <div className="space-y-2">
            <h2 className="text-heading" aria-hidden>{q.label}</h2>
            {q.help && <p className="text-body text-muted-foreground">{q.help}</p>}
          </div>
          <QuestionView
            q={q}
            answers={answers}
            onChange={(v) => {
              setError(null);
              setAnswers((a) => ({ ...a, [q.id]: v }));
            }}
            onPicked={() => {
              if (advanceTimer.current) clearTimeout(advanceTimer.current);
              // Choix unique fait à la souris ou au doigt : on passe seul à la question suivante.
              advanceTimer.current = setTimeout(() => {
                if (!isAnswered(q, answersRef.current)) return;
                if (last) setDone(true);
                else setIndex((i) => (config.questions[i]?.id === q.id ? i + 1 : i));
              }, 260);
            }}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">{error}</p>
          )}
        </motion.fieldset>
      </AnimatePresence>

      <div className="flex items-center justify-between gap-3 border-t pt-6">
        <Button variant="ghost" onClick={() => { setError(null); setIndex(Math.max(0, index - 1)); }} disabled={index === 0}>
          <ArrowLeftIcon /> Retour
        </Button>
        <Button size="lg" onClick={() => next()}>
          {last ? "Voir mon résultat" : "Continuer"}
        </Button>
      </div>
    </div>
  );
}
