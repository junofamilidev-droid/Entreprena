import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";

// Page temporaire de comparaison du haut de page (version « illustration »). À supprimer après le choix.
export const metadata: Metadata = { title: "Aperçu : illustration", robots: { index: false, follow: false } };

export default function Page() {
  return <HomeView variant="illustration" />;
}
