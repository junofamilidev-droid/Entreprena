"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { PRICE, RECO_LABELS, SCALE_LABELS, toggleMulti, type Answer, type MultiQ, type Question } from "@/lib/feedback/questions";
import { euros } from "@/lib/feedback/stats";

// Champs du questionnaire. Les échelles et choix uniques sont de vrais boutons radio
// (flèches du clavier), les choix multiples de vraies cases à cocher.

const pill =
  "inline-flex cursor-pointer items-center justify-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";
const pillOff = "border-foreground/15 bg-background hover:border-foreground/35 hover:bg-muted/40";
const pillOn = "border-foreground bg-foreground text-background";

function Legend({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <legend id={id} className="mb-3 text-[1.0625rem] leading-snug font-medium text-balance">
      {children}
    </legend>
  );
}

/** Rangée de notes (1 à 5, ou 0 à 10) avec un libellé à chaque extrémité. */
function NoteRow({ name, label, values, value, onChange, low, high, required }: { name: string; label: string; values: number[]; value: Answer; onChange: (v: number) => void; low: string; high: string; required?: boolean }) {
  return (
    <fieldset>
      <Legend>
        {label}
        {required && <span className="ml-1 text-sm font-normal text-muted-foreground">(obligatoire)</span>}
      </Legend>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <label key={v} className={cn(pill, "min-w-11 tabular-nums", value === v ? pillOn : pillOff)}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" aria-label={`${v}${v === values[0] ? ` : ${low}` : v === values.at(-1) ? ` : ${high}` : ""}`} />
            {v}
          </label>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-4 text-caption whitespace-nowrap text-muted-foreground" style={{ maxWidth: `max(${values.length * 3.1}rem, 22rem)` }} aria-hidden>
        <span>
          {values[0]} = {low}
        </span>
        <span>
          {values.at(-1)} = {high}
        </span>
      </div>
    </fieldset>
  );
}

function ChoiceRow({ q, value, onChange, order }: { q: Question & { options: readonly string[] }; value: Answer; onChange: (v: Answer) => void; order?: string[] }) {
  const multi = q.kind === "multi";
  const selected = multi ? ((Array.isArray(value) ? value : []) as string[]) : [];
  const [refused, setRefused] = React.useState<string | null>(null);
  const options = order ?? [...q.options];
  return (
    <fieldset>
      <Legend>{q.label}</Legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = multi ? selected.includes(o) : value === o;
          return (
            <label key={o} className={cn(pill, "text-left", on ? pillOn : pillOff)}>
              <input
                type={multi ? "checkbox" : "radio"}
                name={q.id}
                checked={on}
                className="sr-only"
                onChange={() => {
                  if (!multi) return onChange(o);
                  const r = toggleMulti(q as MultiQ, selected, o);
                  setRefused(r.refused ?? null);
                  onChange(r.next.length ? r.next : undefined);
                }}
              />
              {o}
            </label>
          );
        })}
      </div>
      {multi && (q as MultiQ).max ? (
        <p className="mt-2 min-h-5 text-sm font-medium text-foreground/80" role="status" aria-live="polite">
          {refused}
        </p>
      ) : null}
    </fieldset>
  );
}

function TextField({ id, label, value, onChange, max, placeholder, required, short }: { id: string; label: string; value: Answer; onChange: (v: Answer) => void; max: number; placeholder?: string; required?: boolean; short?: boolean }) {
  const text = typeof value === "string" ? value : "";
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[1.0625rem] leading-snug font-medium">
        {label}
        <span className="ml-1 text-sm font-normal text-muted-foreground">{required ? "(obligatoire)" : "(facultatif)"}</span>
      </label>
      {short ? (
        <input
          id={id}
          value={text}
          maxLength={max}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="h-10 w-full max-w-md rounded-xl bg-foreground/[0.05] px-4 text-sm outline-none focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      ) : (
        <Textarea
          id={id}
          value={text}
          maxLength={max}
          rows={3}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="rounded-2xl border-transparent bg-foreground/[0.05] focus-visible:bg-background"
        />
      )}
      {!short && text.length > max * 0.8 && (
        <p className="mt-1 text-right text-caption text-muted-foreground tabular-nums">
          {text.length} / {max}
        </p>
      )}
    </div>
  );
}

