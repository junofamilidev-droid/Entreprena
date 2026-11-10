import Link from "next/link";
import { ArrowRightIcon, CheckIcon, FileCodeIcon, FileTextIcon, FolderIcon, MinusIcon } from "lucide-react";
import type { FormationWithModules } from "@/lib/content/types";
import { plain } from "@/lib/vitrine/text";
import { exempleDe } from "@/lib/vitrine/exemples";
import { libelleMetier, type MetierAVenir } from "@/lib/vitrine/metiers";
import { VENTES_OUVERTES, type PageFormation } from "@/lib/vitrine/pages-formation";
import { AppWindow, Eyebrow, Frame, LightNumber, SectionHead } from "@/components/site/kit";
import { MockMission, MockOutil, MockVerifs } from "@/components/site/mock-screens";
import { Faq } from "@/components/site/faq";
import { FormationUpcoming } from "@/components/site/formation-upcoming";
import { PrevenirForm } from "@/components/site/prevenir-form";

// Pages de formation (/formations/[slug]).
// - Formation publiée : page de vente complète (programme, kit, méthode, comparatif, tarif, FAQ).
// - Formation en préparation : rien d'inventé, le programme reste flouté, on propose d'être prévenu.

const euros = (n: number) => `${n}\u00a0€`; // espace insécable : « 79 € » ne se coupe jamais

/** Le bouton d'achat, ou « être prévenu » tant que le paiement n'est pas branché. */
function Achat({ slug, prix, sombre }: { slug: string; prix: number; sombre?: boolean }) {
  if (VENTES_OUVERTES)
    return (
      <Link href={`/formations/${slug}/acheter`} className="btn-primary">
        Accéder au parcours ({euros(prix)}) <ArrowRightIcon className="size-4" aria-hidden />
      </Link>
    );
  return (
    <div>
      <p className={sombre ? "type-small text-white/75" : "type-small text-muted-foreground"}>Le paiement en ligne ouvre très bientôt.</p>
      <PrevenirForm cle={`ventes:${slug}`} bouton="Être prévenu de l'ouverture" sombre={sombre} className="mt-3 max-w-[32rem]" />
    </div>
  );
}

function LienDiagnostic({ className }: { className?: string }) {
  return (
    <Link href="/diagnostic" className={`link-quiet type-small ${className ?? ""}`}>
      Pas sûr ? Faites le diagnostic de votre métier
    </Link>
  );
}

