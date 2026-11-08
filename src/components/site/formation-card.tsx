import Link from "next/link";
import type { FormationWithModules } from "@/lib/content/types";
import { plain } from "@/lib/vitrine/text";

// Carte d'une formation, générée depuis les données. Disponible : lien vers sa page.
// Pas encore disponible : mention « Prochainement », sans bouton ni formulaire.
export function FormationCard({ formation, available }: { formation: FormationWithModules; available: boolean }) {
  const open = formation.modules.filter((m) => m.availability === "open").length;
  const total = formation.modules.length;
  return (
    <article className="relative flex flex-col rounded-[1.5rem] border border-white/80 bg-white/65 p-6 shadow-[0_30px_70px_-40px_rgb(30_50_50/0.3)] sm:p-8 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="type-small text-muted-foreground">{formation.domain}</p>
      <h3 className="mt-2 type-h3">
        {available ? (
          <Link href={`/formations/${formation.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-ring">
            {formation.title}
          </Link>
        ) : (
          formation.title
        )}
      </h3>
      <p className="mt-3 type-body text-foreground/80">{plain(formation.promise)}</p>
      <div className="mt-auto flex items-end justify-between gap-4 pt-8 type-small">
        {available ? (
          <>
            <span className="text-muted-foreground">
              {total} modules{open < total ? `, dont ${open} ouvert${open > 1 ? "s" : ""}` : ""}
            </span>
            <span className="font-semibold text-primary" aria-hidden>
              Découvrir la formation
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">Prochainement</span>
        )}
      </div>
    </article>
  );
}
