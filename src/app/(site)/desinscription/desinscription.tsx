"use client";

import * as React from "react";
import Link from "next/link";
import { desinscrire } from "./actions";

// Un bouton à confirmer (et non une désinscription à l'ouverture du lien) : les antivirus des messageries
// ouvrent les liens tout seuls, ce qui désinscrirait les gens sans qu'ils le veuillent.
export function Desinscription({ e, s, t }: { e: string; s: string; t: string }) {
  const [etat, setEtat] = React.useState<"attente" | "fait" | "erreur">("attente");
  const [envoi, start] = React.useTransition();
  const quoi = s === "conseils" ? "les conseils qui suivent votre diagnostic" : "l'annonce d'ouverture de cette formation";
  if (etat === "fait")
    return (
      <>
        <h1 className="mt-4 type-display max-w-[16ch]">C&apos;est fait.</h1>
        <p className="mt-6 max-w-[36rem] type-lead text-foreground/75">Vous ne recevrez plus {quoi}.</p>
        <Link href="/" className="link-quiet mt-8 inline-block">
          Retour à l&apos;accueil
        </Link>
      </>
    );
  return (
    <>
      <h1 className="mt-4 type-display max-w-[16ch]">Se désinscrire</h1>
      <p className="mt-6 max-w-[36rem] type-lead text-foreground/75">Vous ne recevrez plus {quoi}.</p>
      <button
        type="button"
        disabled={envoi}
        className="btn-primary mt-8 disabled:opacity-60"
        onClick={() => start(async () => setEtat((await desinscrire({ e, s, t }).catch(() => ({ ok: false }))).ok ? "fait" : "erreur"))}
      >
        Confirmer la désinscription
      </button>
      {etat === "erreur" && (
        <p role="alert" className="mt-3 type-small font-medium text-[oklch(0.5_0.15_40)]">
          Ce lien n&apos;est pas valide. Répondez simplement à l&apos;email reçu : nous vous désinscrirons à la main.
        </p>
      )}
    </>
  );
}
