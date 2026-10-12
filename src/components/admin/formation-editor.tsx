"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createModule, deleteRow, move, saveDiagnostic, setStatus, updateRow } from "@/lib/admin/actions";
import type { Formation, Module, PublicationStatus } from "@/lib/content/types";
import { ChildRow, Crumbs, ListEditor, SaveBar, Section, StatusBadge, TextField, useAction } from "./kit";
import { JsonField } from "./json-field";

type Draft = Omit<Formation, "id" | "status" | "position">;

function toDraft(f: Formation): Draft {
  const { id, status, position, ...rest } = f;
  void [id, status, position];
  return rest;
}

export function FormationEditor({
  formation,
  modules,
  diagnostic,
}: {
  formation: Formation;
  modules: Module[];
  diagnostic: { config: unknown; status: PublicationStatus } | null;
}) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(formation));
  const [moduleTitle, setModuleTitle] = React.useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(formation));
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function save() {
    run(
      () =>
        updateRow("formations", formation.id, {
          slug: draft.slug,
          title: draft.title,
          domain: draft.domain,
          audience: draft.audience,
          promise: draft.promise,
          summary: draft.summary,
          for_whom: draft.forWhom,
          not_this: draft.notThis,
          method: draft.method,
          tutor_url: draft.tutorUrl?.trim() || null,
          presale: draft.presale,
        }),
      "Formation enregistrée.",
    );
  }

  const published = formation.status === "published";

  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: formation.title }]} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-title">{formation.title}</h1>
          <div className="flex items-center gap-3">
            <StatusBadge status={formation.status} />
            {published && (
              <Link href={`/formations/${formation.slug}`} target="_blank" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                Voir sur le site <ExternalLinkIcon className="size-3.5" />
              </Link>
            )}
          </div>
        </div>
        <Button
          variant={published ? "outline" : "default"}
          disabled={pending || dirty}
          title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
          onClick={() => run(() => setStatus("formations", formation.id, published ? "draft" : "published"), published ? "Formation retirée du site." : "Formation publiée.")}
        >
          {published ? "Repasser en brouillon" : "Publier la formation"}
        </Button>
      </div>

      <Section title="Présentation">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Titre" value={draft.title} onChange={(v) => set("title", v)} />
          <TextField label="Identifiant dans l'adresse" value={draft.slug} onChange={(v) => set("slug", v)} mono help={`/formations/${draft.slug}`} />
          <TextField label="Métier (surtitre)" value={draft.domain} onChange={(v) => set("domain", v)} help="Par exemple : Audit, Paie, Juridique." />
          <TextField label="Public" value={draft.audience} onChange={(v) => set("audience", v)} />
        </div>
        <TextField label="Promesse" value={draft.promise} onChange={(v) => set("promise", v)} multiline />
        <TextField label="Résumé" value={draft.summary} onChange={(v) => set("summary", v)} multiline />
      </Section>

      <Section title="Pour qui, et ce que ce n'est pas">
        <ListEditor
          label="Pour qui"
          items={draft.forWhom}
          onChange={(v) => set("forWhom", v)}
          make={() => ""}
          addLabel="Ajouter un paragraphe"
          itemLabel={(i) => `Paragraphe ${i + 1}`}
          render={(item, update) => <TextField label="Texte" value={item} onChange={update} multiline />}
        />
        <ListEditor
          label="Ce que ce n'est pas"
          items={draft.notThis}
          onChange={(v) => set("notThis", v)}
          make={() => ""}
          addLabel="Ajouter un paragraphe"
          itemLabel={(i) => `Paragraphe ${i + 1}`}
          render={(item, update) => <TextField label="Texte" value={item} onChange={update} multiline />}
        />
      </Section>

      <Section title="La méthode">
        <ListEditor
          label="Étapes de la méthode (3 à 5)"
          items={draft.method}
          onChange={(v) => set("method", v)}
          make={() => ({ title: "", text: "" })}
          addLabel="Ajouter une étape"
          itemLabel={(i) => `Étape ${i + 1}`}
          render={(item, update) => (
            <>
              <TextField label="Titre" value={item.title} onChange={(v) => update({ ...item, title: v })} />
              <TextField label="Texte" value={item.text} onChange={(v) => update({ ...item, text: v })} multiline />
            </>
          )}
        />
      </Section>

      <Section title="Tuteur IA et prévente">
        <TextField
          label="Lien du tuteur IA"
          value={draft.tutorUrl ?? ""}
          onChange={(v) => set("tutorUrl", v)}
          placeholder="https://…"
          help="Laisser vide tant que le tuteur n'est pas prêt : le bouton n'apparaît pas."
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <TextField label="Texte du bouton de prévente" value={draft.presale.label} onChange={(v) => set("presale", { ...draft.presale, label: v })} />
          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="presale-available"
              checked={draft.presale.available}
              onCheckedChange={(v) => set("presale", { ...draft.presale, available: v === true })}
            />
            <Label htmlFor="presale-available" className="font-normal">
              Prévente ouverte (sinon : « bientôt disponible »)
            </Label>
          </div>
        </div>
      </Section>

      <Section title="Modules">
        {modules.length > 0 && (
          <ol className="divide-y rounded-md border">
            {modules.map((m, i) => (
              <ChildRow
                key={m.id}
                href={`/admin/modules/${m.id}`}
                index={m.position}
                title={m.title}
                meta={`${m.availability === "open" ? "Ouvert" : "À venir"} · ${m.slug}`}
                status={m.status}
                first={i === 0}
                last={i === modules.length - 1}
                onMove={(d) => run(() => move("modules", m.id, d))}
                onDelete={() =>
                  window.confirm(`Supprimer le module « ${m.title} » et toutes ses étapes ? Cette action est définitive.`) &&
                  run(() => deleteRow("modules", m.id), "Module supprimé.")
                }
              />
            ))}
          </ol>
        )}
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!moduleTitle.trim()) return;
            run(() => createModule(formation.id, moduleTitle.trim()), "Module créé, en brouillon.", (d) => d && router.push(`/admin/modules/${d.id}`));
          }}
        >
          <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Titre du nouveau module" aria-label="Titre du nouveau module" className="bg-card" />
          <Button type="submit" variant="outline" disabled={pending || !moduleTitle.trim()}>
            <PlusIcon /> Ajouter un module
          </Button>
        </form>
      </Section>

      <DiagnosticSection formationId={formation.id} diagnostic={diagnostic} />

      <Section title="Supprimer la formation" className="border-destructive/30">
        <p className="text-sm text-muted-foreground">Supprime la formation, ses modules, ses étapes et son diagnostic. Cette action est définitive.</p>
        <Button
          variant="outline"
          className="text-destructive"
          disabled={pending}
          onClick={() => {
            const typed = window.prompt(`Pour confirmer, tapez le titre exact : ${formation.title}`);
            if (typed !== formation.title) return;
            run(() => deleteRow("formations", formation.id), "Formation supprimée.", () => router.push("/admin"));
          }}
        >
          Supprimer la formation
        </Button>
      </Section>

      <SaveBar dirty={dirty} pending={pending} onSave={save} />
    </div>
  );
}

