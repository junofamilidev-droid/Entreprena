import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";

// Page temporaire de comparaison du haut de page (version « produit en vedette »). À supprimer après le choix.
export const metadata: Metadata = { title: "Aperçu : produit en vedette", robots: { index: false, follow: false } };

export default function Page() {
  return <HomeView variant="produit" />;
}
