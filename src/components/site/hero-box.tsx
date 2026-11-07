"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";

// Boîte interactive du haut de page : on choisit son métier, et les tâches réelles de la formation
// (ses modules) défilent comme si on les tapait, avec leur disponibilité. Tout vient des données :
// un deuxième métier ajouté dans l'espace réservé apparaît ici sans rien changer.

export type HeroTrack = {
  slug: string;
  domain: string;
  title: string;
  tasks: { title: string; open: boolean }[];
};

export function HeroBox({ tracks, cta, tone = "dark" }: { tracks: HeroTrack[]; cta: string; tone?: "dark" | "light" }) {
  const L = tone === "light";
  const [index, setIndex] = React.useState(0);
  const [menu, setMenu] = React.useState(false);
  const track = tracks[index];
  const [task, setTask] = React.useState(0);
  const [typed, setTyped] = React.useState(track?.tasks[0]?.title ?? "");

  // Effet machine à écrire : écrit la tâche, attend, efface, passe à la suivante.
  React.useEffect(() => {
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const full = track.tasks[task]?.title ?? "";
    let i = 0;
    let erasing = false;
    const tick = () => {
      if (cancelled) return;
      if (!erasing) {
        i++;
        setTyped(full.slice(0, i));
        if (i >= full.length) {
          erasing = true;
          timer = setTimeout(tick, 2400);
          return;
        }
        timer = setTimeout(tick, 34 + Math.random() * 40);
      } else {
        i -= 2;
        setTyped(full.slice(0, Math.max(0, i)));
        if (i <= 0) {
          setTask((n) => (n + 1) % track.tasks.length);
          return;
        }
        timer = setTimeout(tick, 16);
      }
    };
    timer = setTimeout(tick, task === 0 && typed === full ? 2400 : 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, index]);

  if (!track) return null;
  const current = track.tasks[task];

  return (
    <div
      className={`w-full max-w-[38rem] rounded-2xl border p-2 text-left backdrop-blur-xl ${
        L ? "border-white/80 bg-white/45 shadow-[0_30px_80px_-30px_rgb(40_60_60/0.35)]" : "border-white/15 bg-[rgb(8_24_26/0.55)] shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]"
      }`}
    >
      <div className={`rounded-xl px-4 pt-3.5 pb-5 sm:px-5 ${L ? "bg-white/80" : "bg-[rgb(4_14_16/0.55)]"}`}>
        <div className={`flex items-center justify-between gap-3 text-[0.8125rem] ${L ? "text-[oklch(0.4_0.02_205)]" : "text-white/60"}`}>
          <span>Ce que vous saurez faire</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => tracks.length > 1 && setMenu((m) => !m)}
              aria-haspopup={tracks.length > 1 ? "listbox" : undefined}
              aria-expanded={tracks.length > 1 ? menu : undefined}
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-md border px-2.5 whitespace-nowrap focus-visible:outline-2 ${L ? "border-[oklch(0.22_0.03_205)]/15 text-[oklch(0.22_0.03_205)] focus-visible:outline-[oklch(0.22_0.03_205)]" : "border-white/15 text-white/85 focus-visible:outline-white"}`}
            >
              Métier : {track.domain}
              {tracks.length > 1 && <ChevronDownIcon className="size-3.5" aria-hidden />}
            </button>
            {menu && (
              <ul role="listbox" className="absolute right-0 z-10 mt-1 min-w-44 rounded-lg border border-white/15 bg-[rgb(8_24_26/0.95)] p-1 backdrop-blur-xl">
                {tracks.map((t, i) => (
                  <li key={t.slug}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === index}
                      onClick={() => {
                        setIndex(i);
                        setTask(0);
                        setTyped(t.tasks[0]?.title ?? "");
                        setMenu(false);
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-white/85 hover:bg-white/10"
                    >
                      {t.domain}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <p className={`mt-4 min-h-[3.4em] text-[1.25rem] leading-snug font-medium sm:text-[1.375rem] ${L ? "text-[oklch(0.2_0.03_205)]" : "text-white"}`} aria-hidden>
          {typed}
          <span className={`ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse motion-reduce:hidden ${L ? "bg-[oklch(0.22_0.03_205)]" : "bg-white/80"}`} />
        </p>
        <p className="sr-only">
          {track.title} : {track.tasks.map((t) => t.title).join(", ")}.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 px-2 pt-2 pb-0.5">
        <span className={`inline-flex items-center gap-2 pl-1 text-[0.8125rem] ${L ? "text-[oklch(0.35_0.02_205)]" : "text-white/70"}`} aria-hidden>
          <span className={`size-1.5 rounded-full ${current?.open ? (L ? "bg-[oklch(0.62_0.13_70)]" : "bg-[oklch(0.82_0.12_85)]") : L ? "bg-black/25" : "bg-white/35"}`} />
          {current?.open ? "Disponible" : "Prochainement"}
        </span>
        <Link href="/formations" className={`inline-flex min-h-11 items-center rounded-lg px-5 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${L ? "bg-[oklch(0.25_0.04_205)] text-white hover:bg-[oklch(0.3_0.05_205)] focus-visible:outline-[oklch(0.25_0.04_205)]" : "bg-white text-[oklch(0.2_0.02_200)] hover:bg-white/90 focus-visible:outline-white"}`}>
          {cta}
        </Link>
      </div>
    </div>
  );
}