function DiagnosticSection({ formationId, diagnostic }: { formationId: string; diagnostic: { config: unknown; status: PublicationStatus } | null }) {
  const { run, pending } = useAction();
  const initial = diagnostic ? JSON.stringify(diagnostic.config, null, 2) : "";
  const [text, setText] = React.useState(initial);
  const [valid, setValid] = React.useState(true);
  const status = diagnostic?.status ?? "draft";
  return (
    <Section title="Diagnostic" aside={diagnostic ? <StatusBadge status={status} /> : null}>
      <p className="text-sm text-muted-foreground">
        Questions, calcul du score et recommandations, au format JSON (mode avancé). Demandez à Claude de le rédiger ou
        de le modifier si besoin.
      </p>
      <JsonField label="Configuration du diagnostic" value={text} onChange={(v, ok) => (setText(v), setValid(ok))} rows={14} />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={pending || !valid || !text.trim() || text === initial} onClick={() => run(() => saveDiagnostic(formationId, JSON.parse(text), status), "Diagnostic enregistré.")}>
          Enregistrer le diagnostic
        </Button>
        {diagnostic && (
          <Button
            variant="ghost"
            disabled={pending || text !== initial}
            onClick={() => run(() => saveDiagnostic(formationId, diagnostic.config, status === "published" ? "draft" : "published"), status === "published" ? "Diagnostic retiré du site." : "Diagnostic publié.")}
          >
            {status === "published" ? "Repasser en brouillon" : "Publier le diagnostic"}
          </Button>
        )}
      </div>
    </Section>
  );
}
