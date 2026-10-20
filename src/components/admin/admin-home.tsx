"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3Icon, DownloadIcon, FileJsonIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createFormation, importFromFiles } from "@/lib/admin/actions";
import { Section, StatusBadge, useAction } from "./kit";

export function AdminHome({
  formations,
}: {
  formations: { id: string; slug: string; title: string; status: "draft" | "published"; modules: number }[];
}) {
  const router = useRouter();
  const { run, pending } = useAction();
  const [title, setTitle] = React.useState("");

  return (
    <div className="space-y-6 pb-12">
      <div className="space-y-2">
        <h1 className="text-title">Espace réservé</h1>
        <p className="text-body text-muted-foreground">
          Créez et modifiez les formations, leurs modules et leurs étapes. Un élément en brouillon n&apos;est visible
          que d&apos;ici ; publiez-le pour l&apos;afficher sur le site.
        </p>
      </div>

      <Section title="Formations">
        {formations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune formation dans la base pour l&apos;instant : le site n&apos;affiche rien. Importez le contenu initial ci-dessous.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {formations.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-3 py-3">
                <Link href={`/admin/formations/${f.id}`} className="min-w-0 flex-1 hover:underline">
                  <span className="block truncate font-medium">{f.title}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {f.modules} module{f.modules > 1 ? "s" : ""} · /formations/{f.slug}
                  </span>
                </Link>
                <StatusBadge status={f.status} />
              </li>
            ))}
          </ul>
        )}
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            run(() => createFormation(title.trim()), "Formation créée, en brouillon.", (d) => d && router.push(`/admin/formations/${d.id}`));
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de la nouvelle formation" aria-label="Titre de la nouvelle formation" className="bg-card" />
          <Button type="submit" variant="outline" disabled={pending || !title.trim()}>
            <PlusIcon /> Créer une formation
          </Button>
        </form>
      </Section>

      <Section title="Sessions en blocs">
        <p className="text-sm text-muted-foreground">
          Collez le fichier JSON d&apos;une session : il est vérifié, prévisualisé, puis publié dans son module.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/sessions/importer">
              <FileJsonIcon /> Importer une session (JSON)
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/mesure">
              <BarChart3Icon /> Mesure des sessions
            </Link>
          </Button>
        </div>
      </Section>

      <Section title="Importer le contenu initial">
        <p className="text-sm text-muted-foreground">
          Le site affiche uniquement le contenu de la base. Ce bouton y copie une fois le contenu de départ rédigé dans
          les fichiers du projet (dossier content/). Les éléments déjà présents avec le même identifiant sont remplacés ;
          rien n&apos;est supprimé.
        </p>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!window.confirm("Remplacer le contenu de la base par celui des fichiers, pour les éléments communs ?")) return;
            run(importFromFiles, undefined, (d) => d && toast.success(`Import terminé : ${d.formations} formation(s), ${d.modules} module(s), ${d.steps} étape(s).`));
          }}
        >
          <DownloadIcon /> {pending ? "Import…" : "Importer le contenu initial"}
        </Button>
      </Section>
    </div>
  );
}
