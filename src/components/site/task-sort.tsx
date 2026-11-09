"use client";

import * as React from "react";

// « Le partage des tâches » : les tâches du métier arrivent en vrac, puis se rangent d'elles-mêmes
// en deux colonnes quand la section apparaît : ce que l'IA prend en charge, ce que vous gardez.
// Sans JavaScript ou si l'appareil demande moins d'animations, elles sont directement rangées.

export type TaskColumns = { ai: { title: string; items: string[] }; you: { title: string; items: string[] } };

export function TaskSort({ columns }: { columns: TaskColumns }) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const stage = ref.current;
    if (!stage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const chips = Array.from(stage.querySelectorAll<HTMLElement>("[data-chip]"));
    const boxes = Array.from(stage.querySelectorAll<HTMLElement>("[data-box]"));
    // 1. On disperse les étiquettes en tas au centre de la scène (sans transition).
    const s = stage.getBoundingClientRect();
    const cx = s.left + s.width / 2;
    const cy = s.top + s.height / 2;
    chips.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const angle = (i / chips.length) * Math.PI * 2 + i;
      const spread = Math.min(s.width * 0.32, 260);
      const px = cx + Math.cos(angle) * spread * (0.4 + ((i * 37) % 10) / 16);
      const py = cy + Math.sin(angle) * Math.min(s.height * 0.25, 90);
      const rot = ((i * 53) % 24) - 12;
      c.style.transition = "none";
      c.style.transform = `translate(${px - (r.left + r.width / 2)}px, ${py - (r.top + r.height / 2)}px) rotate(${rot}deg)`;
    });
    boxes.forEach((b) => {
      b.style.transition = "none";
      b.style.opacity = "0";
    });
    // 2. Quand la section est bien visible, chacune rejoint sa colonne, l'une après l'autre.
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        boxes.forEach((b) => {
          b.style.transition = "opacity 700ms cubic-bezier(0.16,1,0.3,1)";
          b.style.opacity = "1";
        });
        chips.forEach((c, i) => {
          c.style.transition = `transform 900ms cubic-bezier(0.16,1,0.3,1) ${250 + i * 110}ms`;
          c.style.transform = "none";
        });
      },
      { threshold: 0.45 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  const col = (key: "ai" | "you") => {
    const c = columns[key];
    const you = key === "you";
    return (
      <div className="relative p-5 sm:p-7">
        {/* Le fond de la colonne apparaît en fondu ; les étiquettes, elles, volent jusqu'à leur place. */}
        <div
          data-box
          aria-hidden
          className={`absolute inset-0 rounded-[1.5rem] border ${
            you
              ? "border-primary/25 bg-[linear-gradient(160deg,rgb(255_255_255/0.85),rgb(214_232_228/0.7))] shadow-[0_30px_70px_-40px_rgb(20_70_70/0.45)] dark:border-primary/30 dark:bg-white/[0.05]"
              : "border-white/80 bg-white/50 dark:border-white/10 dark:bg-white/[0.03]"
          }`}
        />
        <p className={`relative text-[0.8125rem] font-semibold ${you ? "text-primary" : "text-muted-foreground"}`}>{c.title}</p>
        <ul className="relative mt-4 flex flex-wrap gap-2.5">
          {c.items.map((t) => (
            <li
              key={t}
              data-chip
              className={`rounded-full border px-4 py-2 text-[0.9375rem] font-medium will-change-transform ${
                you ? "border-primary/30 bg-primary text-primary-foreground" : "border-border bg-background/80 text-foreground/75"
              }`}
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div ref={ref} className="grid gap-4 py-6 md:grid-cols-2 md:gap-6">
      {col("ai")}
      {col("you")}
    </div>
  );
}
