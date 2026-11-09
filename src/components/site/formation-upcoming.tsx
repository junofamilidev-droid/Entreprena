import Image from "next/image";
import type { MetierAVenir } from "@/lib/vitrine/metiers";

// Fiche d'un métier dont la formation est en préparation : même gabarit que la fiche disponible,
// programme masqué (lignes floues) et, à droite, la matière fluide floutée avec la mention « Bientôt ».
const SCENES = ["nuit-1", "nuit-2", "nuit-3"] as const;

export function FormationUpcoming({ metier, index }: { metier: MetierAVenir; index: number }) {
  return (
    <article className="grid h-full overflow-hidden rounded-[28px] border border-border bg-card shadow-[0_40px_80px_-50px_rgb(20_60_60/0.45)] lg:grid-cols-[1.05fr_1fr]">
      <div className="flex flex-col p-6 sm:p-10">
        <p className="inline-flex items-center gap-2.5 self-start text-[0.9375rem] font-medium text-foreground/70">
          <span aria-hidden className="inline-block size-2.5 rounded-full bg-foreground/20" />
          Formation en préparation · {metier.nom}
        </p>
        <h3 className="mt-3 font-display text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)] leading-[1.05] font-semibold tracking-[-0.035em]">{metier.nom}</h3>
        <p className="mt-4 max-w-[34rem] type-lead text-foreground/80">{metier.phrase}</p>
        <div className="mt-8 border-y border-border" aria-hidden>
          {[62, 48, 56, 40, 52].map((w, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border py-[0.95rem] last:border-b-0">
              <span className="w-5 text-[0.8125rem] text-muted-foreground/60 tabular-nums">{i + 1}</span>
              <span className="h-2.5 rounded-full bg-foreground/[0.07] blur-[1.5px]" style={{ width: `${w}%` }} />
              <span className="ml-auto h-2.5 w-20 rounded-full bg-foreground/[0.05] blur-[1.5px]" />
            </div>
          ))}
        </div>
        <p className="mt-8 type-small text-muted-foreground">Le programme sera publié à l&apos;ouverture de la formation.</p>
      </div>
      <div className="relative order-first h-36 overflow-hidden lg:order-none lg:h-auto lg:min-h-[22rem]">
        <Image src={`/paysages/${SCENES[index % SCENES.length]}.webp`} alt="" fill sizes="40vw" className="scale-150 object-cover blur-2xl" />
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgb(246_231_200/0.35),transparent)]" />
        <div className="absolute inset-0 grid place-items-center">
          <span className="rounded-full border border-white/40 bg-white/15 px-6 py-3 font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-white backdrop-blur-md">Bientôt</span>
        </div>
      </div>
    </article>
  );
}
