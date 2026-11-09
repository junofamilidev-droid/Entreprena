import Link from "next/link";
import { HeroBox, type HeroTrack } from "@/components/site/hero-box";
import { HeroAbstract } from "@/components/site/hero-abstract";
import { HeroProductCards } from "@/components/site/hero-product";
import { HeroImage } from "@/components/site/hero-image";
import { existsSync } from "node:fs";
import path from "node:path";
import { ProductShowcase } from "@/components/site/product-showcase";
import { FormationFeature } from "@/components/site/formation-feature";
import { Faq } from "@/components/site/faq";
import { SectionConstat } from "@/components/site/section-constat";
import { SectionSteps } from "@/components/site/section-steps";
import { SectionMetiers } from "@/components/site/section-metiers";
import { SectionPourQui } from "@/components/site/section-pourqui";
import { Eyebrow, Frame } from "@/components/site/kit";
import { listFormations } from "@/lib/content/source";
import { METIERS_A_VENIR } from "@/lib/vitrine/metiers";
import { CTA_FORMATIONS, accueil } from "@/lib/vitrine/textes";

export type HeroVariant = "abstrait" | "produit" | "illustration";

export async function HomeView({ variant = "produit" }: { variant?: HeroVariant }) {
  const formations = await listFormations();
  const [featured] = formations;
  const { constat, etapes, produit, pourQui, faq, final } = accueil;
  // Un métier à venir disparaît de la liste dès qu'une formation publiée porte ce métier.
  const published = new Set(formations.map((f) => f.domain.toLowerCase()));
  const upcoming = METIERS_A_VENIR.filter((m) => !published.has(m.nom.toLowerCase()));
  const tracks: HeroTrack[] = formations.map((f) => ({
    slug: f.slug,
    domain: f.domain,
    title: f.title,
    tasks: f.modules.map((m) => ({ title: m.title, open: m.availability === "open" })),
  }));

  return (
    <>
      {/* a. Haut de page : plusieurs versions à comparer (voir HeroSection plus bas). */}
      <HeroSection variant={variant} tracks={tracks} upcoming={upcoming.map((m) => m.nom)} />

      {/* b. Le constat, montré dans un cadre produit « en direct ». */}
      <section>
        <div className="site-container site-section">
          <SectionConstat
            eyebrow={constat.eyebrow}
            title={constat.title}
            text={constat.text}
            rows={constat.lignes}
            actionsTitle={constat.answerTitle}
            actions={constat.answer}
          />
        </div>
      </section>

      {/* c. Comment ça marche : la capture de l'étape active, et trois cartes qui avancent seules. */}
      <section id="comment-ca-marche" className="scroll-mt-16">
        <div className="site-container site-section pt-0">
          <SectionSteps
            eyebrow={etapes.eyebrow}
            title={etapes.title}
            intro={etapes.intro}
            steps={etapes.items.map((it, i) => ({
              ...it,
              label: etapes.labels[i],
              ...[
                { image: "/captures/mission", w: 760, h: 1008, alt: "Le message de mission reçu dans la session." },
                { image: "/captures/outil", w: 900, h: 657, alt: "L'outil Claude et ses règles." },
                { image: "/captures/fiche", w: 860, h: 517, alt: "La fiche à réutiliser sur vos dossiers." },
              ][i],
            }))}
          />
        </div>
      </section>

      {/* d. Le produit : captures réelles en cartes de verre flottantes */}
      <section aria-label="Aperçu de la plateforme">
        <ProductShowcase title={produit.title} text={produit.text} word={produit.word} />
      </section>

      {/* e. Les formations par métier : la formation disponible, puis la liste des métiers. */}
      <section>
        <div className="site-container site-section">
          {featured && <FormationFeature formation={featured} />}
          <div className="mt-24">
            <SectionMetiers title={accueil.formations.title} intro={accueil.formations.intro} formations={formations} upcoming={upcoming} />
          </div>
        </div>
      </section>

      {/* f. Pour qui / ce que ce n'est pas */}
      <section className="border-t border-border">
        <div className="site-container site-section">
          <SectionPourQui yesTitle={pourQui.title} yes={pourQui.forWhom} noTitle={pourQui.notThisTitle} no={pourQui.notThis} />
        </div>
      </section>

      {/* g. FAQ courte */}
      <section className="border-t border-border">
        <div className="site-container site-section grid gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-20">
          <div>
            <Eyebrow>Aide</Eyebrow>
            <h2 className="mt-5 font-display text-[clamp(2rem,1.3rem+2.6vw,3.5rem)] leading-[1.02] font-medium tracking-[-0.035em]">{faq.title}</h2>
          </div>
          <Faq items={faq.items} />
        </div>
      </section>

      {/* Dernier appel : un grand cadre sur la matière fluide. */}
      <section className="site-container pb-[var(--section-space)]">
        <Frame label="Commencer" scene="nuit-3" bodyClassName="px-6 pt-24 pb-10 sm:px-12 sm:pt-40 sm:pb-14">
          <div className="flex flex-wrap items-end justify-between gap-8">
            <h2 className="max-w-[16ch] font-display text-[clamp(2.25rem,1.3rem+3.6vw,4.5rem)] leading-[1] font-medium tracking-[-0.035em]">{final.title}</h2>
            <Link href="/formations" className="btn-primary !bg-white !text-[oklch(0.2_0.02_200)]">
              {CTA_FORMATIONS}
            </Link>
          </div>
        </Frame>
      </section>
    </>
  );
}

