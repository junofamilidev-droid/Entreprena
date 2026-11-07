"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Haut de page « produit » : les vraies captures de la plateforme flottent autour du titre, en cartes
// de verre. Elles s'inclinent et se décalent selon la souris, chacune à sa profondeur (effet 3D).

type Card = { src: string; w: number; h: number; alt: string; label: string; pos: string; depth: number };

const CARDS: Card[] = [
  { src: "/captures/mission", w: 760, h: 1008, alt: "La mission : le message de la cheffe de mission.", label: "La mission", pos: "md:left-[1.5%] md:top-[15%] md:w-[19%]", depth: 26 },
  { src: "/captures/outil", w: 900, h: 657, alt: "L'outil : les règles du skill Claude.", label: "L'outil", pos: "md:right-[1.5%] md:top-[12%] md:w-[25%]", depth: 40 },
  { src: "/captures/fiche", w: 860, h: 517, alt: "La fiche : la méthode à réutiliser.", label: "La fiche", pos: "md:left-[4%] md:bottom-[7%] md:w-[24%]", depth: 52 },
  { src: "/captures/test", w: 760, h: 762, alt: "Les vérifications : la réponse de Claude contrôlée.", label: "Les vérifications", pos: "md:right-[4%] md:bottom-[5%] md:w-[20%]", depth: 32 },
];

export function HeroProductCards() {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = root.parentElement ?? root;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let raf = 0;
    const loop = () => {
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
      for (const el of items) {
        const d = Number(el.dataset.depth);
        el.style.transform = `translate3d(${(-mx * d).toFixed(1)}px, ${(-my * d).toFixed(1)}px, 0) rotateX(${(my * 7).toFixed(2)}deg) rotateY(${(-mx * 7).toFixed(2)}deg)`;
      }
      raf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} className="pointer-events-none grid grid-cols-2 gap-3 [perspective:1200px] md:absolute md:inset-0 md:block">
      {CARDS.map((c) => (
        <figure
          key={c.src}
          data-depth={c.depth}
          className={cn(
            "rounded-[1.25rem] border border-white/80 bg-white/45 p-1.5 shadow-[0_30px_70px_-30px_rgb(30_50_50/0.35)] backdrop-blur-xl will-change-transform md:absolute",
            c.pos,
          )}
        >
          <Image src={`${c.src}-clair.webp`} width={c.w} height={c.h} alt={c.alt} sizes="(min-width: 768px) 24vw, 45vw" className="w-full rounded-[0.95rem]" priority={false} />
          <figcaption className="px-2 pt-1.5 pb-0.5 text-[0.75rem] font-medium text-[oklch(0.35_0.02_205)]">{c.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
