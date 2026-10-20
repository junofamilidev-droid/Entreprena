"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileJsonIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStep, deleteRow, move, setStatus, updateRow } from "@/lib/admin/actions";
import type { Module, ModuleAvailability, StepKind, ModuleWithSteps } from "@/lib/content/types";
import { kindLabel } from "@/components/platform/module-progress";
import { ChildRow, Crumbs, SaveBar, Section, SelectField, StatusBadge, TextField, useAction } from "./kit";

type Draft = Pick<Module, "title" | "slug" | "summary" | "deliverable" | "durationLabel" | "availability">;
const pick = (m: Module): Draft => ({
  title: m.title,
  slug: m.slug,
  summary: m.summary,
  deliverable: m.deliverable,
  durationLabel: m.durationLabel ?? "",
  availability: m.availability,
});

export function ModuleEditor({
  module: mod,
  formation,
  steps,
  sessions,
}: {
  module: Module;
  formation: { id: string; slug: string; title: string };
  steps: ModuleWithSteps["steps"];
  sessions: { id: string; number: number; title: string; duration_min: number; status: "draft" | "published" }[];
}) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [draft, setDraft] = React.useState(() => pick(mod));
  const [stepTitle, setStepTitle] = React.useState("");
  const [stepKind, setStepKind] = React.useState<StepKind>("lesson");
  const dirty = JSON.stringify(draft) !== JSON.stringify(pick(mod));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const published = mod.status === "published";

  function save() {
    run(
      () =>
        updateRow("modules", mod.id, {
          title: draft.title,
          slug: draft.slug,
          summary: draft.summary,
          deliverable: draft.deliverable,
          duration_label: draft.durationLabel?.trim() || null,
          availability: draft.availability,
        }),
      "Module enregistré.",
    );
  }

  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: formation.title, href: `/admin/formations/${formation.id}` }, { label: `Module ${mod.position}` }]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Module {mod.position}</p>
          <h1 className="text-title">{mod.title}</h1>
          <StatusBadge status={mod.status} />
        </div>
        <Button
          variant={published ? "outline" : "default"}
          disabled={pending || dirty}
          title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
          onClick={() => run(() => setStatus("modules", mod.id, published ? "draft" : "published"), published ? "Module retiré du site." : "Module publié.")}
        >
          {published ? "Repasser en brouillon" : "Publier le module"}
        </Button>
      </div>

      <Section title="Le module">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Titre" value={draft.title} onChange={(v) => set("title", v)} />
          <TextField label="Identifiant dans l'adresse" value={draft.slug} onChange={(v) => set("slug", v)} mono help={`/formations/${formation.slug}/${draft.slug}`} />
          <TextField label="Durée affichée" value={draft.durationLabel ?? ""} onChange={(v) => set("durationLabel", v)} placeholder="environ 1 h 30" />
          <SelectField<ModuleAvailability>
            label="Disponibilité"
            value={draft.availability}
            onChange={(v) => set("availability", v)}
            options={[
              { value: "open", label: "Ouvert : les étapes sont accessibles" },
              { value: "coming_soon", label: "À venir : visible dans le plan, fermé" },
            ]}
          />
        </div>
        <TextField label="Le cas (résumé)" value={draft.summary} onChange={(v) => set("summary", v)} multiline />
        <TextField label="Le livrable" value={draft.deliverable} onChange={(v) => set("deliverable", v)} multiline />
      </Section>

      <Section
        title="Sessions en blocs"
        aside={
          <Button asChild size="sm">
            <Link href="/admin/sessions/importer">
              <FileJsonIcon /> Importer une session (JSON)
            </Link>
          </Button>
        }
      >
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune session pour ce module. Importez un fichier JSON dont « formation » vaut{" "}
            <span className="font-mono">{formation.slug}</span> et « module » vaut <span className="font-mono">{mod.slug}</span>.
          </p>
        ) : (
          <>
            <ol className="divide-y rounded-md border">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="w-6 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">{s.number}</span>
                  <Link href={`/admin/sessions/${s.id}`} className="min-w-0 flex-1 hover:underline">
                    <span className="block truncate font-medium">{s.title}</span>
                    <span className="block text-caption text-muted-foreground">{s.duration_min} min</span>
                  </Link>
                  <StatusBadge status={s.status} />
                </li>
              ))}
            </ol>
            <p className="text-caption text-muted-foreground">
              Durée du module calculée depuis les sessions publiées :{" "}
              {sessions.filter((s) => s.status === "published").reduce((t, s) => t + s.duration_min, 0)} min.
            </p>
          </>
        )}
      </Section>

      <Section title="Étapes (ancien format)">
        {steps.length > 0 && (
          <ol className="divide-y rounded-md border">
            {steps.map((s, i) => (
              <ChildRow
                key={s.id}
                href={`/admin/etapes/${s.id}`}
                index={s.position}
                title={s.title}
                meta={`${kindLabel[s.kind]} · ${s.slug}`}
                status={s.status}
                first={i === 0}
                last={i === steps.length - 1}
                onMove={(d) => run(() => move("steps", s.id, d))}
                onDelete={() => window.confirm(`Supprimer l'étape « ${s.title} » ? Cette action est définitive.`) && run(() => deleteRow("steps", s.id), "Étape supprimée.")}
              />
            ))}
          </ol>
        )}
        <form
          className="grid gap-2 sm:grid-cols-[1fr_12rem_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!stepTitle.trim()) return;
            run(() => createStep(mod.id, stepTitle.trim(), stepKind), "Étape créée, en brouillon.", (d) => d && router.push(`/admin/etapes/${d.id}`));
          }}
        >
          <Input value={stepTitle} onChange={(e) => setStepTitle(e.target.value)} placeholder="Titre de la nouvelle étape" aria-label="Titre de la nouvelle étape" className="bg-card" />
          <select
            value={stepKind}
            onChange={(e) => setStepKind(e.target.value as StepKind)}
            aria-label="Type d'étape"
            className="h-9 rounded-md border border-input bg-card px-3 text-sm shadow-xs"
          >
            {(Object.keys(kindLabel) as StepKind[]).map((k) => (
              <option key={k} value={k}>
                {kindLabel[k]}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" disabled={pending || !stepTitle.trim()}>
            <PlusIcon /> Ajouter une étape
          </Button>
        </form>
      </Section>

      <SaveBar dirty={dirty} pending={pending} onSave={save} />
    </div>
  );
}
