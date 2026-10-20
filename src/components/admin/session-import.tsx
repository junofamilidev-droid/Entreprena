"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SessionPlayer } from "@/components/session/session-player";
import { importSession } from "@/lib/admin/session-actions";
import { filesBase, requiredFiles } from "@/lib/sessions/files";
import { parseSession } from "@/lib/sessions/validate";
import { blockLabel, type Session } from "@/lib/sessions/types";
import { Crumbs, Section } from "./kit";

/** Liste d'erreurs du format, lisible sans connaître le JSON. */
export function FormatErrors({ errors }: { errors: string[] }) {
  return (
    <div role="alert" className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <p className="flex items-center gap-2 font-medium text-destructive">
        <AlertCircleIcon className="size-4" aria-hidden />
        {errors.length === 1 ? "Une erreur à corriger" : `${errors.length} erreurs à corriger`}
      </p>
      <ul className="list-disc space-y-1 pl-6 text-sm">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

/** Aperçu de la session telle que l'apprenant la verra, dans un cadre défilant. */
export function SessionPreviewFrame({ session, exitHref }: { session: Session; exitHref: string }) {
  return (
    <div className="h-[44rem] overflow-y-auto rounded-lg border bg-background shadow-inner">
      <SessionPlayer
        session={session}
        moduleLabel={`Aperçu · ${session.module}`}
        exitHref={exitHref}
        fileBase={filesBase(session)}
        keyPrefix="apercu-"
        measure={false}
        askAiTool={false}
      />
    </div>
  );
}

export function SessionImport() {
  const router = useRouter();
  const [text, setText] = React.useState("");
  const [checked, setChecked] = React.useState<{ errors: string[] } | { session: Session } | null>(null);
  const [pending, start] = React.useTransition();

  function check() {
    const r = parseSession(text);
    setChecked(r.ok ? { session: r.session } : { errors: r.errors });
  }

  function save(publish: boolean) {
    start(async () => {
      const r = await importSession(text, publish);
      if (!r.ok) {
        setChecked({ errors: r.error.split("\n") });
        return;
      }
      toast.success(
        `${r.data?.replaced ? "Session remplacée" : "Session importée"}${publish ? " et publiée" : ", en brouillon"}. Pensez à téléverser ses fichiers.`,
      );
      router.push(`/admin/sessions/${r.data?.id}`);
    });
  }

  const session = checked && "session" in checked ? checked.session : null;

  return (
    <div className="space-y-6 pb-12">
      <Crumbs items={[{ label: "Espace réservé", href: "/admin" }, { label: "Importer une session" }]} />
      <div className="space-y-2">
        <h1 className="text-title">Importer une session (JSON)</h1>
        <p className="text-body text-muted-foreground">
          Collez le fichier de la session, vérifiez-le, regardez l&apos;aperçu, puis publiez. Une session qui existe déjà
          (même module, même numéro) est remplacée.
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
          aria-label="Contenu du fichier JSON de la session"
          placeholder='{ "formation": "auditeur-augmente-ia", "module": "revue-analytique", "session": 1, … }'
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

      {session && (
        <>
          <Section title="2. Vérifiez">
            <p className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2Icon className="size-4" aria-hidden /> Format valide
            </p>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Formation · module</dt>
                <dd className="font-mono">
                  {session.formation} · {session.module}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Session</dt>
                <dd>
                  {session.session} : {session.titre} ({session.duree_min} min)
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">{session.blocs.length} blocs, dans l&apos;ordre</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {session.blocs.map((b, i) => (
                    <span key={i} className="rounded-md border bg-muted/40 px-2 py-0.5 text-caption">
                      {i + 1}. {blockLabel[b.type]}
                    </span>
                  ))}
                </dd>
              </div>
              {requiredFiles(session).length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Fichiers à téléverser après l&apos;import</dt>
                  <dd className="font-mono">{requiredFiles(session).map((f) => f.name).join(", ")}</dd>
                </div>
              )}
            </dl>
          </Section>

          <Section title="3. Aperçu">
            <SessionPreviewFrame session={session} exitHref="/admin/sessions/importer" />
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
