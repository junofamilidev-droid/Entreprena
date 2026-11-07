import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";

// Page temporaire de comparaison : l'accueil avec l'ambiance « matin » (plus claire).
// À supprimer une fois l'ambiance choisie. Non référencée par les moteurs de recherche.
export const metadata: Metadata = { title: "Aperçu : ambiance matin", robots: { index: false, follow: false } };

export default function ApercuMatinPage() {
  return <HomeView variant="matin" />;
}
