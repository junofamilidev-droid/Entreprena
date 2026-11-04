"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CopyIcon, EyeIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { deleteSession, saveSession, setSessionStatus } from "@/lib/admin/session-actions";
import { panneauLabel, type AtelierSession } from "@/lib/sessions/atelier";
import { parseSessionFile } from "@/lib/sessions/validate";
import type { PublicationStatus } from "@/lib/content/types";
import { Crumbs, SaveBar, Section, StatusBadge, useAction } from "./kit";
import { FormatErrors } from "./session-import";
import { SessionFiles } from "./session-files";

// Session au format « atelier » dans l'espace réservé : statut, aperçu, fichiers, et contenu
// modifiable en JSON (le format atelier se rédige en fichier, pas bloc par bloc).
export function AtelierAdmin({
  id,
  status,
  content,
  moduleInfo,
}: {
  id: string;
  status: PublicationStatus;
  content: AtelierSession;
  moduleInfo: { id: string; title: string; position: number; formationId: string; formationTitle: string };
}) {
  const router = useRouter();
  const { run, pending } = useAction();
  const original = React.useMemo(() => JSON.stringify(content, null, 2), [content]);
  const [text, setText] = React.useState(original);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saving, start] = React.useTransition();
  const dirty = text !== original;
  const published = status === "published";

  function save() {
    const r = parseSessionFile(text);
    if (!r.ok) return setErrors(r.errors);
    setErrors([]);
    start(async () => {
      const res = await saveSession(id, JSON.parse(text));
      if (!res.ok) return setErrors(res.error.split("\n"));
      toast.success("Session enregistrée.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Crumbs
        items={[
          { label: "Espace réservé", href: "/admin" },
          { label: moduleInfo.formationTitle, href: `/admin/formations/${moduleInfo.formationId}` },
          { label: `Module ${moduleInfo.position}`, href: `/admin/modules/${moduleInfo.id}` },
          { label: `Session ${content.session}` },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {moduleInfo.title} · session {content.session} · {content.duree_min} min · format atelier
          </p>
          <h1 className="text-title">{content.titre}</h1>
          <StatusBadge status={status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/admin/apercu-session/${id}`} target="_blank">
              <EyeIcon /> Aperçu
            </Link>
          </Button>
          <Button
            variant={published ? "outline" : "default"}
            disabled={pending || dirty}
            title={dirty ? "Enregistrez d'abord vos modifications" : undefined}
            onClick={() => run(() => setSessionStatus(id, published ? "draft" : "published"), published ? "Session retirée du site." : "Session publiée.")}
          >
            {published ? "Repasser en brouillon" : "Publier"}
          </Button>
        </div>
      </div>

      <Section title="Étapes">
        <ol className="divide-y rounded-md border">
          {content.etapes.map((e, i) => (
            <li key={i} className="flex items-center gap-3 px-3 py-2.5">
              <span className="w-6 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.titre}</span>
                <span className="block truncate text-caption text-muted-foreground">{e.objectif}</span>
              </span>
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-caption">{panneauLabel[e.panneau.type]}</span>
            </li>
          ))}
        </ol>
        <p className="text-caption text-muted-foreground">
          Tuteur : {content.tuteur.nom}, {content.tuteur.role}. Mission : {content.mission.expediteur}.
        </p>
      </Section>

      <Section title="Fichiers">
        <SessionFiles session={content} />
      </Section>

      <Section
        title="Contenu (JSON)"
        aside={
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(text);
              toast.success("JSON copié.");
            }}
          >
            <CopyIcon /> Copier le JSON
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          Modifiez le texte puis enregistrez : le format est vérifié avant l&apos;enregistrement. Pour une refonte, réimportez plutôt le
          fichier complet.
        </p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={24}
          spellCheck={false}
          aria-label="Contenu JSON de la session"
          className="bg-card font-mono text-[0.8125rem]"
        />
      </Section>

      <Section title="Supprimer la session" className="border-destructive/30">
        <Button
          variant="outline"
          className="text-destructive"
          onClick={() =>
            window.confirm(`Supprimer définitivement la session ${content.session} « ${content.titre} » ?`) &&
            run(() => deleteSession(id), "Session supprimée.", () => router.push(`/admin/modules/${moduleInfo.id}`))
          }
        >
          <Trash2Icon /> Supprimer
        </Button>
      </Section>

      {errors.length > 0 && <FormatErrors errors={errors} />}
      <SaveBar dirty={dirty} pending={saving} onSave={save} />
    </div>
  );
}
