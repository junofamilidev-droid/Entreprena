import Link from "next/link";
import { LockIcon } from "lucide-react";
import { aAcces } from "@/lib/acces/acces";

// Garde d'une session : le contenu n'est rendu (et donc envoyé au navigateur) que si l'apprenant
// connecté a accès à la formation. Sinon : se connecter, ou découvrir la formation.
export async function AccesSession({ formation, titre, sessionTitre, retour, children }: { formation: string; titre: string; sessionTitre: string; retour: string; children: React.ReactNode }) {
  const acces = await aAcces(formation);
  if (acces.ok) return children;
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 text-center shadow-sm">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-muted">
          <LockIcon className="size-5" aria-hidden />
        </span>
        <h1 className="mt-5 text-title">{sessionTitre}</h1>
        <p className="mt-3 text-body text-muted-foreground">
          Cette session fait partie de la formation « {titre} ». {acces.connecte ? "Votre compte n'y a pas encore accès." : "Connectez-vous pour la suivre."}
        </p>
        <div className="mt-7 flex flex-col items-center gap-3">
          {!acces.connecte && (
            <Link href={`/app/connexion?next=${encodeURIComponent(retour)}`} className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground">
              Se connecter
            </Link>
          )}
          <Link href={`/formations/${formation}`} className={acces.connecte ? "inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground" : "text-sm underline underline-offset-4"}>
            Découvrir la formation
          </Link>
        </div>
      </div>
    </main>
  );
}
