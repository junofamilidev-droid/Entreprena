"use client";

import * as React from "react";

// Pendant le défilement, le contenu du haut de page (titre, texte, boutons) remonte un peu plus lentement
// que la page et s'estompe : effet de profondeur. L'indicateur « Découvrir » disparaît dès qu'on défile.
// Transform et opacité seulement ; rien si l'appareil demande moins d'animations.

export function HeroScrollFx({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = window.innerHeight;
      const p = Math.min(1, Math.max(0, window.scrollY / (h * 0.7)));
      el.style.transform = `translate3d(0, ${(window.scrollY * 0.35).toFixed(1)}px, 0)`;
      el.style.opacity = (1 - p).toFixed(3);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export function ScrollCue({ href = "#suite" }: { href?: string }) {
  const [hidden, setHidden] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setHidden(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <a
      href={href}
      aria-label="Découvrir la suite"
      className={`absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 text-[0.8125rem] font-medium text-[oklch(0.3_0.03_205)]/75 transition-opacity duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring ${hidden ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      Découvrir
      <span aria-hidden className="relative block h-12 w-px overflow-hidden bg-[oklch(0.3_0.03_205)]/20">
        <span className="scroll-cue-dot absolute left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,#e9b872,#4f9e98)]" />
      </span>
    </a>
  );
}
