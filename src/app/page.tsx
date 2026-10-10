import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TestBanner } from "@/components/test-banner";

// Page d'accueil provisoire : elle sera construite à l'étape 2.
export default function Home() {
  return (
    <>
      <TestBanner />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-4 py-24">
        <p className="text-kicker text-brand">En construction</p>
        <h1 className="text-title">La plateforme arrive.</h1>
        <Button asChild size="lg" className="self-start">
          <Link href="/style">Voir la charte graphique</Link>
        </Button>
      </main>
    </>
  );
}
