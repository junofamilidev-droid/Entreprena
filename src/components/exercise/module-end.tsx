"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AwardIcon, PrinterIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPoints } from "@/lib/exercise/self-review";
import { saveInput, saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ModuleEndContent } from "@/lib/content/types";

export function ModuleEnd({
  progressKey,
  reviewKey,
  reviewHref,
  stepTitle,
  moduleLabel,
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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur print:hidden">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter">
            <Link href={exitHref}>
              <XIcon />
            </Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-caption text-muted-foreground">{moduleLabel}</p>
            <p className="truncate text-sm font-medium">{stepTitle}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[64ch] flex-1 flex-col justify-center gap-6 px-5 py-14">
        {!ready ? null : !result ? (
          <>
            <h1 className="text-title">{content.title}</h1>
            <p className="text-lead text-muted-foreground">
              L&apos;attestation s&apos;obtient après l&apos;auto-correction de votre feuille de travail.
            </p>
            <div>
              <Button asChild size="lg">
                <Link href={reviewHref}>Faire l&apos;auto-correction</Link>
              </Button>
            </div>
          </>
        ) : !passed ? (
          <>
            <h1 className="text-title">Encore un effort</h1>
            <p className="text-lead text-muted-foreground">
              Votre note : {formatPoints(Number(result.score))} sur 20
              {result.eliminated === "1" ? ", avec un critère éliminatoire" : ""}.
            </p>
            <div className="prose-lesson" dangerouslySetInnerHTML={{ __html: content.retry }} />
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={reviewHref}>Revoir l&apos;auto-correction</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={exitHref}>Revenir au module</Link>
              </Button>
            </div>
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
              <Input
                id="nom"
                value={name}
                autoComplete="name"
                onChange={(e) => saveInput(progressKey, "nom", e.target.value)}
                className="bg-card"
              />
            </div>
            <article className="print-area space-y-5 rounded-lg border bg-card px-6 py-8 shadow-xs sm:px-10 sm:py-10">
              <AwardIcon className="size-8 text-primary" aria-hidden />
              <p className="text-caption tracking-wide text-muted-foreground uppercase">Attestation · version de test</p>
              <p className="font-serif text-xl leading-relaxed">{text}</p>
              <p className="text-caption text-muted-foreground">{content.notice}</p>
            </article>
            <div className="flex flex-wrap gap-3 print:hidden">
              <Button size="lg" variant="outline" onClick={() => window.print()} disabled={!name.trim()}>
                <PrinterIcon /> Imprimer ou PDF
              </Button>
              <Button size="lg" onClick={finish}>
                Terminer le module
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
