import { CheckIcon, MinusIcon } from "lucide-react";
import { Eyebrow, Frame } from "./kit";

// Pour qui / ce que ce n'est pas : une fenêtre de lumière (matière fluide claire) qui accueille deux
// panneaux de verre. À gauche, le profil visé, avec des pastilles de lumière ; à droite, les limites, en retrait.
export function SectionPourQui({ yesTitle, yes, noTitle, no }: { yesTitle: string; yes: string[]; noTitle: string; no: string[] }) {
  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-20">
        <div>
          <Eyebrow>Pour qui</Eyebrow>
          <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(2rem,1.2rem+2vw,3rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
            Conçue pour les professionnels en poste.
          </h2>
        </div>
        <p className="max-w-[34rem] type-lead text-foreground/70 lg:justify-self-end">
          Une formation exigeante et concrète, pensée pour ceux qui exercent déjà leur métier et veulent garder la main.
        </p>
      </div>

      <Frame scene="jour-1" className="mt-14" bodyClassName="grid gap-4 p-4 sm:p-8 md:grid-cols-[1.15fr_1fr] md:gap-5">
        <div className="rounded-[22px] bg-white/80 p-6 shadow-[0_30px_60px_-35px_rgb(20_60_60/0.45)] backdrop-blur-md sm:p-8">
          <p className="font-display text-[1.375rem] font-semibold tracking-[-0.02em]">{yesTitle}</p>
          <ul className="mt-6 space-y-5">
            {yes.map((t) => (
              <li key={t} className="flex gap-4 type-body">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_200deg,#e9b872,#f6e7c8,#4f9e98,#e9b872)] text-[oklch(0.22_0.03_205)] shadow-[0_6px_16px_-6px_rgb(79_158_152/0.7)]">
                  <CheckIcon className="size-4" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-foreground/90">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[22px] border border-white/60 bg-white/35 p-6 backdrop-blur-md sm:p-8">
          <p className="font-display text-[1.375rem] font-semibold tracking-[-0.02em] text-foreground/80">{noTitle}</p>
          <ul className="mt-6 space-y-5">
            {no.map((t) => (
              <li key={t} className="flex gap-4 type-body">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-foreground/15 text-foreground/50">
                  <MinusIcon className="size-4" aria-hidden />
                </span>
                <span className="text-foreground/70">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </Frame>
    </div>
  );
}
