import Link from "next/link";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StepLink } from "./lesson-reader";

// Étape dont le contenu n'est pas encore rédigé (exercice, auto-correction, fin de module).
export function StepPlaceholder({
  stepTitle,
  moduleLabel,
  exitHref,
  next,
}: {
  stepTitle: string;
  moduleLabel: string;
  exitHref: string;
  next: StepLink | null;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Quitter">
            <Link href={exitHref}><XIcon /></Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-caption text-muted-foreground">{moduleLabel}</p>
            <p className="truncate text-sm font-medium">{stepTitle}</p>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[64ch] flex-1 flex-col justify-center gap-4 px-5 py-16">
        <h1 className="text-title">{stepTitle}</h1>
        <p className="text-lead text-muted-foreground">
          Cette étape est en cours de construction. Elle arrivera dans une prochaine version de test.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          {next && (
            <Button asChild size="lg"><Link href={next.href}>Voir l&apos;étape suivante</Link></Button>
          )}
          <Button asChild size="lg" variant="outline"><Link href={exitHref}>Revenir au module</Link></Button>
        </div>
      </main>
    </div>
  );
}
