import { LessonReader } from "./lesson-reader";
import { StepPlaceholder } from "./step-placeholder";
import { ExerciseRunner } from "@/components/exercise/exercise-runner";
import { ModuleEnd } from "@/components/exercise/module-end";
import { SelfReviewRunner } from "@/components/exercise/self-review";
import type { ExerciseContent, LessonContent, ModuleEndContent, ModuleWithSteps, SelfReviewContent } from "@/lib/content/types";

type Step = ModuleWithSteps["steps"][number];

// Affiche une étape avec le bon lecteur selon son type. Sert au site et à l'aperçu de
// l'espace réservé, qui passe ses propres adresses et sa propre clé de progression.
export function StepView({
  steps,
  index,
  moduleLabel,
  tutorUrl,
  keyPrefix,
  hrefOf,
  exitHref,
}: {
  steps: Step[];
  index: number;
  moduleLabel: string;
  tutorUrl: string | null;
  /** « formation/module » : la progression de l'étape est rangée sous « formation/module/étape ». */
  keyPrefix: string;
  hrefOf: (step: Step) => string;
  exitHref: string;
}) {
  const current = steps[index];
  const after = steps[index + 1];
  const next = after ? { href: hrefOf(after), title: after.title } : null;
  const keyOf = (stepSlug: string) => `${keyPrefix}/${stepSlug}`;
  const common = { stepTitle: current.title, moduleLabel, exitHref };

  if (current.kind === "lesson") {
    return <LessonReader {...common} progressKey={keyOf(current.slug)} content={current.content as unknown as LessonContent} next={next} />;
  }
  const exercise = current.content as unknown as Partial<ExerciseContent>;
  if (current.kind === "exercise" && exercise.parts?.length) {
    return <ExerciseRunner {...common} progressKey={keyOf(current.slug)} content={exercise as ExerciseContent} next={next} tutorUrl={tutorUrl} />;
  }
  const review = current.content as unknown as Partial<SelfReviewContent>;
  const reviewed = review.exerciseStep ? steps.find((s) => s.slug === review.exerciseStep) : undefined;
  if (current.kind === "self_review" && review.criteria && reviewed) {
    return (
      <SelfReviewRunner
        {...common}
        progressKey={keyOf(current.slug)}
        exerciseKey={keyOf(reviewed.slug)}
        exerciseHref={hrefOf(reviewed)}
        content={review as SelfReviewContent}
        exercise={reviewed.content as unknown as ExerciseContent}
        next={next}
      />
    );
  }
  const end = current.content as unknown as Partial<ModuleEndContent>;
  const reviewStep = end.reviewStep ? steps.find((s) => s.slug === end.reviewStep) : undefined;
  if (current.kind === "module_end" && end.template && reviewStep) {
    return <ModuleEnd {...common} progressKey={keyOf(current.slug)} reviewKey={keyOf(reviewStep.slug)} reviewHref={hrefOf(reviewStep)} content={end as ModuleEndContent} />;
  }
  return <StepPlaceholder {...common} next={next} />;
}
