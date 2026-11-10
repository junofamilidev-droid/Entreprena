"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRightIcon, BellIcon, CheckIcon, LockIcon } from "lucide-react";
import { site } from "@/lib/site";
import type { Plan } from "@/lib/diagnostic-metier/plan";
import { demanderNotification, noterClicFormation, obtenirPlan } from "@/app/(diagnostic)/diagnostic/actions";

// Étape 3 du diagnostic : l'email, puis le plan d'action en 3 étapes.
// Le plan n'arrive du serveur qu'une fois l'adresse enregistrée.

export type ReponsesPlan = {
  metier: string;
  metierAutre?: string;
  taches: string[];
  frequence: string;
  cadre: string;
  objectif: string;
  utm?: { source?: string; medium?: string; campaign?: string };
};

const NOM = site.name.replace(/\.$/, "");

export function CaptureEmail({ id, reponses, onPlan }: { id: string | null | undefined; reponses: ReponsesPlan; onPlan: (plan: Plan, email: string) => void }) {
  const [email, setEmail] = React.useState("");
  const [consentement, setConsentement] = React.useState(false);
  const [erreur, setErreur] = React.useState<string | null>(null);
  const [envoi, startEnvoi] = React.useTransition();
  const champ = React.useRef<HTMLInputElement>(null);

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErreur("Vérifiez votre adresse email.");
      champ.current?.focus();
      return;
    }
    startEnvoi(async () => {
      try {
        const r = await obtenirPlan({
          id: id ?? null,
          reponses,
          email,
          consentement,
        });
        if (r.ok) onPlan(r.plan, email.trim().toLowerCase());
        else setErreur(r.erreur);
      } catch {
        setErreur("Le plan n'a pas pu être chargé. Réessayez dans un instant.");
      }
    });
  };

  return (
    <section aria-labelledby="capture-titre" className="relative mt-4 overflow-hidden rounded-[24px] border border-border bg-card p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#e9b872,#4f9e98,transparent)]" />
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(closest-side,rgb(241_212_163/0.35),transparent)]" />
      <p className="inline-flex items-center gap-2 type-small font-medium text-muted-foreground">
        <LockIcon className="size-3.5" aria-hidden /> Votre plan d&apos;action
      </p>
      <h2 id="capture-titre" className="mt-2 max-w-[30ch] font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-[1.15] font-semibold tracking-[-0.03em]">
        Recevez votre plan d&apos;action en 3 étapes, adapté à votre métier.
      </h2>
      <ol className="mt-5 grid gap-2 sm:grid-cols-3">
        {["Ce que votre cadre permet", "Votre tâche la plus exposée, et l'action à tester", "La suite pour votre métier"].map((l, i) => (
          <li key={l} className="flex items-center gap-3 rounded-[14px] bg-muted/60 px-4 py-3 type-small">
            <span aria-hidden className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/[0.08] text-[0.8125rem] font-semibold tabular-nums">
              {i + 1}
            </span>
            {l}
          </li>
        ))}
      </ol>

      <form onSubmit={envoyer} noValidate className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">Votre adresse email</span>
            <input
              ref={champ}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              aria-invalid={erreur ? true : undefined}
              aria-describedby={erreur ? "capture-erreur" : undefined}
              className="h-12 w-full rounded-[14px] border border-input bg-background px-4 type-body outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-[oklch(0.55_0.15_40)]"
            />
          </label>
          <button type="submit" disabled={envoi} className="btn-primary disabled:cursor-wait disabled:opacity-60">
            {envoi ? "Chargement…" : "Voir mon plan"}
          </button>
        </div>
        {erreur && (
          <p id="capture-erreur" role="alert" className="mt-2 type-small font-medium text-[oklch(0.5_0.15_40)]">
            {erreur}
          </p>
        )}
        <label className="mt-4 flex cursor-pointer items-start gap-3 type-small text-foreground/80">
          <input type="checkbox" checked={consentement} onChange={(e) => setConsentement(e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--primary)]" />
          <span>J&apos;accepte de recevoir {/^[aeiouyéèêàâîôûh]/i.test(NOM) ? `d'${NOM}` : `de ${NOM}`} deux emails de conseils sur mon métier, puis l&apos;annonce de l&apos;ouverture de la formation. Désinscription en un clic.</span>
        </label>
        <p className="mt-3 text-[0.875rem] leading-[1.5] text-muted-foreground">{site.emailNotice}</p>
      </form>
    </section>
  );
}

