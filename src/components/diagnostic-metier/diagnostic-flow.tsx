"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { AUTRE, type MetierPublic } from "@/lib/diagnostic-metier/public";
import { calculer, type Cadre, type Frequence, type Objectif } from "@/lib/diagnostic-metier/calcul";
import { enregistrerDiagnostic } from "@/app/(diagnostic)/diagnostic/actions";
import { ResultatDiagnostic } from "./resultat";

// Parcours du diagnostic : intro, 5 questions (une par écran), puis le résultat.
// - Choix unique : la carte se sélectionne, puis passage automatique après 250 ms.
// - Choix multiple (tâches) : 1 à 3, bouton « Continuer ».
// - « Autre métier » : champ texte, « Continuer » actif dès 2 caractères.
// - Clavier : 1 à 9 pour choisir, Entrée pour continuer. Réponses gardées dans le navigateur.

type Etat = {
  etape: number; // 0 intro, 1 à 5 questions, 6 résultat
  metier?: string;
  metierAutre?: string;
  taches: string[];
  frequence?: Frequence;
  cadre?: Cadre;
  objectif?: Objectif;
  utm?: { source?: string; medium?: string; campaign?: string };
  /** Identifiant renvoyé par le serveur après l'enregistrement du résultat. */
  diagnosticId?: string | null;
};

const CLE = "diagnostic-metier-v1";
const VIDE: Etat = { etape: 0, taches: [] };

const FREQUENCES: { v: Frequence; l: string }[] = [
  { v: "jamais", l: "Jamais" },
  { v: "mois", l: "Quelques fois par mois" },
  { v: "semaine", l: "Chaque semaine" },
  { v: "jour", l: "Chaque jour" },
];
const CADRES: { v: Cadre; l: string }[] = [
  { v: "outil", l: "Oui, avec un outil fourni" },
  { v: "autorise", l: "Autorisé, sans outil fourni" },
  { v: "interdit", l: "Interdit" },
  { v: "ne_sait_pas", l: "Je ne sais pas" },
];
const OBJECTIFS: { v: Objectif; l: string }[] = [
  { v: "temps", l: "Gagner du temps sur mes tâches" },
  { v: "indispensable", l: "Rester indispensable dans mon poste" },
  { v: "evoluer", l: "Évoluer vers un autre poste" },
  { v: "comprendre", l: "Comprendre ce qui va changer" },
];

function lire(): Etat | null {
  try {
    const raw = localStorage.getItem(CLE);
    return raw ? (JSON.parse(raw) as Etat) : null;
  } catch {
    return null;
  }
}
function ecrire(e: Etat) {
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {}
}

