import type { Metadata } from "next";
import { SessionPlayer } from "@/components/session/session-player";
import { parseSession } from "@/lib/sessions/validate";
import demo from "../../../../content/demo/session-demo.json";

export const metadata: Metadata = { title: "Session de démonstration", robots: { index: false } };

// Démonstration du format en blocs : la session est lue depuis content/demo, sans passer par la base.
export default function DemoSessionPage() {
  const parsed = parseSession(demo);
  if (!parsed.ok) {
    return (
      <main className="mx-auto max-w-2xl space-y-3 px-5 py-12">
        <h1 className="text-title">La session de démonstration est invalide</h1>
        <ul className="list-disc space-y-1 pl-5 text-body text-destructive">
          {parsed.errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </main>
    );
  }
  return <SessionPlayer session={parsed.session} moduleLabel="Module 1 : Revue analytique" exitHref="/" fileBase="/demo" />;
}