function Etape({ n, titre, children }: { n: number; titre: string; children: React.ReactNode }) {
  return (
    <li className="relative grid grid-cols-[2.25rem_1fr] items-center gap-x-4 pb-8">
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[linear-gradient(135deg,#e9b872,#4f9e98)] font-display text-[1rem] font-semibold text-white tabular-nums">
        {n}
      </span>
      <h3 className="font-display text-[1.25rem] leading-[1.25] font-semibold tracking-[-0.02em]">{titre}</h3>
      {/* Sur mobile, le contenu prend toute la largeur ; dès 640 px, il s'aligne sous le titre. */}
      <div className="col-span-2 mt-3 sm:col-span-1 sm:col-start-2">{children}</div>
    </li>
  );
}

export function PlanAction({ plan, email, id, reponses }: { plan: Plan; email: string; id: string | null | undefined; reponses: ReponsesPlan }) {
  const titre = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => titre.current?.focus(), []);
  const [suite, setSuite] = React.useState(plan.suite);
  const [envoi, startEnvoi] = React.useTransition();

  return (
    <section aria-labelledby="plan-titre" className="diag-ecran mt-4 rounded-[24px] border border-border bg-card p-6 sm:p-8">
      <p className="inline-flex items-center gap-2 type-small font-medium text-[oklch(0.45_0.08_180)]">
        <CheckIcon className="size-4" aria-hidden strokeWidth={2.5} /> Votre plan d&apos;action
      </p>
      <h2 ref={titre} tabIndex={-1} id="plan-titre" className="mt-2 font-display text-[clamp(1.5rem,1.25rem+1vw,2rem)] leading-[1.15] font-semibold tracking-[-0.03em] outline-none">
        3 étapes pour reprendre la main.
      </h2>
      <p className="mt-3 max-w-[40rem] type-body text-foreground/75">{plan.ton}</p>

      <ol className="mt-8">
        <Etape n={1} titre={plan.cadre.titre}>
          <p className="type-body text-foreground/80">{plan.cadre.texte}</p>
        </Etape>
        <Etape n={2} titre={plan.tache.libelle}>
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[16px] bg-muted/60 p-4">
              <dt className="type-small font-semibold">Ce que l&apos;IA sait déjà faire</dt>
              <dd className="mt-1 type-small text-foreground/80">{plan.tache.ia}</dd>
            </div>
            <div className="rounded-[16px] bg-muted/60 p-4">
              <dt className="type-small font-semibold">Ce qui reste sous votre responsabilité</dt>
              <dd className="mt-1 type-small text-foreground/80">{plan.tache.humain}</dd>
            </div>
            <div className="rounded-[16px] border border-[oklch(0.85_0.06_75)] bg-[oklch(0.97_0.03_80)] p-4 sm:col-span-2 dark:border-white/15 dark:bg-white/[0.04]">
              <dt className="type-small font-semibold">L&apos;action à tester cette semaine</dt>
              <dd className="mt-1 type-body">{plan.tache.action}</dd>
            </div>
          </dl>
        </Etape>
        <Etape n={3} titre="La suite">
          {suite.type === "formation" && (
            <>
              <p className="type-body text-foreground/80">Une formation pratique existe pour votre métier : chaque module vous laisse un outil prêt à l&apos;emploi.</p>
              <Link
                href={suite.href}
                onClick={() =>
                  void noterClicFormation({
                    id: id ?? null,
                    metier: reponses.metier,
                  })
                }
                className="btn-primary mt-4"
              >
                {suite.libelle} <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </>
          )}
          {suite.type === "prevenu" && (
            <p className="inline-flex items-start gap-2 type-body text-foreground/80" role="status">
              <BellIcon className="mt-1 size-4 shrink-0" aria-hidden />
              <span>C&apos;est noté : nous vous écrirons à l&apos;ouverture de la formation {suite.metier}.</span>
            </p>
          )}
          {suite.type === "proposer" && (
            <>
              <p className="type-body text-foreground/80">La formation {suite.metier} est en préparation.</p>
              <button
                type="button"
                disabled={envoi}
                onClick={() =>
                  startEnvoi(async () => {
                    const r = await demanderNotification({
                      email,
                      metier: reponses.metier,
                      metierAutre: reponses.metierAutre,
                    }).catch(() => ({ ok: false }));
                    if (r.ok) setSuite({ type: "prevenu", metier: suite.metier });
                  })
                }
                className="btn-primary mt-4 w-full disabled:opacity-60 sm:w-auto"
              >
                <BellIcon className="size-4" aria-hidden /> Me prévenir uniquement de son ouverture
              </button>
            </>
          )}
        </Etape>
      </ol>
    </section>
  );
}