/** Montant de 0 à 500 € : curseur sans valeur de départ, champ chiffré, et « Je ne paierais pas ». */
function PriceField({ id, label, value, onChange }: { id: string; label: string; value: Answer; onChange: (v: Answer) => void }) {
  const refus = value === PRICE.refus;
  const amount = typeof value === "number" ? value : null;
  // Saisie en cours dans le champ chiffré ; hors saisie, le champ affiche le montant choisi.
  const [editing, setEditing] = React.useState<string | null>(null);
  const draft = editing ?? (amount === null ? "" : String(amount));
  const fromSlider = (e: React.FormEvent<HTMLInputElement>) => onChange(Number(e.currentTarget.value));
  const commit = () => {
    setEditing(null);
    if (draft.trim() === "") return onChange(undefined);
    const n = Number(draft.replace(",", "."));
    if (Number.isNaN(n)) return;
    onChange(Math.min(PRICE.max, Math.max(PRICE.min, Math.round(n / PRICE.step) * PRICE.step)));
  };
  return (
    <fieldset>
      <Legend id={`${id}-label`}>{label}</Legend>
      <div className={cn("flex flex-wrap items-center gap-4", refus && "opacity-50")}>
        <div className="min-w-56 flex-1">
          <input
            type="range"
            min={PRICE.min}
            max={PRICE.max}
            step={PRICE.step}
            value={amount ?? (PRICE.min + PRICE.max) / 2}
            disabled={refus}
            aria-labelledby={`${id}-label`}
            aria-valuetext={amount === null ? "Aucun montant choisi" : euros(amount)}
            onInput={fromSlider}
            onPointerUp={fromSlider}
            onChange={() => {}}
            data-empty={amount === null || undefined}
            className="price-range w-full"
          />
          <div className="mt-1 flex justify-between text-caption text-muted-foreground" aria-hidden>
            <span>0 €</span>
            <span>500 €</span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Montant en euros</span>
          <input
            type="number"
            inputMode="numeric"
            min={PRICE.min}
            max={PRICE.max}
            step={PRICE.step}
            value={draft}
            disabled={refus}
            placeholder="—"
            onChange={(e) => setEditing(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            className="h-10 w-24 rounded-xl bg-foreground/[0.05] px-3 text-right tabular-nums outline-none focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          €
        </label>
      </div>
      <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
        {refus ? "Vous ne paieriez pas pour cela." : amount === null ? "Aucun montant choisi pour l'instant." : `Votre réponse : ${euros(amount)}`}
      </p>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={refus} onCheckedChange={(c) => onChange(c === true ? PRICE.refus : undefined)} />
        Je ne paierais pas pour cela
      </label>
    </fieldset>
  );
}

export function QuestionField({ q, value, onChange, answers, setAnswer, order, formation }: { q: Question; value: Answer; onChange: (v: Answer) => void; answers: Record<string, Answer>; setAnswer: (id: string, v: Answer) => void; order?: string[]; formation: string }) {
  const label = q.label.replace("{formation}", formation);
  switch (q.kind) {
    case "scale":
      return <NoteRow name={q.id} label={label} values={[1, 2, 3, 4, 5]} value={value} onChange={onChange} low={SCALE_LABELS.low} high={SCALE_LABELS.high} />;
    case "reco":
      return <NoteRow name={q.id} label={label} values={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} value={value} onChange={onChange} low={RECO_LABELS.low} high={RECO_LABELS.high} required />;
    case "single":
      return <ChoiceRow q={q} value={value} onChange={onChange} />;
    case "multi":
      return (
        <div className="space-y-3">
          <ChoiceRow q={q} value={value} onChange={onChange} order={order} />
          {q.other && Array.isArray(value) && value.includes(q.other.option) && (
            <TextField id={q.other.id} label={q.other.label} value={answers[q.other.id]} onChange={(v) => setAnswer(q.other!.id, v)} max={200} short />
          )}
        </div>
      );
    case "text":
      return <TextField id={q.id} label={label} value={value} onChange={onChange} max={q.max} placeholder={q.placeholder} required={q.required} short={q.short} />;
    case "price":
      return <PriceField id={q.id} label={label} value={value} onChange={onChange} />;
  }
}
