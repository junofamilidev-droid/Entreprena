import type { MetierAVenir } from "@/lib/vitrine/metiers";

// Carte d'un métier à venir : plus discrète qu'une formation disponible, sans bouton ni formulaire.
export function UpcomingCard({ metier }: { metier: MetierAVenir }) {
  return (
    <article className="flex flex-col rounded-[1.25rem] border border-border/70 bg-white/45 p-5 sm:p-6 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <h3 className="type-h3 text-[1.125rem] text-foreground/85">{metier.nom}</h3>
        <span className="mt-0.5 shrink-0 rounded-full bg-foreground/[0.06] px-2.5 py-1 text-[0.75rem] font-medium text-muted-foreground">Prochainement</span>
      </div>
      <p className="mt-3 type-small text-muted-foreground">{metier.phrase}</p>
    </article>
  );
}

export function UpcomingGrid({ metiers }: { metiers: MetierAVenir[] }) {
  if (!metiers.length) return null;
  return (
    <div>
      <h3 className="mt-14 mb-5 type-h3">Prochainement</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metiers.map((m) => (
          <UpcomingCard key={m.nom} metier={m} />
        ))}
      </div>
    </div>
  );
}