export function PageFormationPubliee({ formation, page }: { formation: FormationWithModules; page: PageFormation }) {
  const ex = exempleDe(libelleMetier(formation.domain));
  const ouverts = formation.modules.filter((m) => m.availability === "open");
  const duree = ouverts[0]?.durationLabel;
  return (
    <>
      {/* 1. Haut de page */}
      <section className="site-container grid grid-cols-[minmax(0,1fr)] gap-12 pt-10 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:pb-24">
        <div>
          <Eyebrow>Formation disponible · {libelleMetier(formation.domain)}</Eyebrow>
          <h1 className="mt-5 type-display">{formation.title}</h1>
          <p className="mt-6 max-w-[34rem] type-lead text-foreground/80">
            {plain(formation.promise)} {plain(formation.summary)}
          </p>
          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-display text-[2.5rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">{euros(page.prix)}</span>
            <span className="type-small text-muted-foreground">prix de lancement, paiement unique</span>
          </div>
          <div className="mt-5">
            <Achat slug={formation.slug} prix={page.prix} />
          </div>
          <LienDiagnostic className="mt-6 inline-block" />
        </div>
        <Frame scene="nuit-2" caption="Une session de la formation">
          <AppWindow address={`${formation.slug} · module 1`}>
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
              <MockMission ex={ex} />
              <MockOutil ex={ex} />
            </div>
          </AppWindow>
        </Frame>
      </section>

      {/* Repères */}
      <div className="site-container">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-border bg-border lg:grid-cols-4">
          {[
            [`${formation.modules.length} modules`, "une mission réelle chacun"],
            [duree ? duree.replace(/^environ /, "≈ ") : "À votre rythme", ouverts.length ? "pour le module 1" : "par module"],
            ["1 outil Claude", "par module, à garder"],
            ["0 donnée client", "un dossier fictif complet"],
          ].map(([a, b]) => (
            <div key={a} className="bg-card px-5 py-5 sm:px-7">
              <dt className="font-display text-[1.375rem] font-semibold tracking-[-0.02em]">{a}</dt>
              <dd className="mt-1 type-small text-muted-foreground">{b}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 2. Le programme */}
      <section className="site-container site-section" aria-labelledby="programme">
        <SectionHead eyebrow="Le programme" title={<span id="programme">Une tâche réelle par module, un livrable à la fin.</span>}>
          Chaque module part d&apos;une demande de votre chef de mission, sur le dossier fictif Nordelia, et se termine par un document que vous pourriez lui transmettre.
        </SectionHead>
        <ol className="mt-12 grid gap-3">
          {formation.modules.map((m) => {
            const ouvert = m.availability === "open";
            return (
              <li key={m.id} className="grid gap-4 rounded-[22px] border border-border bg-card p-6 sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:p-7">
                <LightNumber n={m.position} className="text-[2rem] leading-none" />
                <div>
                  <h3 className="type-h3">{m.title}</h3>
                  {m.summary && <p className="mt-2 max-w-[44rem] type-body text-foreground/75">{plain(m.summary)}</p>}
                  <p className="mt-3 type-small">
                    <span className="font-semibold">Vous repartez avec : </span>
                    <span className="text-foreground/80">{plain(m.deliverable)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <span className={ouvert ? "rounded-full bg-primary px-3 py-1 text-[0.8125rem] font-semibold text-primary-foreground" : "rounded-full border border-border px-3 py-1 text-[0.8125rem] text-muted-foreground"}>
                    {ouvert ? "Disponible" : "Prochainement"}
                  </span>
                  {m.durationLabel && <span className="type-small text-muted-foreground">{m.durationLabel}</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 3. Le kit téléchargeable, à côté de l'écran d'exercice */}
      <section className="site-container pb-[var(--section-space)]" aria-labelledby="kit">
        <SectionHead eyebrow="Le kit téléchargeable" title={<span id="kit">L&apos;outil que vous installez dans Claude.</span>}>
          {page.kit.intro}
        </SectionHead>
        <Frame scene="nuit-1" caption={page.kit.module} className="mt-12">
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="grid content-start gap-3">
              <p className="text-[0.8125rem] font-medium text-white/80">L&apos;exercice</p>
              <MockMission ex={ex} />
              <MockVerifs ex={ex} />
            </div>
            <div className="grid content-start gap-3">
              <p className="text-[0.8125rem] font-medium text-white/80">Ce que contient le kit</p>
              <div className="rounded-[14px] bg-[oklch(0.99_0.003_85)] p-4 text-[oklch(0.22_0.02_200)] sm:p-5">
                <p className="flex items-center gap-2 font-mono text-[0.8125rem] font-semibold">
                  <FolderIcon className="size-4 text-[oklch(0.55_0.09_200)]" aria-hidden /> {page.kit.nom}/
                </p>
                <ul className="mt-3 grid gap-2.5 border-l border-[oklch(0.9_0.005_200)] pl-4">
                  {page.kit.fichiers.map((f) => (
                    <li key={f.nom} className="text-[0.8125rem] leading-snug">
                      <span className="flex items-center gap-1.5 font-mono font-medium">
                        {f.nom.endsWith(".py") ? <FileCodeIcon className="size-3.5 shrink-0" aria-hidden /> : <FileTextIcon className="size-3.5 shrink-0" aria-hidden />}
                        {f.nom}
                      </span>
                      <span className="mt-0.5 block text-[oklch(0.42_0.02_200)]">{f.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[14px] bg-[oklch(0.99_0.003_85)] p-4 text-[oklch(0.22_0.02_200)] sm:p-5">
                <p className="text-[0.6875rem] font-medium text-[oklch(0.5_0.02_200)]">Les commandes</p>
                <ul className="mt-3 grid gap-2.5">
                  {page.kit.commandes.map((c) => (
                    <li key={c.commande} className="grid grid-cols-[7.5rem_1fr] gap-3 text-[0.8125rem] leading-snug">
                      <code className="self-start rounded-md bg-[oklch(0.3_0.05_200)] px-2 py-1 text-center font-mono text-[0.75rem] text-white">{c.commande}</code>
                      <span>{c.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Frame>
        <p className="mt-6 max-w-[44rem] type-body text-foreground/80">
          <span className="font-semibold">Le livrable : </span>
          {page.kit.livrable} Chaque module livre son propre outil, à sa sortie.
        </p>
      </section>

      {/* 4. La méthode */}
      {formation.method.length > 0 && (
        <section className="bg-card site-section" aria-labelledby="methode">
          <div className="site-container">
            <SectionHead eyebrow="La méthode" title={<span id="methode">La même routine, à chaque tâche.</span>} />
            <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {formation.method.map((s, i) => (
                <li key={s.title} className="border-t border-border pt-6">
                  <LightNumber n={i + 1} className="text-[1.75rem]" />
                  <h3 className="mt-3 type-h3">{s.title}</h3>
                  <p className="mt-2 type-body text-foreground/75">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* 5. Pour qui */}
      <section className="site-container site-section grid gap-12 lg:grid-cols-2 lg:gap-20" aria-label="À qui s'adresse la formation">
        <div>
          <h2 className="type-h2">C&apos;est pour vous si…</h2>
          <ul className="mt-8 grid gap-4">
            {formation.forWhom.map((t) => (
              <li key={t} className="flex gap-3 type-body">
                <CheckIcon className="mt-1.5 size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                {plain(t)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="type-h2">Ce n&apos;est pas…</h2>
          <ul className="mt-8 grid gap-4">
            {formation.notThis.map((t) => (
              <li key={t} className="flex gap-3 type-body text-foreground/80">
                <MinusIcon className="mt-1.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                {plain(t)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Comparatif */}
      <section className="site-container pb-[var(--section-space)]" aria-labelledby="comparatif">
        <SectionHead eyebrow="La différence" title={<span id="comparatif">Seul face à l&apos;IA, ou avec la formation.</span>} />
        <div className="mt-12 overflow-hidden rounded-[24px] border border-border">
          <div className="hidden grid-cols-[12rem_1fr_1fr] bg-muted/60 text-[0.875rem] font-semibold md:grid">
            <span className="px-6 py-4" />
            <span className="px-6 py-4 text-muted-foreground">Seul face à l&apos;IA</span>
            <span className="bg-primary/[0.07] px-6 py-4 text-primary">Avec la formation</span>
          </div>
          {page.comparatif.map((r) => (
            <div key={r.critere} className="grid border-t border-border first:border-t-0 md:grid-cols-[12rem_1fr_1fr] md:first:border-t">
              <p className="px-6 pt-5 font-semibold md:py-5">{r.critere}</p>
              <p className="px-6 pt-2 type-small text-foreground/70 md:py-5">
                <span className="font-medium md:hidden">Seul : </span>
                {r.seul}
              </p>
              <p className="mt-2 bg-primary/[0.07] px-6 py-3 type-small md:mt-0 md:py-5">
                <span className="font-medium text-primary md:hidden">Avec la formation : </span>
                {r.formation}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Tarif */}
      <section className="on-night site-section" aria-labelledby="tarif">
        <div className="site-container grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
          <div>
            <Eyebrow className="text-white/75">Le tarif</Eyebrow>
            <h2 id="tarif" className="mt-4 type-h2">
              {formation.title}
            </h2>
            <p className="mt-6 flex items-baseline gap-3">
              <span className="font-display text-[clamp(3rem,2rem+4vw,4.5rem)] leading-none font-semibold tracking-[-0.045em] tabular-nums">{euros(page.prix)}</span>
              <span className="type-body text-white/70">prix de lancement, paiement unique</span>
            </p>
            <div className="mt-8">
              <Achat slug={formation.slug} prix={page.prix} sombre />
            </div>
          </div>
          <div className="rounded-[24px] border border-white/15 bg-white/[0.06] p-6 sm:p-8">
            <p className="type-small font-semibold text-white/80">Ce qui est inclus</p>
            <ul className="mt-5 grid gap-4">
              {page.inclus.map((t) => (
                <li key={t} className="flex gap-3 type-body">
                  <CheckIcon className="mt-1.5 size-4 shrink-0 text-[oklch(0.86_0.11_82)]" strokeWidth={2.5} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-white/15 pt-5 type-small text-white/65">Il vous faut aussi un compte Claude : voir les questions fréquentes.</p>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="site-container site-section grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20" aria-labelledby="faq">
        <div>
          <h2 id="faq" className="type-h2">
            Questions fréquentes
          </h2>
          <LienDiagnostic className="mt-6 inline-block" />
        </div>
        <Faq items={page.faq} />
      </section>
    </>
  );
}

export function PageFormationAVenir({ metier, index }: { metier: MetierAVenir; index: number }) {
  return (
    <>
      <section className="site-container pt-10 pb-12 sm:pt-16">
        <Eyebrow>Formation en préparation</Eyebrow>
        <h1 className="mt-5 type-display">{metier.nom}</h1>
        <p className="mt-6 max-w-[38rem] type-lead text-foreground/80">{metier.phrase}</p>
        <PrevenirForm cle={metier.diag} className="mt-8 max-w-[34rem]" />
        <LienDiagnostic className="mt-6 inline-block" />
      </section>
      <section className="site-container pb-[var(--section-space)]" aria-label="Programme à venir">
        <FormationUpcoming metier={metier} index={index} lien={false} />
      </section>
    </>
  );
}