const ILLUSTRATION = "/hero/illustration.webp";

/** Le haut de page, selon la version. Le texte est toujours rendu par le serveur, avant le décor. */
function HeroSection({ variant, tracks, upcoming }: { variant: HeroVariant; tracks: HeroTrack[]; upcoming: string[] }) {
  const { hero } = accueil;
  const ink = "text-[oklch(0.22_0.03_205)]";

  if (variant === "abstrait") {
    return (
      <section id="haut-de-page" data-tone="light" className={`relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(110deg,#faf6ee_0%,#f4e3c4_55%,#7fb0a9_100%)] ${ink}`}>
        <HeroAbstract className="absolute inset-0 h-full w-full" />
        <div className="site-container relative flex flex-1 flex-col justify-end pt-24 pb-8 md:justify-center md:pt-28 md:pb-16">
          <div className="max-w-[40rem]">
            <h1 className="type-hero max-w-[16ch]">{hero.title}</h1>
            <p className="mt-5 max-w-[34rem] type-body text-[oklch(0.3_0.03_205)]/85 sm:type-lead">{hero.subtitle}</p>
            <div className="mt-7">
              <HeroBox tracks={tracks} upcoming={upcoming} cta={CTA_FORMATIONS} tone="light" />
            </div>
            <Link href="#comment-ca-marche" className="link-quiet mt-6 inline-block">
              {hero.secondary}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (variant === "produit") {
    return (
      <section
        id="haut-de-page"
        data-tone="light"
        className={`relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#faf6ee_0%,#f4e3c4_55%,#9cc0b8_100%)] ${ink}`}
      >
        {/* Fond : la matière fluide (claire au centre, sous le titre), avec sa traînée de pixels. */}
        <HeroAbstract className="absolute inset-0 h-full w-full" focus="center" />
        <div className="site-container relative flex flex-1 flex-col pt-24 pb-10 md:justify-center md:pt-20 md:pb-16">
          <div className="relative z-10 mx-auto max-w-[38rem] text-center">
            <h1 className="type-hero mx-auto max-w-[15ch] text-[clamp(2.375rem,1.2rem+3.4vw,4.5rem)]">{hero.title}</h1>
            <p className="mx-auto mt-5 max-w-[30rem] type-body text-[oklch(0.3_0.03_205)]/85 sm:type-lead">{hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
              <Link href="/formations" className="btn-primary">
                {CTA_FORMATIONS}
              </Link>
              <Link href="#comment-ca-marche" className="link-quiet">
                {hero.secondary}
              </Link>
            </div>
          </div>
          <div className="mt-10 md:mt-0">
            <HeroProductCards />
          </div>
        </div>
      </section>
    );
  }

  if (variant === "illustration") {
    const has = existsSync(path.join(process.cwd(), "public", ILLUSTRATION));
    return (
      <section id="haut-de-page" data-tone="dark" className="on-night relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(100deg,#0c2427_0%,#1f3f40_55%,#b08a5c_100%)]">
        {has ? (
          <HeroImage src={ILLUSTRATION} alt="" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <p className="mt-[40vh] max-w-sm rounded-xl border border-white/20 bg-black/30 px-5 py-4 text-center text-sm text-white/80 md:mt-0 md:ml-[45%]">
              Emplacement de l&apos;illustration : déposer le fichier dans public/hero/illustration.webp
            </p>
          </div>
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgb(5_16_18/0.85)_0%,rgb(5_16_18/0.5)_50%,rgb(5_16_18/0)_78%)] md:bg-[linear-gradient(90deg,rgb(5_16_18/0.65)_0%,rgb(5_16_18/0.35)_40%,rgb(5_16_18/0)_64%)]"
        />
        <div className="site-container pointer-events-none relative flex flex-1 flex-col justify-end pt-24 pb-8 md:justify-center md:pt-28 md:pb-16">
          <div className="pointer-events-auto max-w-[40rem]">
            <h1 className="type-hero max-w-[16ch]">{hero.title}</h1>
            <p className="mt-5 max-w-[34rem] type-body text-white/75 sm:type-lead">{hero.subtitle}</p>
            <div className="mt-7">
              <HeroBox tracks={tracks} upcoming={upcoming} cta={CTA_FORMATIONS} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
