"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, AwardIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPoints } from "@/lib/exercise/self-review";
import { saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ModuleEndContent } from "@/lib/content/types";
import { DrawCheck } from "@/components/motion/draw-check";

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

  const passed = result?.passed === "1";

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
            <div className="space-y-3">
              <span className="grid size-14 place-items-center rounded-full bg-primary text-primary-foreground">
                <DrawCheck className="size-7" delay={0.15} />
              </span>
              <h1 className="text-title">Module validé</h1>
              <p className="text-lead text-muted-foreground">
                {moduleLabel} : votre feuille de travail est notée {formatPoints(Number(result.score))} sur 20.
              </p>
            </div>
            <Link
              href="/certificat"
              className="group flex items-center gap-4 rounded-lg border bg-card px-5 py-4 transition-colors hover:bg-muted/60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                <AwardIcon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">Un pas de plus vers votre certificat</span>
                <span className="block text-sm text-muted-foreground">
                  Le certificat de la formation se dévoile à chaque module validé.
                </span>
              </span>
              <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <p className="text-caption text-muted-foreground">{content.notice}</p>
            <div>
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
