import Link from "next/link";
import { site } from "@/lib/site";

/** Nom de la marque (réglé dans src/lib/site.ts), le point final en couleur d'accent. */
export function Brand({ className }: { className?: string }) {
  const name = site.name.replace(/\.$/, "");
  return (
    <Link href="/" className={className ?? "rounded-sm font-display text-[1.375rem] font-semibold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"}>
      {name}
      <span className="text-primary">.</span>
      <span className="sr-only"> : accueil</span>
    </Link>
  );
}
