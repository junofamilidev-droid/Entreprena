"use client";

import * as React from "react";
import { BellIcon, XIcon } from "lucide-react";
import { AchatForm } from "@/components/site/achat-form";
import { PrevenirForm } from "@/components/site/prevenir-form";

// Achat direct depuis la carte d'une formation (accueil, catalogue) : une petite fenêtre par-dessus la page,
// avec la case de renonciation puis le paiement. Ventes fermées : la même fenêtre propose d'être prévenu.
export function AchatRapide({ formation, titre, prix, ventesOuvertes }: { formation: string; titre: string; prix: string; ventesOuvertes: boolean }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titreId = React.useId();
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="btn-primary">
        {ventesOuvertes ? (
          `Acheter · ${prix}`
        ) : (
          <>
            <BellIcon className="size-4" aria-hidden /> Être prévenu
          </>
        )}
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titreId}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
        className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[24px] border border-border bg-background p-0 text-foreground shadow-[0_40px_100px_-30px_rgb(0_0_0/0.45)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
      >
        <div className="relative p-6 sm:p-8">
          <button type="button" onClick={() => ref.current?.close()} aria-label="Fermer" className="absolute top-4 right-4 grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <XIcon className="size-4" aria-hidden />
          </button>
          <p className="type-small text-muted-foreground">{ventesOuvertes ? "Accès au parcours complet" : "Ouverture des ventes"}</p>
          <h2 id={titreId} className="mt-1 pr-8 font-display text-[1.5rem] leading-[1.15] font-semibold tracking-[-0.025em]">
            {titre}
          </h2>
          {ventesOuvertes ? (
            <>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-[2rem] leading-none font-semibold tracking-[-0.04em]">{prix}</span>
                <span className="type-small text-muted-foreground">prix de lancement · paiement unique</span>
              </p>
              <div className="mt-6">
                <AchatForm formation={formation} prix={prix} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-3 type-body text-foreground/75">Le paiement en ligne ouvre très bientôt. Laissez votre email : nous vous écrivons une seule fois, à l&apos;ouverture.</p>
              <PrevenirForm cle={`ventes:${formation}`} bouton="Me prévenir" className="mt-5" />
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
