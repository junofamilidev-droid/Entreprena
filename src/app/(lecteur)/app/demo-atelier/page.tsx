import type { Metadata } from "next";
import { AtelierPlayer } from "@/components/atelier/atelier-player";
import { parseSessionFile } from "@/lib/sessions/validate";
import { isAtelier } from "@/lib/sessions/atelier";
import demo from "../../../../../content/demo/session-atelier-nordelia.json";

export const metadata: Metadata = { title: "Session atelier de démonstration", robots: { index: false } };

// Démonstration du format « atelier » : la session est lue depuis content/demo, sans passer par la base.
export default function DemoAtelierPage() {
  const parsed = parseSessionFile(demo);
  if (!parsed.ok || !isAtelier(parsed.session)) {
    return (
      <main className="mx-auto max-w-2xl space-y-3 px-5 py-12">
        <h1 className="text-title">La session de démonstration est invalide</h1>
        <ul className="list-disc space-y-1 pl-5 text-body text-destructive">
          {(parsed.ok ? ["Ce n'est pas une session au format atelier."] : parsed.errors).map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </main>
    );
  }
  return <AtelierPlayer session={parsed.session} moduleLabel="Module 1 : Revue analytique" exitHref="/app" fileBase="/demo" />;
}
