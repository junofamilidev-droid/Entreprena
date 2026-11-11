import Link from "next/link";
import { CheckIcon, FileCodeIcon, FileTextIcon, FolderIcon, MinusIcon, PackageIcon, BriefcaseIcon, XIcon } from "lucide-react";
import type { FormationWithModules } from "@/lib/content/types";
import { plain } from "@/lib/vitrine/text";
import { exempleDe } from "@/lib/vitrine/exemples";
import { libelleMetier, type MetierAVenir } from "@/lib/vitrine/metiers";
import type { PageFormation } from "@/lib/vitrine/pages-formation";
import { ventesOuvertes } from "@/lib/stripe";
import { AchatForm } from "@/components/site/achat-form";
import { AppWindow, Eyebrow, Frame, LightDot, LightNumber, SectionHead } from "@/components/site/kit";
import { MockMission, MockOutil, MockVerifs } from "@/components/site/mock-screens";
import { Faq } from "@/components/site/faq";
import { FormationUpcoming } from "@/components/site/formation-upcoming";
import { PrevenirForm } from "@/components/site/prevenir-form";
import { HeroAbstract } from "@/components/site/hero-abstract";

// Pages de formation (/formations/[slug]).
// - Formation publiée : page de vente complète (programme, kit, méthode, comparatif, tarif, FAQ).
// - Formation en préparation : rien d'inventé, le programme reste flouté, on propose d'être prévenu.

const euros = (n: number) => `${n}\u00a0€`; // espace insécable : « 79 € » ne se coupe jamais

