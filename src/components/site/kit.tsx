import Image from "next/image";
import { cn } from "@/lib/utils";

// Briques de mise en page de la vitrine. Signature de la marque : la lumière fluide
// (crème, bleu-vert, or) — en fond des fenêtres, en halo autour d'elles, en dégradé sur les repères.

/** Pastille de lumière : petit dégradé or → bleu-vert, la marque dans un point. */
export function LightDot({ className }: { className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 rounded-full bg-[conic-gradient(from_200deg,#e9b872,#f6e7c8,#4f9e98,#e9b872)]", className)} />;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2.5 text-[0.9375rem] font-medium text-foreground/70", className)}>
      <LightDot />
      {children}
    </p>
  );
}

export function SectionHead({ eyebrow, title, children, className }: { eyebrow: string; title: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-20", className)}>
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(2rem,1.2rem+2vw,3rem)] leading-[1.02] font-semibold tracking-[-0.04em]">{title}</h2>
      </div>
      {children && <div className="max-w-[36rem] type-lead text-foreground/70 lg:justify-self-end">{children}</div>}
    </div>
  );
}

/** Numéro de repère en dégradé de lumière (« 01 », « 02 »…). */
export function LightNumber({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("bg-[linear-gradient(135deg,#d9a35a,#4f9e98)] bg-clip-text font-display font-semibold text-transparent tabular-nums", className)}>
      {String(n).padStart(2, "0")}
    </span>
  );
}

/**
 * Fenêtre de lumière : un grand panneau arrondi sur un paysage de la matière fluide, avec un halo coloré
 * autour. Elle accueille les écrans de la plateforme. `caption` : petite légende en haut à gauche.
 */
export function Frame({
  caption,
  scene = "nuit-1",
  children,
  className,
  bodyClassName,
}: {
  caption?: React.ReactNode;
  scene?: "nuit-1" | "nuit-2" | "nuit-3" | "jour-1";
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const light = scene === "jour-1";
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_20%_30%,rgb(233_184_114/0.35),transparent),radial-gradient(60%_60%_at_85%_80%,rgb(79_158_152/0.35),transparent)] blur-2xl" />
      <div className={cn("relative isolate overflow-hidden rounded-[28px] ring-1 ring-black/5", light ? "text-[oklch(0.22_0.03_205)]" : "text-white")}>
        <Image src={`/paysages/${scene}.webp`} alt="" fill sizes="100vw" className="-z-10 object-cover" />
        {caption && (
          <div className="px-6 pt-5 sm:px-10 sm:pt-7">
            <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.8125rem] font-medium backdrop-blur", light ? "bg-white/60" : "bg-white/12 text-white/90")}>
              <LightDot className="size-2" />
              {caption}
            </span>
          </div>
        )}
        <div className={cn("relative px-4 pt-6 pb-8 sm:px-10 sm:pt-8 sm:pb-12", bodyClassName)}>{children}</div>
      </div>
    </div>
  );
}

/** Fenêtre d'application posée dans un cadre (barre à trois points, adresse). */
export function AppWindow({ address, children, className }: { address: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[18px] border border-white/30 bg-white/15 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.55)] backdrop-blur-md", className)}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2.5 rounded-full bg-white/50" />
          <i className="size-2.5 rounded-full bg-white/35" />
          <i className="size-2.5 rounded-full bg-white/25" />
        </span>
        <span className="mx-auto truncate rounded-full bg-white/15 px-5 py-1 text-[0.6875rem] text-white/75">{address}</span>
        <span className="w-12" aria-hidden />
      </div>
      <div className="bg-[oklch(0.985_0.004_85)] text-[oklch(0.2_0.02_200)]">{children}</div>
    </div>
  );
}
