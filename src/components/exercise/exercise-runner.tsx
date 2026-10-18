"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { WhereSaved } from "@/components/auth/where-saved";
import { ReaderFrame, StepComplete } from "@/components/reader/reader-frame";
import { stepMinutes } from "@/components/platform/module-progress";
import { saveInput, saveStep, useProgress, useProgressReady } from "@/lib/progress/store";
import type { ExerciseContent, ExerciseValue } from "@/lib/content/types";
import type { StepLink } from "@/components/reader/lesson-reader";
import { ExerciseBlockView, type BlockContext } from "./blocks";

// Exercice : un écran de mission, puis une partie par écran, dans le même cadre que les autres étapes.
// Les saisies sont enregistrées à chaque frappe, avec la progression de l'apprenant.
export function ExerciseRunner({
  progressKey,
  content,
  exitHref,
  next,
  tutorUrl,
}: {
  progressKey: string;
  stepTitle: string;
  moduleLabel: string;
  content: ExerciseContent;
  exitHref: string;
  next: StepLink | null;
  tutorUrl: string | null;
}) {
  const router = useRouter();
  const ready = useProgressReady();
  const progress = useProgress();
  const saved = progress[progressKey];
  const total = content.parts.length + 1;

  const [index, setIndex] = React.useState<number | null>(null);
  const [completed, setCompleted] = React.useState(false);

  // Reprise à la partie quittée, même après la fin (l'apprenant revient relire son livrable).
  const current = index ?? (ready && saved ? Math.min(saved.screen, total - 1) : 0);
  const part = current === 0 ? null : content.parts[current - 1];
  const last = current === total - 1;

  const ctx: BlockContext = {
    content,
    inputs: saved?.inputs ?? {},
    setInput: (id: string, value: ExerciseValue) => saveInput(progressKey, id, value),
  };

  const goTo = React.useCallback(
    (target: number) => {
      const t = Math.min(Math.max(target, 0), total - 1);
      if (t === current) return;
      setIndex(t);
      saveStep(progressKey, { screen: t });
      window.scrollTo({ top: 0 });
    },
    [current, total, progressKey],
  );

  function finish() {
    saveStep(progressKey, { done: true });
    setCompleted(true);
    window.scrollTo({ top: 0 });
  }

  if (completed) {
    return (
      <ReaderFrame
        exitHref={exitHref}
        progress={100}
        onBack={() => setCompleted(false)}
        primary={
          next
            ? { label: "Passer à l'étape suivante", onClick: () => router.push(next.href) }
            : { label: "Revenir au module", onClick: () => router.push(exitHref) }
        }
      >
        <StepComplete
          learned={
            <p>
              Votre travail est enregistré dans cette étape : vous pouvez y revenir à tout moment pour relire ou
              compléter votre livrable.
            </p>
          }
          next={next}
        />
      </ReaderFrame>
    );
  }

  return (
    <ReaderFrame
      exitHref={exitHref}
      progress={((current + 1) / total) * 100}
      wide
      onBack={current > 0 ? () => goTo(current - 1) : undefined}
      onNext={!last ? () => goTo(current + 1) : undefined}
      primary={
        last
          ? { label: saved?.done ? "Terminer l'étape" : "Déposer mon travail", onClick: finish }
          : { label: current === 0 ? "Commencer" : "Continuer", onClick: () => goTo(current + 1) }
      }
    >
      <div className="space-y-8">
        {part === null ? (
          <>
            <div className="space-y-3">
              {stepMinutes(content.duration) && <p className="text-sm text-muted-foreground">{stepMinutes(content.duration)}</p>}
              <h1 className="text-title text-balance">{content.intro.title}</h1>
            </div>
            {content.intro.blocks.map((b, i) => (
              <ExerciseBlockView key={i} block={b} ctx={ctx} />
            ))}
            <p className="text-sm text-subtle-foreground">
              Au fur et à mesure : <WhereSaved subject="vos saisies sont" />
            </p>
          </>
        ) : (
          <>
            <div className="space-y-3">
              {part.duration && <p className="text-sm text-muted-foreground">{part.duration}</p>}
              <h1 className="text-title text-balance">{part.title}</h1>
              {part.lead && <p className="max-w-[66ch] text-lead text-muted-foreground">{part.lead}</p>}
            </div>
            {part.blocks.map((b, i) => (
              <ExerciseBlockView key={i} block={b} ctx={ctx} />
            ))}
          </>
        )}
        {tutorUrl && (
          <p className="border-t pt-6 text-sm text-muted-foreground">
            Besoin d&apos;un indice ?{" "}
            <a href={tutorUrl} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-4">
              Ouvrir le tuteur IA
            </a>
          </p>
        )}
      </div>
    </ReaderFrame>
  );
}
