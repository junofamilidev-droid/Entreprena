"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AwardIcon, PrinterIcon } from "lucide-react";
import { ReaderFrame } from "@/components/reader/reader-frame";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPoints } from "@/lib/exercise/self-review";
import { saveInput, saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ModuleEndContent } from "@/lib/content/types";

export function ModuleEnd({
  progressKey,
  reviewKey,
  reviewHref,
  content,
  exitHref,
}: {
  progressKey: string;
  reviewKey: string;
  reviewHref: string;
  stepTitle: string;
  moduleLabel: string;
  content: ModuleEndContent;
  exitHref: string;
}) {
  const router = useRouter();
  const ready = useProgressReady();
  const progress = useProgress();
  const result = progress[reviewKey]?.inputs?.result as Record<string, string> | undefined;
  const saved = progress[progressKey];
  const name = typeof saved?.inputs?.nom === "string" ? saved.inputs.nom : "";

  const passed = result?.passed === "1";
  const date = result ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(result.date)) : "";
  const text = content.template
    .replace("{nom}", name.trim() || "[Prénom Nom]")
    .replace("{date}", date)
    .replace("{note}", result ? formatPoints(Number(result.score)) : "");

  function finish() {
    saveStep(progressKey, { done: true });
    router.push(exitHref);
  }

  const primary = !ready
    ? null
    : !result
      ? { label: "Faire l'auto-correction", onClick: () => router.push(reviewHref) }
      : !passed
        ? { label: "Revoir l'auto-correction", onClick: () => router.push(reviewHref) }
        : { label: "Terminer le module", onClick: finish };

  return (
    <ReaderFrame exitHref={exitHref} progress={passed ? 100 : 0} primary={primary}>
      <div className="space-y-6">
        {!ready ? null : !result ? (
          <>
            <h1 className="text-title">{content.title}</h1>
            <p className="text-lead text-muted-foreground">
              L&apos;attestation s&apos;obtient après l&apos;auto-correction de votre feuille de travail.
            </p>
          </>
        ) : !passed ? (
          <>
            <h1 className="text-title">Encore un effort</h1>
            <p className="text-lead text-muted-foreground">
              Votre note : {formatPoints(Number(result.score))} sur 20
              {result.eliminated === "1" ? ", avec un critère éliminatoire" : ""}.
            </p>
            <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: content.retry }} />
          </>
        ) : (
          <>
            <div className="space-y-3 print:hidden">
              <h1 className="text-title">{content.title}</h1>
              <p className="text-lead text-muted-foreground">
                Module validé avec {formatPoints(Number(result.score))} sur 20. Indiquez votre nom tel qu&apos;il doit
                figurer sur l&apos;attestation.
              </p>
            </div>
            <div className="space-y-2 print:hidden">
              <Label htmlFor="nom" className="text-base font-semibold">
                Prénom et nom
              </Label>
              <Input id="nom" value={name} autoComplete="name" onChange={(e) => saveInput(progressKey, "nom", e.target.value)} />
            </div>
            <article className="print-area space-y-5 border-y-2 border-foreground px-1 py-8">
              <AwardIcon className="size-8 text-brand" aria-hidden />
              <p className="text-sm text-muted-foreground">Attestation, version de test</p>
              <p className="text-xl leading-relaxed">{text}</p>
              <p className="text-caption text-muted-foreground">{content.notice}</p>
            </article>
            <div className="print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                disabled={!name.trim()}
                className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-brand underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PrinterIcon className="size-4" aria-hidden /> Imprimer ou enregistrer en PDF
              </button>
            </div>
          </>
        )}
      </div>
    </ReaderFrame>
  );
}