export function DiagnosticFlow({ metiers }: { metiers: MetierPublic[] }) {
  const [etat, setEtat] = React.useState<Etat>(VIDE);
  const [pret, setPret] = React.useState(false);
  const [sens, setSens] = React.useState<1 | -1>(1);
  const avance = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Reprise : le visiteur qui revient retrouve ses réponses ; les paramètres utm de l'arrivée sont gardés.
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const utm = { source: q.get("utm_source") ?? undefined, medium: q.get("utm_medium") ?? undefined, campaign: q.get("utm_campaign") ?? undefined };
    const sauve = lire();
    const t = setTimeout(() => {
      setEtat({ ...(sauve ?? VIDE), utm: utm.source || utm.medium || utm.campaign ? utm : sauve?.utm });
      setPret(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  React.useEffect(() => {
    if (pret) ecrire(etat);
  }, [etat, pret]);
  React.useEffect(() => () => clearTimeout(avance.current), []);

  const metier = metiers.find((m) => m.id === etat.metier);
  const aller = React.useCallback((etape: number) => {
    clearTimeout(avance.current);
    setEtat((e) => {
      setSens(etape >= e.etape ? 1 : -1);
      return { ...e, etape };
    });
  }, []);
  const choisirPuisAvancer = (patch: Partial<Etat>, suivante: number) => {
    setEtat((e) => ({ ...e, ...patch, diagnosticId: undefined }));
    clearTimeout(avance.current);
    avance.current = setTimeout(() => aller(suivante), 250);
  };

  if (!pret) return <div className="min-h-dvh" aria-busy="true" />;

  const question = etat.etape >= 1 && etat.etape <= 5;

  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_15%_0%,rgb(241_212_163/0.45),transparent),radial-gradient(55%_50%_at_95%_100%,rgb(134_181_173/0.4),transparent)]" />

      <header className="site-container flex h-16 items-center gap-6">
        <span className="font-display text-[1.375rem] font-semibold tracking-tight" aria-label={site.name}>
          {site.name.replace(/\.$/, "")}
          <span className="text-primary">.</span>
        </span>
        <div className="flex flex-1 justify-center">
          {question && <Progression etape={etat.etape} />}
        </div>
        <Link href="/" className="rounded-md px-2 py-2 text-[0.9375rem] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
          Quitter
        </Link>
      </header>

      <main className="site-container flex flex-1 flex-col pt-6 pb-10 sm:pt-12">
        <div key={etat.etape} className={cn("diag-ecran mx-auto flex w-full max-w-[52rem] flex-1 flex-col", sens < 0 && "diag-retour")}>
          {etat.etape === 0 && <Intro onStart={() => aller(1)} />}

          {etat.etape === 1 && (
            <Question numero={1} titre="Quel est votre métier ?" onRetour={() => aller(0)}>
              <ChoixMetier
                metiers={metiers}
                valeur={etat.metier}
                autre={etat.metierAutre ?? ""}
                onChoisir={(id) => choisirPuisAvancer({ metier: id, taches: id === etat.metier ? etat.taches : [] }, 2)}
                onAutre={() => setEtat((e) => ({ ...e, metier: AUTRE, taches: e.metier === AUTRE ? e.taches : [] }))}
                onAutreTexte={(v) => setEtat((e) => ({ ...e, metierAutre: v, diagnosticId: undefined }))}
                onContinuer={() => aller(2)}
              />
            </Question>
          )}

          {etat.etape === 2 && metier && (
            <Question numero={2} titre="Quelles tâches occupent le plus votre semaine ?" aide="3 au maximum, au moins 1." onRetour={() => aller(1)}>
              <ChoixTaches metier={metier} valeur={etat.taches} onChange={(taches) => setEtat((e) => ({ ...e, taches, diagnosticId: undefined }))} onContinuer={() => aller(3)} />
            </Question>
          )}

          {etat.etape === 3 && (
            <Question numero={3} titre="À quelle fréquence utilisez-vous l'IA dans votre travail ?" onRetour={() => aller(2)}>
              <ChoixUnique options={FREQUENCES} valeur={etat.frequence} onChoisir={(v) => choisirPuisAvancer({ frequence: v }, 4)} />
            </Question>
          )}

          {etat.etape === 4 && (
            <Question numero={4} titre="Votre employeur encadre-t-il l'usage de l'IA ?" onRetour={() => aller(3)}>
              <ChoixUnique options={CADRES} valeur={etat.cadre} onChoisir={(v) => choisirPuisAvancer({ cadre: v }, 5)} />
            </Question>
          )}

          {etat.etape === 5 && (
            <Question numero={5} titre="Face à l'IA, vous cherchez surtout à…" onRetour={() => aller(4)}>
              <ChoixUnique options={OBJECTIFS} valeur={etat.objectif} onChoisir={(v) => choisirPuisAvancer({ objectif: v }, 6)} />
            </Question>
          )}

          {etat.etape === 6 && metier && etat.frequence && etat.cadre && etat.objectif && (
            <EcranResultat
              metier={metier}
              etat={etat as Etat & { frequence: Frequence; cadre: Cadre; objectif: Objectif }}
              onId={(id) => setEtat((e) => ({ ...e, diagnosticId: id }))}
              onRefaire={() => {
                setEtat({ ...VIDE, utm: etat.utm });
                setSens(-1);
              }}
            />
          )}

          {/* Étape incohérente (données anciennes) : on repart proprement. */}
          {((etat.etape >= 2 && etat.etape <= 6 && !metier) || etat.etape > 6) && <Intro onStart={() => setEtat({ ...VIDE, etape: 1, utm: etat.utm })} />}
        </div>
      </main>
    </div>
  );
}

