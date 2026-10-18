"use client";

import * as React from "react";
import { AlertTriangleIcon, CheckIcon, CircleCheckIcon, CopyIcon, PlusIcon, PrinterIcon, Trash2Icon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PromptBlock } from "@/components/reader/prompt-block";
import { cn } from "@/lib/utils";
import {
  assemble,
  checkValue,
  deliverableToText,
  filledRows,
  review,
  reviewFields,
  tableToText,
  type DeliverablePart,
} from "@/lib/exercise/logic";
import type { ExerciseBlock, ExerciseContent, ExerciseInputs, ExerciseValue } from "@/lib/content/types";

type Block<T extends ExerciseBlock["type"]> = Extract<ExerciseBlock, { type: T }>;

export interface BlockContext {
  content: ExerciseContent;
  inputs: ExerciseInputs;
  setInput: (id: string, value: ExerciseValue) => void;
}

function useCopy() {
  const [copied, setCopied] = React.useState(false);
  const copy = React.useCallback(async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(message);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("La copie n'a pas fonctionné : sélectionnez le texte à la main.");
    }
  }, []);
  return { copied, copy };
}

function BlockHeading({ title, help, aside }: { title: string; help?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold">{title}</h3>
        {help && <p className="text-sm text-muted-foreground">{help}</p>}
      </div>
      {aside}
    </div>
  );
}

/* ---------------- Données à copier ---------------- */

