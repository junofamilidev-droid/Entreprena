"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Result } from "@/lib/admin/actions";
import type { PublicationStatus } from "@/lib/content/types";

/** Lance une action serveur, affiche le résultat et rafraîchit la page. */
export function useAction() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const run = React.useCallback(
    <T,>(action: () => Promise<Result<T>>, success?: string, after?: (data: T | undefined) => void) =>
      start(async () => {
        const r = await action();
        if (!r.ok) {
          toast.error(r.error);
          return;
        }
        if (success) toast.success(success);
        after?.(r.data);
        router.refresh();
      }),
    [router],
  );
  return { run, pending };
}

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {c.href ? (
              <Link href={c.href} className="hover:text-foreground hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function StatusBadge({ status }: { status: PublicationStatus }) {
  return status === "published" ? (
    <Badge className="bg-success/15 text-success hover:bg-success/15">Publié</Badge>
  ) : (
    <Badge variant="outline">Brouillon</Badge>
  );
}

export function Section({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4 rounded-lg border bg-card p-4 sm:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  help,
  multiline,
  mono,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
  multiline?: boolean;
  mono?: boolean;
} & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn("bg-card", mono && "font-mono text-[0.8125rem]")} />
      ) : (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className={cn("bg-card", mono && "font-mono")} {...rest} />
      )}
      {help && <p className="text-caption text-muted-foreground">{help}</p>}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = React.useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

let keySeq = 0;
const fresh = () => `k${keySeq++}`;

/** Liste d'éléments réordonnables (paragraphes, écrans, questions…). */
export function ListEditor<T>({
  label,
  items,
  onChange,
  make,
  render,
  addLabel,
  itemLabel,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  render: (item: T, update: (next: T) => void, index: number) => React.ReactNode;
  addLabel: string;
  itemLabel: (index: number) => string;
}) {
  // Clés stables : un élément déplacé garde son éditeur (et le texte en cours de saisie).
  const [keys, setKeys] = React.useState<string[]>(() => items.map(fresh));
  if (keys.length !== items.length) setKeys(items.map(fresh));
  const set = (i: number, next: T) => onChange(items.map((x, j) => (j === i ? next : x)));
  const swap = (i: number, j: number) => {
    const copy = [...items];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    const k = [...keys];
    [k[i], k[j]] = [k[j], k[i]];
    setKeys(k);
    onChange(copy);
  };
  const remove = (i: number) => {
    setKeys(keys.filter((_, j) => j !== i));
    onChange(items.filter((_, j) => j !== i));
  };
  const add = () => {
    setKeys([...keys, fresh()]);
    onChange([...items, make()]);
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={keys[i] ?? i} className="rounded-md border bg-background/60">
            <div className="flex items-center justify-between gap-2 border-b px-3 py-1.5">
              <span className="text-caption font-medium text-muted-foreground">{itemLabel(i)}</span>
              <div className="flex gap-0.5">
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => swap(i, i - 1)} aria-label={`Monter : ${itemLabel(i)}`}>
                  <ArrowUpIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === items.length - 1} onClick={() => swap(i, i + 1)} aria-label={`Descendre : ${itemLabel(i)}`}>
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => window.confirm(`Supprimer « ${itemLabel(i)} » ?`) && remove(i)}
                  aria-label={`Supprimer : ${itemLabel(i)}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
            <div className="space-y-3 p-3">{render(item, (next) => set(i, next), i)}</div>
          </li>
        ))}
      </ol>
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <PlusIcon /> {addLabel}
      </Button>
    </div>
  );
}

/** Barre d'enregistrement collée en bas de l'écran, visible dès qu'il y a des modifications. */
export function SaveBar({ dirty, pending, onSave, children }: { dirty: boolean; pending: boolean; onSave: () => void; children?: React.ReactNode }) {
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  if (!dirty && !pending) return null;
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Modifications non enregistrées.</p>
        <div className="flex flex-wrap gap-2">
          {children}
          <Button onClick={onSave} disabled={!dirty || pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Ligne d'une liste ordonnée d'éléments enfants (modules d'une formation, étapes d'un module). */
export function ChildRow({
  href,
  index,
  title,
  meta,
  status,
  onMove,
  onDelete,
  first,
  last,
}: {
  href: string;
  index: number;
  title: string;
  meta: string;
  status: PublicationStatus;
  onMove: (d: -1 | 1) => void;
  onDelete: () => void;
  first: boolean;
  last: boolean;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className="w-6 shrink-0 text-right font-mono text-sm tabular-nums text-muted-foreground">{index}</span>
      <Link href={href} className="min-w-0 flex-1 hover:underline">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-caption text-muted-foreground">{meta}</span>
      </Link>
      <StatusBadge status={status} />
      <div className="flex shrink-0 gap-0.5">
        <Button variant="ghost" size="icon-sm" disabled={first} onClick={() => onMove(-1)} aria-label={`Monter : ${title}`}>
          <ArrowUpIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" disabled={last} onClick={() => onMove(1)} aria-label={`Descendre : ${title}`}>
          <ArrowDownIcon />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Supprimer : ${title}`}>
          <Trash2Icon />
        </Button>
      </div>
    </li>
  );
}
