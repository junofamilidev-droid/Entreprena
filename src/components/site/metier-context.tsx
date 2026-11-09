"use client";

import * as React from "react";
import { EXEMPLES, exempleDe, type Exemple } from "@/lib/vitrine/exemples";

// Métier choisi par le visiteur : il adapte tous les écrans de la vitrine.
// Mémorisé dans le navigateur (préférence de confort ; rien n'est envoyé).

type Ctx = { metier: string; exemple: Exemple; disponible: boolean; setMetier: (m: string) => void; disponibles: string[] };
const MetierCtx = React.createContext<Ctx | null>(null);
const KEY = "vitrine-metier";

export function MetierProvider({ disponibles, children }: { disponibles: string[]; children: React.ReactNode }) {
  const [metier, set] = React.useState(disponibles[0] ?? EXEMPLES[0].metier);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && EXEMPLES.some((e) => e.metier === saved)) {
        const t = setTimeout(() => set(saved), 0);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);
  const setMetier = React.useCallback((m: string) => {
    set(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {}
  }, []);
  const value = React.useMemo(
    () => ({ metier, exemple: exempleDe(metier), disponible: disponibles.some((d) => d.toLowerCase() === metier.toLowerCase()), setMetier, disponibles }),
    [metier, setMetier, disponibles],
  );
  return <MetierCtx.Provider value={value}>{children}</MetierCtx.Provider>;
}

export function useMetier() {
  const c = React.useContext(MetierCtx);
  if (!c) throw new Error("useMetier hors de MetierProvider");
  return c;
}

/** « Je suis… [métier] » : liste native (accessible au clavier et sur mobile). */
export function MetierSelect({ className }: { className?: string }) {
  const { metier, setMetier, disponibles } = useMetier();
  return (
    <label className={`inline-flex items-center gap-3 text-[0.9375rem] ${className ?? ""}`}>
      <span className="whitespace-nowrap text-foreground/70">Je suis</span>
      <span className="relative">
        <select
          value={metier}
          onChange={(e) => setMetier(e.target.value)}
          className="h-11 cursor-pointer appearance-none rounded-full border border-foreground/15 bg-white/70 py-0 pr-10 pl-4 font-medium text-foreground shadow-[0_8px_24px_-12px_rgb(20_60_60/0.35)] backdrop-blur focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:bg-white/10"
        >
          {EXEMPLES.map((e) => (
            <option key={e.id} value={e.metier}>
              {e.metier}
              {disponibles.some((d) => d.toLowerCase() === e.metier.toLowerCase()) ? "" : " (bientôt)"}
            </option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-4 size-3.5 -translate-y-1/2 text-foreground/60">
          <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
    </label>
  );
}

/** Mention affichée sur les écrans d'un métier dont la formation n'existe pas encore. */
export function ExempleNote({ className }: { className?: string }) {
  const { disponible } = useMetier();
  if (disponible) return null;
  return <p className={`text-[0.75rem] text-foreground/55 ${className ?? ""}`}>Exemple · formation en préparation</p>;
}