function Progression({ etape }: { etape: number }) {
  return (
    <div className="flex w-full max-w-[20rem] gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={etape} aria-label={`Question ${etape} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
          <span
            className="block h-full origin-left rounded-full bg-[linear-gradient(90deg,#e9b872,#4f9e98)] transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `scaleX(${i <= etape ? 1 : 0})` }}
          />
        </span>
      ))}
    </div>
  );
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
      <p className="inline-flex items-center gap-2.5 text-[0.9375rem] font-medium text-foreground/70">
        <span aria-hidden className="inline-block size-2.5 rounded-full bg-[conic-gradient(from_200deg,#e9b872,#f6e7c8,#4f9e98,#e9b872)]" />
        Diagnostic
      </p>
      <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.5rem,1.6rem+4vw,4.5rem)] leading-[1] font-semibold tracking-[-0.045em]">Votre métier face à l&apos;IA.</h1>
      <p className="mt-5 type-lead text-foreground/75">5 questions, 2 minutes. Résultat immédiat.</p>
      <button type="button" onClick={onStart} className="btn-primary mt-9">
        Commencer
      </button>
      <p className="mt-6 type-small text-muted-foreground">Estimation indicative, pas une mesure scientifique.</p>
    </div>
  );
}

function Question({ numero, titre, aide, onRetour, children }: { numero: number; titre: string; aide?: string; onRetour: () => void; children: React.ReactNode }) {
  const ref = React.useRef<HTMLHeadingElement>(null);
  // Le focus va au titre de la question : les lecteurs d'écran l'annoncent à chaque écran.
  React.useEffect(() => ref.current?.focus(), []);
  return (
    <div className="flex flex-1 flex-col">
      <button type="button" onClick={onRetour} className="inline-flex min-h-11 items-center gap-2 self-start rounded-md text-[0.9375rem] text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
        <ArrowLeftIcon className="size-4" aria-hidden /> Retour
      </button>
      <p className="mt-6 text-[0.9375rem] font-medium text-muted-foreground">Question {numero} sur 5</p>
      <h1 ref={ref} tabIndex={-1} className="mt-2 font-display text-[clamp(1.875rem,1.3rem+2.4vw,3rem)] leading-[1.08] font-semibold tracking-[-0.035em] outline-none">
        {titre}
      </h1>
      {aide && <p className="mt-3 type-body text-muted-foreground">{aide}</p>}
      <div className="mt-8">{children}</div>
    </div>
  );
}

/** Raccourcis : 1 à 9 choisit la carte correspondante. */
function useRaccourcis(n: number, onChoix: (i: number) => void, onEntree?: () => void) {
  const choix = React.useRef(onChoix);
  const entree = React.useRef(onEntree);
  React.useEffect(() => {
    choix.current = onChoix;
    entree.current = onEntree;
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = Number(e.key);
      if (k >= 1 && k <= Math.min(9, n)) {
        e.preventDefault();
        choix.current(k - 1);
      } else if (e.key === "Enter" && entree.current && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        entree.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [n]);
}

function Carte({
  role,
  checked,
  index,
  onClick,
  children,
  disabled,
}: {
  role: "radio" | "checkbox";
  checked: boolean;
  index: number;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={onClick}
      className={cn(
        "group flex min-h-16 w-full items-center gap-4 rounded-[18px] border px-5 py-4 text-left type-body transition-[background-color,border-color,box-shadow,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.99]",
        checked
          ? "border-primary bg-primary/[0.06] shadow-[0_10px_30px_-18px_rgb(20_70_70/0.6)]"
          : "border-border bg-card/80 hover:border-foreground/25 hover:bg-card",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center text-[0.8125rem] font-semibold tabular-nums transition-colors",
          role === "radio" ? "rounded-full" : "rounded-[8px]",
          checked ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
        )}
      >
        {checked ? <CheckIcon className="size-4" strokeWidth={2.75} /> : index <= 9 ? index : ""}
      </span>
      <span className="flex-1 font-medium">{children}</span>
    </button>
  );
}

function ChoixUnique<T extends string>({ options, valeur, onChoisir }: { options: { v: T; l: string }[]; valeur?: T; onChoisir: (v: T) => void }) {
  useRaccourcis(options.length, (i) => onChoisir(options[i].v));
  return (
    <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
      {options.map((o, i) => (
        <Carte key={o.v} role="radio" checked={valeur === o.v} index={i + 1} onClick={() => onChoisir(o.v)}>
          {o.l}
        </Carte>
      ))}
    </div>
  );
}

function ChoixMetier({
  metiers,
  valeur,
  autre,
  onChoisir,
  onAutre,
  onAutreTexte,
  onContinuer,
}: {
  metiers: MetierPublic[];
  valeur?: string;
  autre: string;
  onChoisir: (id: string) => void;
  onAutre: () => void;
  onAutreTexte: (v: string) => void;
  onContinuer: () => void;
}) {
  const champ = React.useRef<HTMLInputElement>(null);
  const autreOk = autre.trim().length >= 2;
  const choisir = (m: MetierPublic) => {
    if (m.id === AUTRE) {
      onAutre();
      setTimeout(() => champ.current?.focus(), 0);
    } else onChoisir(m.id);
  };
  useRaccourcis(metiers.length, (i) => choisir(metiers[i]));
  return (
    <div>
      <div role="radiogroup" aria-label="Votre métier" className="grid gap-3 sm:grid-cols-2">
        {metiers.map((m, i) => (
          <Carte key={m.id} role="radio" checked={valeur === m.id} index={i + 1} onClick={() => choisir(m)}>
            {m.libelle}
          </Carte>
        ))}
      </div>
      {valeur === AUTRE && (
        <form
          className="diag-ecran mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (autreOk) onContinuer();
          }}
        >
          <label className="flex-1">
            <span className="type-small font-medium">Votre métier</span>
            <input
              ref={champ}
              value={autre}
              maxLength={60}
              onChange={(e) => onAutreTexte(e.target.value)}
              placeholder="Par exemple : pharmacien"
              className="mt-2 h-12 w-full rounded-[14px] border border-input bg-card px-4 type-body outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>
          <button type="submit" disabled={!autreOk} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
            Continuer
          </button>
        </form>
      )}
    </div>
  );
}

