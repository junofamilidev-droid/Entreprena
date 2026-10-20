"use client";

import Link from "next/link";
import { AlertTriangleIcon, DownloadIcon, FileSpreadsheetIcon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PromptBlock } from "@/components/reader/prompt-block";
import { useProgress, useProgressReady } from "@/lib/progress/store";
import { recordDownload, useDownloads } from "@/lib/sessions/downloads";
import type { FicheBlock, OutilBlock, PromptBlock as PromptData } from "@/lib/sessions/types";

interface Entry<T> {
  block: T;
  sessionKey: string;
  sessionLabel: string;
  href: string;
  fileUrl?: string;
}

function Locked({ href, label }: { href: string; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <LockIcon className="size-3.5" aria-hidden /> S&apos;obtient en terminant la{" "}
      <Link href={href} className="text-primary hover:underline">
        {label.replace(/^Module \d+ · /, "")}
      </Link>
    </p>
  );
}

// Ce que l'apprenant a gagné en faisant les sessions : outils, fiches juste-à-temps, prompts.
// Un élément se débloque quand sa session est terminée.
export function ToolboxView({ tools, fiches, prompts }: { tools: Entry<OutilBlock>[]; fiches: Entry<FicheBlock>[]; prompts: Entry<PromptData>[] }) {
  const ready = useProgressReady();
  const progress = useProgress();
  const downloads = useDownloads();
  const unlocked = (key: string) => Boolean(progress[key]?.done);
  const got = [...tools, ...fiches].filter((e) => unlocked(e.sessionKey)).length;
  const total = tools.length + fiches.length;

  if (total + prompts.length === 0) return null;
  return (
    <div className={cn("space-y-12", !ready && "invisible")}>
      {total > 0 && (
        <p className="text-sm text-muted-foreground tabular-nums">
          {got} sur {total} obtenu{got > 1 ? "s" : ""}
        </p>
      )}

      {tools.length > 0 && (
        <section aria-labelledby="outils" className="space-y-3">
          <h2 id="outils" className="text-heading">
            Outils
          </h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {tools.map((t) => {
              const open = unlocked(t.sessionKey);
              const done = downloads.find((d) => d.name === t.block.fichier);
              return (
                <li key={t.sessionKey + t.block.fichier} className={cn("space-y-3 rounded-xl border bg-card p-5", !open && "bg-muted/30")}>
                  <div className="flex items-start gap-3">
                    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", open ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <FileSpreadsheetIcon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{t.block.fichier}</span>
                      <span className="block text-sm text-muted-foreground">{t.block.description}</span>
                    </span>
                  </div>
                  {open ? (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <a
                        href={t.fileUrl}
                        download
                        onClick={() => recordDownload({ name: t.block.fichier, href: t.fileUrl ?? "", source: t.sessionLabel }, downloads)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                      >
                        <DownloadIcon className="size-4" aria-hidden /> Télécharger
                      </a>
                      {done && (
                        <span className="text-caption text-muted-foreground">
                          Téléchargé le {new Date(Number(done.at)).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Locked href={t.href} label={t.sessionLabel} />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {fiches.length > 0 && (
        <section aria-labelledby="fiches" className="space-y-3">
          <h2 id="fiches" className="text-heading">
            Fiches juste-à-temps
          </h2>
          <p className="text-sm text-muted-foreground">À consulter en pleine mission, sans relire la session.</p>
          <ul className="space-y-3">
            {fiches.map((f) =>
              unlocked(f.sessionKey) ? (
                <li key={f.sessionKey + f.block.titre}>
                  <details className="group rounded-xl border bg-card p-5 open:shadow-sm">
                    <summary className="cursor-pointer list-none font-semibold">
                      {f.block.titre}
                      <span className="mt-0.5 block text-caption font-normal text-muted-foreground">{f.sessionLabel}</span>
                    </summary>
                    <ol className="mt-4 space-y-2 text-body">
                      {f.block.etapes.map((e, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="font-semibold text-primary tabular-nums">{i + 1}.</span>
                          {e}
                        </li>
                      ))}
                    </ol>
                    {f.block.pieges.length > 0 && (
                      <div className="mt-4 rounded-lg bg-warning/10 p-4 text-sm">
                        <p className="flex items-center gap-2 font-semibold">
                          <AlertTriangleIcon className="size-4 text-warning" aria-hidden /> Pièges
                        </p>
                        <ul className="mt-2 space-y-1 text-muted-foreground">
                          {f.block.pieges.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </details>
                </li>
              ) : (
                <li key={f.sessionKey + f.block.titre} className="rounded-xl border bg-muted/30 p-5">
                  <p className="font-semibold text-muted-foreground">{f.block.titre}</p>
                  <div className="mt-1">
                    <Locked href={f.href} label={f.sessionLabel} />
                  </div>
                </li>
              ),
            )}
          </ul>
        </section>
      )}

      {prompts.length > 0 && (
        <section aria-labelledby="prompts" className="space-y-3">
          <h2 id="prompts" className="text-heading">
            Prompts des sessions
          </h2>
          <div className="space-y-4">
            {prompts.map((p, i) => (
              <div key={i} className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  <Link href={p.href} className="text-primary hover:underline">
                    {p.sessionLabel}
                  </Link>
                </p>
                <PromptBlock title={p.block.usage} note={null} text={p.block.texte} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