/** Le bouton d'achat, ou « être prévenu » tant que le paiement n'est pas branché (pas de clé Stripe). */
function Achat({ slug, prix }: { slug: string; prix: number }) {
  if (ventesOuvertes()) return <AchatForm formation={slug} prix={euros(prix)} />;
  return (
    <div>
      <p className="type-small text-muted-foreground">Le paiement en ligne ouvre très bientôt.</p>
      <PrevenirForm cle={`ventes:${slug}`} bouton="Être prévenu de l'ouverture" className="mt-3 max-w-[32rem]" />
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

/** Texte où les passages ==ainsi== ressortent : plus foncés, soulignés d'un trait de lumière. */
function Surligne({ texte }: { texte: string }) {
  return texte.split(/==(.+?)==/g).map((t, i) =>
    i % 2 ? (
      <span key={i} className="font-medium text-foreground [background:linear-gradient(90deg,rgb(233_184_114/0.55),rgb(79_158_152/0.45))_0_100%/100%_0.3em_no-repeat]">
        {t}
      </span>
    ) : (
      t
    ),
  );
}

export function PageFormationPubliee({ formation, page }: { formation: FormationWithModules; page: PageFormation }) {
  const ex = exempleDe(libelleMetier(formation.domain));
  const n = formation.modules.length;
  return (
    <>
      {/* 1. Haut de page : tient dans l'écran (titre, promesse, prix et bouton visibles sans défiler). */}
      <section className="site-container grid grid-cols-[minmax(0,1fr)] gap-10 pt-8 pb-14 sm:pt-12 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:py-10 [@media(min-width:1024px)_and_(max-height:720px)]:lg:py-6">
        <div>
          <Eyebrow>Formation disponible · {libelleMetier(formation.domain)}</Eyebrow>
          <h1 className="mt-4 max-w-[13ch] font-display text-[clamp(2.75rem,1.5rem+3.6vw,4.75rem)] [@media(min-width:1024px)_and_(max-height:720px)]:text-[3.5rem] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">{formation.title}</h1>
          <p className="mt-6 max-w-[34rem] text-[clamp(1.25rem,1.1rem+0.55vw,1.5rem)] [@media(min-width:1024px)_and_(max-height:720px)]:mt-4 [@media(min-width:1024px)_and_(max-height:720px)]:text-[1.25rem] leading-[1.45] text-foreground/70 text-pretty">
            <Surligne texte={formation.promise} />
          </p>
          <p className="mt-4 max-w-[34rem] type-small text-muted-foreground text-pretty">{plain(formation.summary)}</p>

          <div className="mt-8 max-w-[34rem] rounded-[22px] border border-border bg-card/80 p-5 [@media(min-width:1024px)_and_(max-height:720px)]:mt-5 shadow-[0_24px_60px_-40px_rgb(20_60_60/0.45)] backdrop-blur sm:p-6">
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[2.25rem] leading-none font-semibold tracking-[-0.04em] tabular-nums">{euros(page.prix)}</span>
              <span className="type-small text-muted-foreground">prix de lancement · paiement unique</span>
            </p>
            <div className="mt-4">
              <Achat slug={formation.slug} prix={page.prix} />
            </div>
          </div>
          <LienDiagnostic className="mt-5 inline-block" />
        </div>
        <Frame scene="nuit-2" caption="Une session de la formation" bodyClassName="sm:px-8 sm:pt-6 sm:pb-8">
          <AppWindow address={`${formation.slug} · module 1`}>
            <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4">
              <MockMission ex={ex} />
              <MockOutil ex={ex} />
            </div>
          </AppWindow>
        </Frame>
      </section>

      {/* Repères : trois chiffres, sans cadre */}
      <div className="site-container">
        <dl className="grid border-y border-border sm:grid-cols-3">
          {[
            [String(n), n > 1 ? "modules" : "module", "une tâche réelle de l'audit chacun"],
            [String(n), n > 1 ? "outils Claude" : "outil Claude", "un par module, que vous gardez"],
            ["0", "donnée client", "tout se fait sur un dossier fictif"],
          ].map(([chiffre, unite, detail], i) => (
            <div key={unite} className={`flex items-center gap-5 py-6 sm:px-8 sm:py-8 ${i > 0 ? "border-t border-border sm:border-t-0 sm:border-l" : "sm:pl-0"}`}>
              <dt className="bg-[linear-gradient(135deg,#d9a35a,#4f9e98)] bg-clip-text font-display text-[3.5rem] leading-none font-semibold tracking-[-0.05em] text-transparent tabular-nums">{chiffre}</dt>
              <dd>
                <span className="block font-display text-[1.25rem] leading-tight font-semibold tracking-[-0.02em]">{unite}</span>
                <span className="mt-1 block type-small text-muted-foreground">{detail}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 2. Le programme : frise verticale */}
      <section className="site-container site-section grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20" aria-labelledby="programme">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Eyebrow>Le programme</Eyebrow>
          <h2 id="programme" className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,1.2rem+2vw,3rem)] leading-[1.02] font-semibold tracking-[-0.04em]">
            Une tâche réelle par module, un outil à la fin.
          </h2>
          <p className="mt-6 max-w-[30rem] type-lead text-foreground/70">
            Chaque module part d&apos;une demande de votre chef de mission sur le dossier fictif Nordelia, et vous laisse un outil Claude prêt à servir.
          </p>
        </div>
        <ol className="relative">
          {/* Le fil de la frise */}
          <span aria-hidden className="absolute top-4 bottom-4 left-[0.4375rem] w-px bg-[linear-gradient(to_bottom,#e9b872,#4f9e98_45%,rgb(79_158_152/0.15))]" />
          {formation.modules.map((m) => (
            <li key={m.id} className="relative grid grid-cols-[0.875rem_minmax(0,1fr)] gap-x-6 pb-14 last:pb-0 sm:gap-x-8">
              <span aria-hidden className="mt-2 size-[0.875rem] rounded-full bg-[conic-gradient(from_200deg,#e9b872,#f6e7c8,#4f9e98,#e9b872)] ring-[5px] ring-background" />
              <div>
                <p className="font-display text-[0.9375rem] font-semibold text-muted-foreground tabular-nums">Module {String(m.position).padStart(2, "0")}</p>
                <h3 className="mt-1 font-display text-[clamp(1.375rem,1.2rem+0.6vw,1.75rem)] leading-[1.15] font-semibold tracking-[-0.025em]">{m.title}</h3>
                <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
                  {m.summary && (
                    <div>
                      <dt className="flex items-center gap-2 text-[0.8125rem] font-semibold tracking-wide text-muted-foreground uppercase">
                        <BriefcaseIcon className="size-3.5" aria-hidden /> Le cas
                      </dt>
                      <dd className="mt-2 type-small text-foreground/75">{plain(m.summary)}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="flex items-center gap-2 text-[0.8125rem] font-semibold tracking-wide text-[oklch(0.5_0.08_190)] uppercase">
                      <PackageIcon className="size-3.5" aria-hidden /> Vous repartez avec
                    </dt>
                    <dd className="mt-2 type-small font-medium text-foreground/90">{plain(m.deliverable)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
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

      {/* 5. Pour qui : un seul panneau en deux moitiés, relié au reste par son surtitre. */}
      <section className="site-container pb-[var(--section-space)]" aria-labelledby="pour-qui">
        <SectionHead eyebrow="Pour qui" title={<span id="pour-qui">Est-ce la bonne formation pour vous ?</span>} />
        <div className="mt-12 grid overflow-hidden rounded-[28px] border border-border lg:grid-cols-[1.15fr_1fr]">
          <div className="bg-[linear-gradient(160deg,rgb(79_158_152/0.10),rgb(246_231_200/0.35))] p-7 sm:p-10">
            <h3 className="flex items-center gap-3 type-h3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
                <CheckIcon className="size-4" strokeWidth={2.75} aria-hidden />
              </span>
              C&apos;est pour vous si…
            </h3>
            <ul className="mt-7 grid gap-4">
              {formation.forWhom.map((t) => (
                <li key={t} className="flex gap-3 type-body">
                  <CheckIcon className="mt-1.5 size-4 shrink-0 text-primary" strokeWidth={2.5} aria-hidden />
                  {plain(t)}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-border bg-card p-7 sm:p-10 lg:border-t-0 lg:border-l">
            <h3 className="flex items-center gap-3 type-h3 text-foreground/80">
              <span className="grid size-8 place-items-center rounded-full border border-border text-muted-foreground">
                <MinusIcon className="size-4" aria-hidden />
              </span>
              Ce n&apos;est pas…
            </h3>
            <ul className="mt-7 grid gap-4">
              {formation.notThis.map((t) => (
                <li key={t} className="flex gap-3 type-small text-foreground/70">
                  <MinusIcon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {plain(t)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Comparatif */}
      <section className="site-container pb-[var(--section-space)]" aria-labelledby="comparatif">
        <SectionHead eyebrow="La différence" title={<span id="comparatif">Seul face à l&apos;IA, ou avec la formation.</span>} />
        {/* Ordinateur : 3 colonnes, la colonne « Avec la formation » forme un panneau sombre continu.
            Mobile : une carte par critère. */}
        <div className="relative mt-12 hidden md:grid md:grid-cols-[11rem_minmax(0,1fr)_minmax(0,1fr)]" style={{ gridTemplateRows: `repeat(${page.comparatif.length + 1}, auto)` }}>
          {/* Fond de la colonne « Avec la formation » : un voile de lumière léger, posé derrière toutes ses lignes. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 col-start-3 row-span-full row-start-1 rounded-[24px] border border-[rgb(79_158_152/0.22)] bg-[linear-gradient(170deg,rgb(79_158_152/0.13),rgb(246_231_200/0.35)_55%,rgb(233_184_114/0.16))] shadow-[0_30px_70px_-45px_rgb(20_80_80/0.45)]"
          />
          <span />
          <span className="flex items-center gap-2 self-end px-7 pb-5 type-small font-semibold text-muted-foreground">
            <XIcon className="size-4" aria-hidden /> Seul face à l&apos;IA
          </span>
          <span className="relative flex items-center gap-2 px-7 pt-6 pb-5 type-small font-semibold text-[oklch(0.38_0.07_195)]">
            <LightDot /> Avec la formation
          </span>
          {page.comparatif.map((r, i) => {
            const ligne = i === page.comparatif.length - 1 ? "" : "border-b";
            return (
              <div key={r.critere} className="contents">
                <p className={`${ligne} border-border py-6 pr-4 font-display text-[1.125rem] font-semibold tracking-[-0.015em]`}>{r.critere}</p>
                <p className={`${ligne} border-border px-7 py-6 type-body text-foreground/55`}>{r.seul}</p>
                <p className={`${ligne} relative mx-px flex gap-3 border-[rgb(79_158_152/0.15)] px-7 py-6 type-body ${ligne ? "" : "pb-8"}`}>
                  <CheckIcon className="mt-1.5 size-4 shrink-0 text-[oklch(0.55_0.1_190)]" strokeWidth={2.5} aria-hidden />
                  <span>{r.formation}</span>
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 grid gap-4 md:hidden">
          {page.comparatif.map((r) => (
            <div key={r.critere} className="overflow-hidden rounded-[20px] border border-border">
              <p className="px-5 pt-5 font-display text-[1.125rem] font-semibold">{r.critere}</p>
              <p className="flex gap-3 px-5 pt-2 pb-4 type-small text-foreground/60">
                <XIcon className="mt-1 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="sr-only">Seul face à l&apos;IA : </span>
                  {r.seul}
                </span>
              </p>
              <p className="flex gap-3 bg-[linear-gradient(170deg,rgb(79_158_152/0.13),rgb(246_231_200/0.4))] px-5 py-4 type-small">
                <CheckIcon className="mt-1 size-4 shrink-0 text-[oklch(0.55_0.1_190)]" strokeWidth={2.5} aria-hidden />
                <span>
                  <span className="sr-only">Avec la formation : </span>
                  {r.formation}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Tarif : sur la matière fluide vivante, comme le haut de l'accueil (claire à gauche, sous le texte). */}
      <section className="relative isolate overflow-hidden bg-[linear-gradient(110deg,#faf6ee_0%,#f4e3c4_55%,#7fb0a9_100%)] text-[oklch(0.22_0.03_205)]" aria-labelledby="tarif">
        <HeroAbstract className="absolute inset-0 -z-10 h-full w-full" defilement={false} />
        <div className="site-container site-section grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-20">
          <div>
            <Eyebrow>Le tarif</Eyebrow>
            <h2 id="tarif" className="mt-4 type-h2">
              {formation.title}
            </h2>
            <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-[clamp(3rem,2rem+4vw,4.5rem)] leading-none font-semibold tracking-[-0.045em] tabular-nums">{euros(page.prix)}</span>
              <span className="type-body text-[oklch(0.3_0.03_205)]/75">prix de lancement, paiement unique</span>
            </p>
            <div className="mt-8">
              <Achat slug={formation.slug} prix={page.prix} />
            </div>
          </div>
          <div className="rounded-[24px] border border-white/60 bg-white/55 p-6 shadow-[0_30px_80px_-40px_rgb(20_60_60/0.45)] backdrop-blur-xl sm:p-8">
            <p className="type-small font-semibold text-[oklch(0.3_0.03_205)]/80">Ce qui est inclus</p>
            <ul className="mt-5 grid gap-4">
              {page.inclus.map((t) => (
                <li key={t} className="flex gap-3 type-body">
                  <CheckIcon className="mt-1.5 size-4 shrink-0 text-[oklch(0.5_0.09_190)]" strokeWidth={2.5} aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-[oklch(0.3_0.03_205)]/10 pt-5 type-small text-[oklch(0.3_0.03_205)]/70">Il vous faut aussi un compte Claude : voir les questions fréquentes.</p>
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