function ChoixTaches({ metier, valeur, onChange, onContinuer }: { metier: MetierPublic; valeur: string[]; onChange: (v: string[]) => void; onContinuer: () => void }) {
  const [alerte, setAlerte] = React.useState(false);
  const basculer = (id: string) => {
    if (valeur.includes(id)) {
      setAlerte(false);
      onChange(valeur.filter((x) => x !== id));
    } else if (valeur.length >= 3) setAlerte(true);
    else onChange([...valeur, id]);
  };
  const ok = valeur.length >= 1;
  useRaccourcis(metier.taches.length, (i) => basculer(metier.taches[i].id), () => ok && onContinuer());
  return (
    <div>
      <div role="group" aria-label="Vos tâches principales" className="grid gap-3 sm:grid-cols-2">
        {metier.taches.map((t, i) => (
          <Carte key={t.id} role="checkbox" checked={valeur.includes(t.id)} index={i + 1} onClick={() => basculer(t.id)}>
            {t.libelle}
          </Carte>
        ))}
      </div>
      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center justify-between gap-4 bg-[linear-gradient(to_top,var(--background)_60%,transparent)] py-4">
        <p className="type-small text-muted-foreground" aria-live="polite">
          {alerte ? <span className="font-medium text-[oklch(0.5_0.13_55)]">Choisissez-en 3 au maximum.</span> : `${valeur.length} sur 3 choisie${valeur.length > 1 ? "s" : ""}`}
        </p>
        <button type="button" onClick={onContinuer} disabled={!ok} className="btn-primary disabled:cursor-not-allowed disabled:opacity-40">
          Continuer
        </button>
      </div>
    </div>
  );
}

/**
 * Écran de résultat : affiché tout de suite (calcul local), et enregistré une seule fois côté serveur,
 * qui recalcule le score et renvoie l'identifiant du diagnostic (gardé pour les étapes suivantes).
 */
function EcranResultat({
  metier,
  etat,
  onId,
  onRefaire,
}: {
  metier: MetierPublic;
  etat: Etat & { frequence: Frequence; cadre: Cadre; objectif: Objectif };
  onId: (id: string | null) => void;
  onRefaire: () => void;
}) {
  const reponses = { metier: metier.id, metierAutre: etat.metierAutre, taches: etat.taches, frequence: etat.frequence, cadre: etat.cadre, objectif: etat.objectif };
  const resultat = calculer(reponses, metier.taches);
  const dejaEnregistre = etat.diagnosticId !== undefined;
  const envoye = React.useRef(false);
  React.useEffect(() => {
    if (dejaEnregistre || envoye.current) return;
    envoye.current = true;
    enregistrerDiagnostic({ ...reponses, utm: etat.utm })
      .then((r) => onId(r.ok ? r.id : null))
      .catch(() => onId(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <ResultatDiagnostic metier={metier} resultat={resultat} metierAutre={etat.metierAutre} onRefaire={onRefaire} />;
}
