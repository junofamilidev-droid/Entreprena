"use client";

import * as React from "react";
import Image from "next/image";
import { PixelTrail } from "./pixel-trail";

// Haut de page « illustration » : une vraie image plein écran (fichier dans public/hero/).
// La souris la décale légèrement (profondeur) et y laisse une traînée de pixels faits de l'image même.

export function HeroImage({ src, alt }: { src: string; alt: string }) {
  const wrap = React.useRef<HTMLDivElement>(null);
  const img = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const el = wrap.current;
    const host = el?.parentElement;
    if (!el || !host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let raf = 0;
    const loop = () => {
      mx += (tx - mx) * 0.06;
      my += (ty - my) * 0.06;
      el.style.transform = `translate3d(${(-mx * 28).toFixed(1)}px, ${(-my * 18).toFixed(1)}px, 0) scale(1.06)`;
      raf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    host.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <div ref={wrap} className="absolute inset-0 scale-[1.06] will-change-transform">
        <Image ref={img} src={src} alt={alt} fill priority sizes="100vw" className="object-cover" />
      </div>
      <PixelTrail className="pointer-events-none absolute inset-0 h-full w-full" getSource={() => img.current} mix={0.2} />
    </>
  );
}
