"use client";

import * as React from "react";

const DAYS = ["DIM.", "LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM."];

/** Horloge de la barre d'état des cadres (« LUN.11:45:27 »), mise à jour chaque seconde. */
export function FrameClock() {
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);
  if (!now) return <span aria-hidden>&nbsp;</span>;
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span aria-hidden suppressHydrationWarning>
      {DAYS[now.getDay()]}
      {p(now.getHours())}:{p(now.getMinutes())}:{p(now.getSeconds())}
    </span>
  );
}
