"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckIcon, ExternalLinkIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/auth/session";
import { FILES_BUCKET, filesBase, filesPrefix, requiredFiles } from "@/lib/sessions/files";
import type { Session } from "@/lib/sessions/types";

interface Stored {
  name: string;
  size: number;
}

function size(n: number) {
  return n < 1024 ? `${n} o` : n < 1024 * 1024 ? `${Math.round(n / 1024)} Ko` : `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

// Fichiers de la session : ceux que citent les blocs (défi, outil), téléversés sous leur nom exact.
export function SessionFiles({ session }: { session: Session }) {
  const prefix = filesPrefix(session);
  const [stored, setStored] = React.useState<Stored[] | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    const { data, error } = await supabase().storage.from(FILES_BUCKET).list(prefix, { limit: 100 });
    if (error) return toast.error(`Lecture des fichiers impossible : ${error.message}`);
    setStored((data ?? []).filter((f) => f.id !== null).map((f) => ({ name: f.name, size: Number(f.metadata?.size ?? 0) })));
  }, [prefix]);

  React.useEffect(() => {
    // Lecture de la liste au chargement : la mise à jour arrive par une promesse, pas pendant le rendu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function upload(name: string, file: File) {
    setBusy(name);
    const { error } = await supabase()
      .storage.from(FILES_BUCKET)
      .upload(`${prefix}/${name}`, file, { upsert: true, contentType: file.type || undefined });
    setBusy(null);
    if (error) return toast.error(`Téléversement impossible : ${error.message}`);
    toast.success(`${name} téléversé.`);
    void refresh();
  }

  async function remove(name: string) {
    if (!window.confirm(`Supprimer le fichier « ${name} » ?`)) return;
    const { error } = await supabase().storage.from(FILES_BUCKET).remove([`${prefix}/${name}`]);
    if (error) return toast.error(`Suppression impossible : ${error.message}`);
    void refresh();
  }

  const needed = requiredFiles(session);
  const extra = (stored ?? []).filter((f) => !needed.some((n) => n.name === f.name));

  return (
    <div className="space-y-3">
      {needed.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun bloc de cette session ne cite de fichier.</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {needed.map((n) => {
            const file = stored?.find((f) => f.name === n.name);
            return (
              <li key={n.name} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-sm">{n.name}</span>
                  <span className="block text-caption text-muted-foreground">
                    {n.usage} ·{" "}
                    {stored === null ? (
                      "…"
                    ) : file ? (
                      <span className="text-success">
                        <CheckIcon className="inline size-3" aria-hidden /> en ligne, {size(file.size)}
                      </span>
                    ) : (
                      <span className="font-medium text-warning">manquant : l&apos;apprenant ne pourra pas le télécharger</span>
                    )}
                  </span>
                </span>
                {file && (
                  <Button asChild variant="ghost" size="icon-sm" aria-label={`Ouvrir ${n.name}`}>
                    <a href={`${filesBase(session)}/${encodeURIComponent(n.name)}`} target="_blank" rel="noreferrer">
                      <ExternalLinkIcon />
                    </a>
                  </Button>
                )}
                <Button asChild variant={file ? "outline" : "default"} size="sm" disabled={busy === n.name}>
                  <label className="cursor-pointer">
                    <UploadIcon /> {busy === n.name ? "Envoi…" : file ? "Remplacer" : "Téléverser"}
                    <input
                      type="file"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        e.target.value = "";
                        if (f) void upload(n.name, f);
                      }}
                    />
                  </label>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
      {extra.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-caption text-muted-foreground">Fichiers en ligne que plus aucun bloc ne cite :</p>
          <ul className="divide-y rounded-md border">
            {extra.map((f) => (
              <li key={f.name} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{f.name}</span>
                <Button variant="ghost" size="icon-sm" onClick={() => remove(f.name)} aria-label={`Supprimer ${f.name}`}>
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-caption text-muted-foreground">
        Le fichier choisi est enregistré sous le nom attendu par la session, quel que soit son nom sur votre ordinateur.
      </p>
    </div>
  );
}
