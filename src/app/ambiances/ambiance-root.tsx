"use client";

import { useEffect } from "react";

// Applique l'ambiance à toute la page, y compris aux menus et panneaux qui s'ouvrent par-dessus.
export function AmbianceRoot({ id, dark, children }: { id: string; dark: boolean; children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.ambiance = id;
    html.classList.toggle("dark", dark);
    return () => {
      delete html.dataset.ambiance;
      html.classList.remove("dark");
    };
  }, [id, dark]);
  return (
    <div data-ambiance={id} className={dark ? "dark contents" : "contents"}>
      {children}
    </div>
  );
}