function DataBlock({ block }: { block: Block<"data"> }) {
  const { copied, copy } = useCopy();
  const isTable = Boolean(block.columns && block.rows);
  const body = isTable
    ? [block.columns!.map((c) => c.label), ...(block.copyRows ?? block.rows!)].map((r) => r.join("\t")).join("\n")
    : (block.text ?? "");
  const copyText = block.header ? `${block.header}\n\n${body}` : body;

  return (
    <section className="overflow-hidden rounded-lg border">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">{block.title}</h3>
          {block.note && <p className="mt-0.5 text-caption text-muted-foreground">{block.note}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => copy(copyText, isTable ? "Données copiées : collez-les dans un tableur" : "Texte copié")}>
          {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copié" : block.copyLabel}
        </Button>
      </header>
      {block.header && (
        <p className="border-b bg-muted/30 px-4 py-2.5 text-sm font-medium whitespace-pre-line">{block.header}</p>
      )}
      {isTable ? (
        <div className="max-h-[26rem] overflow-auto bg-muted/30" tabIndex={0} aria-label={block.title}>
          <table className="w-full min-w-[40rem] border-collapse text-[0.8125rem]">
            <thead className="sticky top-0 z-[1] bg-card shadow-[0_1px_0_var(--border)]">
              <tr>
                {block.columns!.map((c) => (
                  <th
                    key={c.label}
                    scope="col"
                    className={cn("px-3 py-2 font-medium whitespace-nowrap text-muted-foreground", c.align === "right" ? "text-right" : "text-left")}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows!.map((r, i) => (
                <tr key={i} className="border-t border-border/60">
                  {r.map((cell, j) => (
                    <td
                      key={j}
                      className={cn(
                        "px-3 py-1.5",
                        block.columns![j]?.align === "right" ? "text-right font-mono tabular-nums whitespace-nowrap" : "",
                        j === 0 && "font-mono text-muted-foreground",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="max-h-80 overflow-auto bg-muted/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-line">{block.text}</p>
      )}
    </section>
  );
}

/* ---------------- Champ de saisie ---------------- */

function InputBlock({ block, ctx }: { block: Block<"input">; ctx: BlockContext }) {
  const stored = ctx.inputs[block.id];
  const value = typeof stored === "string" ? stored : (block.defaultValue ?? "");
  const id = `in-${block.id}`;
  const helpId = block.help ? `${id}-help` : undefined;
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-semibold">
        {block.label}
      </Label>
      {block.help && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {block.help}
        </p>
      )}
      {block.multiline ? (
        <Textarea
          id={id}
          aria-describedby={helpId}
          value={value}
          placeholder={block.placeholder}
          onChange={(e) => ctx.setInput(block.id, e.target.value)}
          className="min-h-24 bg-card"
        />
      ) : (
        <Input
          id={id}
          aria-describedby={helpId}
          value={value}
          placeholder={block.placeholder}
          onChange={(e) => ctx.setInput(block.id, e.target.value)}
          className="bg-card"
        />
      )}
    </div>
  );
}

/* ---------------- Contrôle de valeurs attendues ---------------- */

function ChecksBlock({ block, ctx }: { block: Block<"checks">; ctx: BlockContext }) {
  const stored = ctx.inputs[block.id];
  const values = stored && typeof stored === "object" && !Array.isArray(stored) ? stored : {};
  const [focused, setFocused] = React.useState<string | null>(null);
  const states = block.items.map((c) => checkValue(c, values[c.id]));
  const okCount = states.filter((s) => s === "ok").length;

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4 sm:p-5">
      <BlockHeading
        title={block.title}
        help={block.help}
        aside={
          <span className="text-caption tabular-nums text-muted-foreground">
            {okCount} sur {block.items.length} conforme{okCount > 1 ? "s" : ""}
          </span>
        }
      />
      <ul className="divide-y">
        {block.items.map((c, i) => {
          const id = `chk-${block.id}-${c.id}`;
          const state = focused === c.id && states[i] !== "ok" ? "empty" : states[i];
          return (
            <li key={c.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_12rem] sm:items-center sm:gap-4">
              <Label htmlFor={id} className="font-normal">
                {c.label}
              </Label>
              <div className="relative">
                <Input
                  id={id}
                  inputMode="decimal"
                  autoComplete="off"
                  value={values[c.id] ?? ""}
                  onFocus={() => setFocused(c.id)}
                  onBlur={() => setFocused(null)}
                  onChange={(e) => ctx.setInput(block.id, { ...values, [c.id]: e.target.value })}
                  aria-invalid={state === "mismatch" || state === "invalid"}
                  aria-describedby={`${id}-msg`}
                  className="pr-9 text-right font-mono tabular-nums"
                />
                {state === "ok" && <CheckIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-success" aria-hidden />}
                {state === "mismatch" && <XIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-destructive" aria-hidden />}
              </div>
              <p id={`${id}-msg`} role="status" className={cn("text-sm sm:col-span-2", state === "empty" && "sr-only")}>
                {state === "ok" && <span className="text-success">Conforme au fichier.</span>}
                {state === "mismatch" && <span className="text-destructive">{c.mismatch}</span>}
                {state === "invalid" && <span className="text-destructive">Saisissez un nombre, par exemple 1 250 000.</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------- Tableau à lignes ---------------- */

function TableBlock({ block, ctx }: { block: Block<"table">; ctx: BlockContext }) {
  const stored = ctx.inputs[block.id];
  const rows = Array.isArray(stored) ? stored : [];
  const count = filledRows(rows, block.columns).length;
  const listId = (colId: string) => `sugg-${block.id}-${colId}`;

  function update(i: number, colId: string, v: string) {
    ctx.setInput(block.id, rows.map((r, j) => (j === i ? { ...r, [colId]: v } : r)));
  }
  function add() {
    ctx.setInput(block.id, [...rows, {}]);
  }
  function remove(i: number) {
    const row = rows[i];
    const filled = block.columns.some((c) => row[c.id]?.trim());
    if (filled && !window.confirm("Supprimer ce constat ?")) return;
    ctx.setInput(block.id, rows.filter((_, j) => j !== i));
  }

  return (
    <section className="space-y-4">
      <BlockHeading
        title={block.title}
        help={block.help}
        aside={
          <Badge variant={block.target && count >= block.target ? "default" : "secondary"} className="tabular-nums">
            {count} ligne{count > 1 ? "s" : ""}
            {block.target ? ` sur ${block.target} visées` : ""}
          </Badge>
        }
      />

      {block.example && (
        <details className="group rounded-lg border border-dashed px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium">{block.example.title}</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[11rem_1fr]">
            {block.columns.map((c) =>
              block.example!.values[c.id] ? (
                <React.Fragment key={c.id}>
                  <dt className="text-muted-foreground">{c.label}</dt>
                  <dd>{block.example!.values[c.id]}</dd>
                </React.Fragment>
              ) : null,
            )}
          </dl>
        </details>
      )}

      {block.columns.map((c) =>
        c.suggestions ? (
          <datalist key={c.id} id={listId(c.id)}>
            {c.suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null,
      )}

      <ol className="space-y-4">
        {rows.map((row, i) => (
          <li key={i} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-4 py-2">
              <span className="text-sm font-medium">
                {row[block.columns[0].id]?.trim() || `Ligne ${i + 1}`}
              </span>
              <Button variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label={`Supprimer la ligne ${i + 1}`}>
                <Trash2Icon />
              </Button>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {block.columns.map((c) => {
                const id = `tb-${block.id}-${i}-${c.id}`;
                return (
                  <div key={c.id} className={cn("space-y-1.5", c.multiline && "sm:col-span-1")}>
                    <Label htmlFor={id} className="text-sm text-muted-foreground">
                      {c.label}
                    </Label>
                    {c.multiline ? (
                      <Textarea
                        id={id}
                        value={row[c.id] ?? ""}
                        placeholder={c.placeholder}
                        onChange={(e) => update(i, c.id, e.target.value)}
                        className="min-h-20"
                      />
                    ) : (
                      <Input
                        id={id}
                        value={row[c.id] ?? ""}
                        placeholder={c.placeholder}
                        list={c.suggestions ? listId(c.id) : undefined}
                        onChange={(e) => update(i, c.id, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <Button variant="outline" onClick={add}>
        <PlusIcon /> Ajouter un constat
      </Button>
    </section>
  );
}

/* ---------------- Relecture automatique ---------------- */

function ReviewBlock({ block, ctx }: { block: Block<"review">; ctx: BlockContext }) {
  const rules = block.rules ?? ctx.content.reviewRules ?? [];
  const fields = reviewFields(ctx.content, ctx.inputs, block.sources);
  const hasText = fields.some((f) => f.text.trim());
  const findings = review(fields, rules);

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4 sm:p-5" aria-live="polite">
      <BlockHeading
        title={block.title}
        help={block.help}
        aside={
          hasText ? (
            <Badge variant={findings.length ? "outline" : "secondary"} className="tabular-nums">
              {findings.length ? `${findings.length} phrase${findings.length > 1 ? "s" : ""} à revoir` : "Rien de repéré"}
            </Badge>
          ) : null
        }
      />
      {!hasText ? (
        <p className="text-sm text-muted-foreground">Rien à relire pour l&apos;instant : remplissez d&apos;abord vos rubriques.</p>
      ) : findings.length === 0 ? (
        <p className="flex items-start gap-2 text-sm">
          <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
          Aucune formule à risque repérée. Relisez quand même chaque phrase : l&apos;ai-je fait ? puis-je le montrer ?
        </p>
      ) : (
        <ul className="space-y-3">
          {findings.map((f, i) => (
            <li key={i} className="rounded-md border-l-2 border-warning bg-warning/10 px-3 py-2.5 text-sm">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangleIcon className="size-4 shrink-0 text-warning" aria-hidden />
                {f.rule.label}
                <span className="font-normal text-muted-foreground">· {f.fieldLabel}</span>
              </p>
              <blockquote className="mt-1.5 font-serif italic">« {f.sentence} »</blockquote>
              <p className="mt-1.5 text-muted-foreground">{f.rule.message}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------------- Livrable assemblé ---------------- */

/** Saisies assemblées : textes, lignes de tableau, rubriques vides. */
export function DeliverableParts({ parts }: { parts: DeliverablePart[] }) {
  return (
    <>
      {parts.map((p, j) => {
        if (p.kind === "missing")
          return (
            <p key={j} className="text-sm text-muted-foreground italic">
              {p.label} : à compléter
            </p>
          );
        if (p.kind === "text")
          return (
            <div key={j} className="text-body">
              {p.label && <p className="text-sm font-medium">{p.label}</p>}
              <p className="whitespace-pre-line">{p.text}</p>
            </div>
          );
        return (
          <ol key={j} className="divide-y rounded-md border">
            {p.rows.map((r, k) => (
              <li key={k} className="break-inside-avoid px-4 py-3">
                <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[10rem_1fr]">
                  {p.columns
                    .filter((c) => r[c.id]?.trim())
                    .map((c) => (
                      <React.Fragment key={c.id}>
                        <dt className="text-muted-foreground">{c.label}</dt>
                        <dd className={cn("whitespace-pre-line", c === p.columns[0] && "font-medium")}>{r[c.id]}</dd>
                      </React.Fragment>
                    ))}
                </dl>
              </li>
            ))}
          </ol>
        );
      })}
    </>
  );
}


function DeliverableBlock({ block, ctx }: { block: Block<"deliverable">; ctx: BlockContext }) {
  const { copied, copy } = useCopy();
  const sections = assemble(ctx.content, ctx.inputs, block.sections);
  const text = deliverableToText(block.title, sections);
  const missing = sections.flatMap((s) => s.parts).filter((p) => p.kind === "missing").length;

  return (
    <section className="space-y-4">
      <BlockHeading
        title="Votre livrable"
        help={block.help}
        aside={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copy(text, "Feuille de travail copiée")}>
              {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copiée" : "Copier le texte"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <PrinterIcon /> Imprimer ou PDF
            </Button>
          </div>
        }
      />
      {missing > 0 && (
        <p className="text-sm text-muted-foreground">
          {missing} rubrique{missing > 1 ? "s" : ""} encore vide{missing > 1 ? "s" : ""}, signalée{missing > 1 ? "s" : ""} « à compléter ».
        </p>
      )}
      <article className="print-area space-y-7 rounded-lg border bg-card px-5 py-6 shadow-xs sm:px-8 sm:py-8">
        <h2 className="text-heading">{block.title}</h2>
        {sections.map((s) => (
          <section key={s.title} className="space-y-2">
            <h3 className="text-base font-semibold">
              {s.number ? `${s.number}. ` : ""}
              {s.title}
            </h3>
            <DeliverableParts parts={s.parts} />
          </section>
        ))}
      </article>
    </section>
  );
}

/* ---------------- Aiguillage ---------------- */

export function ExerciseBlockView({ block, ctx }: { block: ExerciseBlock; ctx: BlockContext }) {
  switch (block.type) {
    case "text":
      return <div className="prose-lesson max-w-[66ch]" dangerouslySetInnerHTML={{ __html: block.html }} />;
    case "data":
      return <DataBlock block={block} />;
    case "prompt": {
      const table = block.insertTable;
      const tableBlock = table ? ctx.content.parts.flatMap((p) => p.blocks).find((b) => "id" in b && b.id === table.tableId) : undefined;
      const rows = table ? ctx.inputs[table.tableId] : undefined;
      const tableText =
        tableBlock?.type === "table" && Array.isArray(rows) ? tableToText(tableBlock.columns, rows) : "";
      const ready = Boolean(table && tableText);
      return (
        <div className="space-y-2">
          <PromptBlock
            title={block.title}
            note={block.note ?? null}
            text={block.text}
            copyText={ready ? block.text.replace(table!.placeholder, `\n\n${tableText}\n`) : undefined}
            copyLabel={ready ? "Copier avec mon tableau" : "Copier"}
          />
          {table && !ready && (
            <p className="text-sm text-muted-foreground">
              Votre tableau de constats est vide : remplissez-le à l&apos;étape précédente, il sera inséré dans le prompt.
            </p>
          )}
        </div>
      );
    }
    case "input":
      return <InputBlock block={block} ctx={ctx} />;
    case "checks":
      return <ChecksBlock block={block} ctx={ctx} />;
    case "table":
      return <TableBlock block={block} ctx={ctx} />;
    case "review":
      return <ReviewBlock block={block} ctx={ctx} />;
    case "deliverable":
      return <DeliverableBlock block={block} ctx={ctx} />;
  }
}
