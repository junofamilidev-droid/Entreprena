"use client";

import { useRouter } from "next/navigation";
import type { StepLink } from "./lesson-reader";
import { ReaderFrame } from "./reader-frame";

// Étape dont le contenu n'est pas encore rédigé.
export function StepPlaceholder({
  stepTitle,
  exitHref,
  next,
}: {
  stepTitle: string;
  moduleLabel: string;
  exitHref: string;
  next: StepLink | null;
}) {
  const router = useRouter();
  return (
    <ReaderFrame
      exitHref={exitHref}
      progress={0}
      primary={
        next
          ? { label: "Passer à l'étape suivante", onClick: () => router.push(next.href) }
          : { label: "Revenir au module", onClick: () => router.push(exitHref) }
      }
    >
      <div className="space-y-4 py-8">
        <h1 className="text-title">{stepTitle}</h1>
        <p className="text-lead text-muted-foreground">
          Cette étape est en préparation. Elle arrivera dans une prochaine version de test.
        </p>
      </div>
    </ReaderFrame>
  );
}
