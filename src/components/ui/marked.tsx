import * as React from "react";

/** Retire les marques de surlignage ==…== (titres de page, descriptions, recherche). */
export function unmark(text: string) {
  return text.replace(/==(.+?)==/g, "$1");
}

/** Affiche un texte où les passages écrits ==ainsi== sont surlignés au feutre. */
export function Marked({ text }: { text: string }) {
  const parts = text.split(/==(.+?)==/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="marker bg-transparent" style={{ "--marker-index": (i - 1) / 2 } as React.CSSProperties}>
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}
