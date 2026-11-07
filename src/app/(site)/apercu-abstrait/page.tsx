import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";

// Page temporaire de comparaison du haut de page (version « abstrait »). À supprimer après le choix.
export const metadata: Metadata = { title: "Aperçu : abstrait", robots: { index: false, follow: false } };

export default function Page() {
  return <HomeView variant="abstrait" />;
}
