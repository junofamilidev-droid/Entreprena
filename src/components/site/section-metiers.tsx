import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import type { FormationWithModules } from "@/lib/content/types";
import type { MetierAVenir } from "@/lib/vitrine/metiers";
import { plain } from "@/lib/vitrine/text";
import { Eyebrow, LightDot } from "./kit";

// Les métiers : titre à gauche (collant sur grand écran), liste à droite.
// Les formations disponibles en tête, cliquables ; les métiers à venir ensuite, « Bientôt », sans lien.
export function SectionMetiers({
  title,
  intro,
  formations,
  upcoming,
}: {
  title: string;
  intro: string;
  formations: FormationWithModules[];
  upcoming: MetierAVenir[];
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <Eyebrow>Les métiers</Eyebrow>
        <h2 className="mt-5 max-w-[14ch] font-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-[1.02] font-semibold tracking-[-0.04em]">{title}</h2>
        <p className="mt-5 max-w-[26rem] type-lead text-foreground/70">{intro}</p>
        <p className="mt-8 type-small text-muted-foreground">
          {formations.length} disponible{formations.length > 1 ? "s" : ""} · {upcoming.length} en préparation
        </p>
      </div>
      <ul className="border-t border-border">
        {formations.map((f) => (
          <li key={f.id}>
            <Link href={`/formations/${f.slug}`} className="group grid grid-cols-[1fr_auto] items-center gap-6 border-b border-border py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              <span>
                <span className="block font-display text-[1.375rem] font-semibold tracking-[-0.025em]">{f.domain}</span>
                <span className="mt-1 block type-small text-foreground/70">
                  {f.title} — {plain(f.promise)}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3.5 py-2 text-[0.875rem] font-semibold text-primary-foreground">
                Disponible
                <ArrowUpRightIcon className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
        {upcoming.map((m) => (
          <li key={m.nom} className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-border py-5">
            <span>
              <span className="block font-display text-[1.125rem] font-medium tracking-[-0.015em] text-foreground/85">{m.nom}</span>
              <span className="mt-1 block type-small text-muted-foreground">{m.phrase}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-[0.875rem] text-muted-foreground">
              <LightDot className="size-2 opacity-70" /> Bientôt
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
