"use client";

import * as React from "react";
import { BellIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { etrePrevenu } from "@/app/(site)/formations/actions";

// Formulaire « Me prévenir de l'ouverture » : un champ email, un bouton, une confirmation.
export function PrevenirForm({ cle, bouton = "Me prévenir de l'ouverture", sombre, className }: { cle: string; bouton?: string; sombre?: boolean; className?: string }) {
  const [email, setEmail] = React.useState("");
  const [robot, setRobot] = React.useState("");
  const [etat, setEtat] = React.useState<"saisie" | "ok">("saisie");
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, startEnvoi] = React.useTransition();
  const id = React.useId();

  if (etat === "ok")
    return (
      <p role="status" className={cn("flex items-start gap-2 type-body font-medium", className)}>
        <CheckIcon className="mt-1 size-4 shrink-0" aria-hidden strokeWidth={2.5} /> C&apos;est noté : nous vous écrirons une seule fois, à l&apos;ouverture.
      </p>
    );

  return (
    <form
      noValidate
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        setErreur(null);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setErreur("Vérifiez votre adresse email.");
        startEnvoi(async () => {
          const r = await etrePrevenu({ email, cle, site: robot }).catch(() => ({ ok: false, erreur: "L'inscription n'a pas pu être enregistrée. Réessayez dans un instant." }));
          if (r.ok) setEtat("ok");
          else setErreur(r.erreur ?? "Vérifiez votre adresse email.");
        });
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Votre adresse email</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            aria-invalid={erreur ? true : undefined}
            aria-describedby={erreur ? `${id}-err` : `${id}-aide`}
            className={cn(
              "h-12 w-full rounded-[14px] border px-4 type-body outline-none focus-visible:ring-2",
              sombre ? "border-white/25 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/40" : "border-input bg-card focus-visible:border-ring focus-visible:ring-ring/30",
            )}
          />
        </label>
        {/* Piège à robots, invisible pour les visiteurs et les lecteurs d'écran. */}
        <input tabIndex={-1} aria-hidden autoComplete="off" value={robot} onChange={(e) => setRobot(e.target.value)} name="site" className="absolute -left-[9999px] size-px opacity-0" />
        <button type="submit" disabled={envoi} className="btn-primary disabled:opacity-60">
          <BellIcon className="size-4" aria-hidden /> {envoi ? "Envoi…" : bouton}
        </button>
      </div>
      {erreur ? (
        <p id={`${id}-err`} role="alert" className="mt-2 type-small font-medium text-[oklch(0.55_0.15_40)]">
          {erreur}
        </p>
      ) : (
        <p id={`${id}-aide`} className={cn("mt-2 text-[0.875rem]", sombre ? "text-white/65" : "text-muted-foreground")}>
          Un seul email, à l&apos;ouverture. Votre adresse n&apos;est ni partagée ni revendue.
        </p>
      )}
    </form>
  );
}
