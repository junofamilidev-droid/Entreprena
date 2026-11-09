import Image from "next/image";
import { cn } from "@/lib/utils";
import { FrameClock } from "./frame-clock";

// Briques de mise en page de la vitrine, inspirées des sites produits les plus soignés (neuralk.ai) :
// - Eyebrow : petite étiquette à carré coloré, en chasse fixe, au-dessus d'un titre ;
// - SectionHead : titre à gauche, texte d'appui à droite ;
// - Frame : cadre « fenêtre » sur un paysage de la matière fluide, coins marqués, barre d'état avec horloge,
//   qui accueille un aperçu du produit.

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 bg-foreground/[0.04] px-2 py-1 font-mono text-[0.75rem] tracking-[0.02em] text-foreground/75 uppercase", className)}>
      <span className="size-2 bg-primary" aria-hidden />
      {children}
    </p>
  );
}

export function SectionHead({ eyebrow, title, children, className }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-20", className)}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-5 max-w-[18ch] font-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.035em]">{title}</h2>
      </div>
      {children && <div className="max-w-[36rem] type-lead text-foreground/70 lg:justify-self-end">{children}</div>}
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return <span aria-hidden className={cn("absolute size-3 border-white/80", className)} />;
}

export function Frame({
  label,
  scene = "nuit-1",
  children,
  className,
  bodyClassName,
}: {
  label: string;
  scene?: "nuit-1" | "nuit-2" | "nuit-3" | "jour-1";
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-[6px] bg-[oklch(0.2_0.03_200)] text-white", className)}>
      <Image src={`/paysages/${scene}.webp`} alt="" fill sizes="100vw" className="-z-10 object-cover" />
      <Corner className="top-2.5 left-2.5 rounded-tl-[4px] border-t-2 border-l-2" />
      <Corner className="top-2.5 right-2.5 rounded-tr-[4px] border-t-2 border-r-2" />
      <Corner className="bottom-2.5 left-2.5 rounded-bl-[4px] border-b-2 border-l-2" />
      <Corner className="right-2.5 bottom-2.5 rounded-br-[4px] border-r-2 border-b-2" />
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-8 pt-3 font-mono text-[0.75rem] tracking-[0.04em] text-white/85 uppercase sm:px-12">
        <span className="truncate">{label}</span>
        <FrameClock />
        <span />
      </div>
      <div className={cn("relative px-4 pt-6 pb-8 sm:px-12 sm:pt-8 sm:pb-12", bodyClassName)}>{children}</div>
    </div>
  );
}

/** Fenêtre d'application posée dans un cadre (barre à trois points, adresse). */
export function AppWindow({ address, children, className }: { address: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[10px] border border-white/25 bg-[oklch(0.25_0.02_200)/0.6] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] backdrop-blur", className)}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-[#ff5f57]" />
          <i className="size-2.5 rounded-full bg-[#febc2e]" />
          <i className="size-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto truncate rounded-md bg-white/10 px-6 py-1 text-[0.6875rem] text-white/60">{address}</span>
        <span className="w-12" aria-hidden />
      </div>
      <div className="bg-[oklch(0.985_0.004_85)] text-[oklch(0.2_0.02_200)]">{children}</div>
    </div>
  );
}
