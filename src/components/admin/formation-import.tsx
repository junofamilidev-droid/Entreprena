"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2Icon, LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importFormation } from "@/lib/admin/session-actions";
import { parseFormationFile, type FormationFile } from "@/lib/sessions/formation-format";
import { requiredFiles } from "@/lib/sessions/files";
import { unmark } from "@/components/ui/marked";
import { Crumbs, Section } from "./kit";
import { FormatErrors } from "./session-import";

export function FormationImport() {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [checked, setChecked] = React.useState<{ errors: string[] } | { file: FormationFile } | null>(null);
  const [pending, start] = React.useTransition();

  function check() {
    const r = parseFormationFile(text);
    setChecked(r.ok ? { file: r.file } : { errors: r.errors });
  }

  function save(publish: boolean) {
    start(async () => {
      const r = await importFormation(text, publish);
      if (!r.ok) return setChecked({ errors: r.error.split("\n") });
      const d = r.data!;
      toast.success(
        `Formation ${d.created ? "créée" : "mise à jour"}${publish ? " et publiée" : ", en brouillon"} : ${d.modules} module(s), ${d.sessions} session(s).`,
      );
      if (d.untouched.length)
        toast.info(`Modules déjà en place et absents du fichier, laissés tels quels : ${d.untouched.join(", ")}.`, { duration: 10000 });
      router.push(`/admin/formations/${d.id}`);
    });
  }

  const file = checked && "file" in checked ? checked.file : null;
  const files = file?.sessions.flatMap((s) => requiredFiles(s).map((f) => `${s.module} · session ${s.session} : ${f.name}`)) ?? [];

  return (
    <div className="space-y-6 pb-12">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Importer une formation" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Importer une formation (JSON)</h1>
        <p className="text-body text-muted-foreground">
          Collez le fichier préparé par Claude : la fiche de la formation, ses modules et, si le fichier en contient, ses sessions.
          Une formation qui existe déjà (même identifiant) est mise à jour ; rien n&apos;est supprimé.
        </p>
      </div>

      <Section title="1. Collez le fichier">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setChecked(null);
          }}
          rows={14}
          spellCheck={false}
          aria-label="Contenu du fichier JSON de la formation"
          placeholder='{ "formation": { "identifiant": "controleur-gestion-ia", … }, "modules": [ … ], "sessions": [ … ] }'
          className="bg-card font-mono text-[0.8125rem]"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={check} disabled={!text.trim()}>
            Vérifier
          </Button>
          <label className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline">
            ou choisir le fichier .json
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setText(await f.text());
                setChecked(null);
              }}
            />
          </label>
        </div>
        {checked && "errors" in checked && <FormatErrors errors={checked.errors} />}
      </Section>

      {file && (
        <>
          <Section title="2. Vérifiez">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2Icon className="size-4" aria-hidden /> Format valide
            </p>
            <div className="space-y-1">
              <p className="text-heading">{file.formation.titre}</p>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{file.formation.identifiant}</span> · {file.formation.domaine} · {file.formation.public}
              </p>
              <p className="max-w-3xl text-body text-muted-foreground">
                {unmark(file.formation.promesse)} {unmark(file.formation.resume)}
              </p>
            </div>
            <ol className="divide-y rounded-md border">
              {file.modules.map((m, i) => {
                const own = file.sessions.filter((s) => s.module === m.identifiant);
                return (
                  <li key={m.identifiant} className="flex items-center gap-3 px-3 py-2.5">
                    <span className="w-6 shrink-0 text-right font-mono text-sm text-muted-foreground tabular-nums">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{m.titre}</span>
                      <span className="block truncate text-caption text-muted-foreground">
                        <span className="font-mono">{m.identifiant}</span> · {own.length} session{own.length > 1 ? "s" : ""}
                        {own.length > 0 && ` · ${own.reduce((t, s) => t + s.duree_min, 0)} min`}
                      </span>
                    </span>
                    {m.ouvert ? (
                      <span className="text-caption font-medium text-success">Ouvert</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <LockIcon className="size-3" aria-hidden /> À venir
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {files.length > 0 && (
              <div className="text-sm">
                <p className="text-muted-foreground">Fichiers à téléverser ensuite, dans l&apos;éditeur de chaque session :</p>
                <ul className="mt-1 list-disc pl-5 font-mono text-[0.8125rem]">
                  {files.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => save(true)} disabled={pending}>
              {pending ? "Enregistrement…" : "Publier"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => save(false)} disabled={pending}>
              Enregistrer en brouillon
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
