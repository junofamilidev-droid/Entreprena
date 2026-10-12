"use client";

import * as React from "react";
import Link from "next/link";
import { EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setStatus, updateRow } from "@/lib/admin/actions";
import type { LessonContent, ModuleWithSteps } from "@/lib/content/types";
import { kindLabel } from "@/components/platform/module-progress";
import { Crumbs, SaveBar, Section, StatusBadge, TextField, useAction } from "./kit";
import { JsonField } from "./json-field";
import { LessonEditor } from "./lesson-editor";

type Step = ModuleWithSteps["steps"][number];

const ADVANCED_HELP: Record<string, string> = {
  exercise: "Mission, parties et blocs (texte, données à copier, saisies, contrôles, tableau, relecture, livrable).",
  self_review: "Grille, corrigé, critères éliminatoires. L'étape d'exercice corrigée est désignée par son identifiant.",
  module_end: "Texte de l'attestation ({nom}, {date}, {note}) et message si la copie n'est pas validée.",
  quiz: "Questions de vérification.",
};

export function StepEditor({
  step,
  module: mod,
  formation,
}: {
  step: Step;
  module: { id: string; slug: string; title: string; position: number };
  formation: { id: string; slug: string; title: string };
}) {
  const { run, pending } = useAction();
  const saved = { title: step.title, slug: step.slug, content: JSON.stringify(step.content) };
  const [title, setTitle] = React.useState(step.title);
  const [slug, setSlug] = React.useState(step.slug);
  const [content, setContent] = React.useState<unknown>(step.content);
  const [advanced, setAdvanced] = React.useState(step.kind !== "lesson");
  const [jsonText, setJsonText] = React.useState(() => JSON.stringify(step.content, null, 2));
  const [jsonValid, setJsonValid] = React.useState(true);
  const dirty = title !== saved.title || slug !== saved.slug || JSON.stringify(content) !== saved.content;
  const published = step.status === "published";

  function switchMode(next: boolean) {
    if (next) setJsonText(JSON.stringify(content, null, 2));
    else if (!jsonValid) return;
    setAdvanced(next);
  }

  function save() {
    run(() => updateRow("steps", step.id, { title, slug, content }), "Étape enregistrée.");
  }

  return (
    <div className="space-y-6">
      <Crumbs
        items={[
          { label: "Espace réservé", href: "/admin" },
          { label: formation.title, href: `/admin/formations/${formation.id}` },
          { label: `Module ${mod.position}`, href: `/admin/modules/${mod.id}` },
          { label: step.title },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{kindLabel[step.kind]}</p>
          <h1 className="text-title">{step.title}</h1>
          <StatusBadge status={step.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" title={dirty ? "L'aperçu montre la version enregistrée" : undefined}>
            <Link href={`/admin/apercu/${step.id}`} target="_blank">
              <EyeIcon /> Aperçu
            </Link>
          </Button>
          <Button
            variant={published ? "outline" : "default"}
            disabled={pending || dirty}
            title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
            onClick={() => run(() => setStatus("steps", step.id, published ? "draft" : "published"), published ? "Étape retirée du site." : "Étape publiée.")}
          >
            {published ? "Repasser en brouillon" : "Publier l'étape"}
          </Button>
        </div>
      </div>

      <Section title="L'étape">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Titre" value={title} onChange={setTitle} />
          <TextField label="Identifiant dans l'adresse" value={slug} onChange={setSlug} mono help={`/formations/${formation.slug}/${mod.slug}/${slug}`} />
        </div>
      </Section>

      {step.kind === "lesson" && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <Button variant="ghost" size="sm" onClick={() => switchMode(!advanced)} disabled={advanced && !jsonValid}>
            {advanced ? "Revenir au formulaire" : "Mode avancé (JSON)"}
          </Button>
        </div>
      )}

      {advanced ? (
        <Section title="Contenu (mode avancé)">
          <p className="text-sm text-muted-foreground">
            {ADVANCED_HELP[step.kind] ?? ""} Le contenu est au format JSON : modifiez les textes entre guillemets sans
            toucher à la structure, ou demandez à Claude de préparer la modification.
          </p>
          <JsonField
            label="Contenu de l'étape"
            value={jsonText}
            onChange={(v, ok) => {
              setJsonText(v);
              setJsonValid(ok);
              if (ok && v.trim()) setContent(JSON.parse(v));
            }}
            rows={24}
          />
        </Section>
      ) : (
        <LessonEditor value={content as LessonContent} onChange={setContent} />
      )}

      <SaveBar dirty={dirty} pending={pending} onSave={save}>
        {advanced && !jsonValid && <span className="self-center text-sm text-destructive">JSON invalide : corrigez avant d&apos;enregistrer.</span>}
      </SaveBar>
    </div>
  );
}
