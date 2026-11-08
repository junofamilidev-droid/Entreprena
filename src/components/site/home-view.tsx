import Link from "next/link";
import { HeroBox, type HeroTrack } from "@/components/site/hero-box";
import { HeroAbstract } from "@/components/site/hero-abstract";
import { HeroProductCards } from "@/components/site/hero-product";
import { HeroImage } from "@/components/site/hero-image";
import { existsSync } from "node:fs";
import path from "node:path";
import { ProductShowcase } from "@/components/site/product-showcase";
import { FormationCard } from "@/components/site/formation-card";
import { FormationFeature } from "@/components/site/formation-feature";
import { Faq } from "@/components/site/faq";
import { listFormations } from "@/lib/content/source";
import { CTA_FORMATIONS, accueil } from "@/lib/vitrine/textes";

export type HeroVariant = "abstrait" | "produit" | "illustration";

export async function HomeView({ variant = "produit" }: { variant?: HeroVariant }) {
  const formations = await listFormations();
  const [featured, ...others] = formations;
  const { constat, etapes, produit, pourQui, faq, final } = accueil;
  const tracks: HeroTrack[] = formations.map((f) => ({
    slug: f.slug,
    domain: f.domain,
    title: f.title,
    tasks: f.modules.map((m) => ({ title: m.title, open: m.availability === "open" })),
  }));

  return (
    <>
      {/* a. Haut de page : plusieurs versions à comparer (voir HeroSection plus bas). */}
      <HeroSection variant={variant} tracks={tracks} />

      {/* b. Constat, suivi immédiatement de la réponse */}
      <section>
        <div className="site-container site-section grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
          <div>
            <h2 className="max-w-[20ch] type-h2">{constat.title}</h2>
            <div className="mt-8 max-w-[var(--text-max)] space-y-4 type-lead text-foreground/75">
              {constat.text.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
          <div className="self-end">
            <h3 className="type-h3">{constat.answerTitle}</h3>
            <ol className="mt-6 border-t border-foreground">
              {constat.answer.map((t, i) => (
                <li key={t} className="flex gap-5 border-b border-border py-5 type-body">
                  <span className="font-display font-semibold text-primary tabular-nums">{i + 1}</span>
                  {t}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* c. Comment ça marche : une vraie séquence, d'où la numérotation */}
      <section id="comment-ca-marche" className="scroll-mt-16 border-t border-border">
        <div className="site-container site-section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="type-h2">{etapes.title}</h2>
            <p className="type-lead text-muted-foreground">{etapes.intro}</p>
          </div>
          <ol className="mt-14 grid gap-12 md:grid-cols-3 md:gap-0">
            {etapes.items.map((s, i) => (
              <li key={s.title} className="md:border-l md:border-border md:px-8 md:first:border-l-0 md:first:pl-0 md:last:pr-0">
                <span className="block font-display text-[clamp(4rem,3rem+3vw,6.5rem)] leading-[0.8] font-medium tracking-[-0.05em] text-foreground/15 tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-8 type-h3">{s.title}</h3>
                <p className="mt-3 type-body text-foreground/75">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* d. Le produit : captures réelles en cartes de verre flottantes */}
      <section aria-label="Aperçu de la plateforme">
        <ProductShowcase title={produit.title} text={produit.text} word={produit.word} />
      </section>

      {/* e. Les formations par métier, générées depuis les données */}
      <section>
        <div className="site-container site-section">
          <h2 className="type-h2">{accueil.formations.title}</h2>
          <p className="mt-4 max-w-[var(--text-max)] type-lead text-muted-foreground">{accueil.formations.intro}</p>
          <div className="mt-12 space-y-6">
            {featured && <FormationFeature formation={featured} />}
            {others.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {others.map((f) => (
                  <FormationCard key={f.id} formation={f} available />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* f. Pour qui / ce que ce n'est pas */}
      <section className="border-t border-border">
        <div className="site-container site-section grid gap-14 md:grid-cols-2 md:gap-20">
          {[
            { title: pourQui.title, items: pourQui.forWhom },
            { title: pourQui.notThisTitle, items: pourQui.notThis },
          ].map((col) => (
            <div key={col.title}>
              <h2 className="type-h2">{col.title}</h2>
              <ul className="mt-8 border-t border-foreground">
                {col.items.map((t) => (
                  <li key={t} className="border-b border-border py-5 type-body">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* g. FAQ courte, puis bouton final */}
      <section className="border-t border-border">
        <div className="site-container site-section grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <h2 className="type-h2">{faq.title}</h2>
          <Faq items={faq.items} />
        </div>
      </section>

      <section className="on-night">
        <div className="site-container py-[calc(var(--section-space)*1.1)]">
          <h2 className="max-w-[14ch] type-hero text-[clamp(2.5rem,1rem+5.5vw,6.5rem)]">{final.title}</h2>
          <Link href="/formations" className="btn-primary mt-10">
            {CTA_FORMATIONS}
          </Link>
        </div>
      </section>
    </>
  );
}

const ILLUSTRATION = "/hero/illustration.webp";

/** Le haut de page, selon la version. Le texte est toujours rendu par le serveur, avant le décor. */
function HeroSection({ variant, tracks }: { variant: HeroVariant; tracks: HeroTrack[] }) {
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
              <HeroBox tracks={tracks} cta={CTA_FORMATIONS} tone="light" />
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
              <HeroBox tracks={tracks} cta={CTA_FORMATIONS} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
