import Link from "next/link";
import { HeroFlow } from "@/components/site/hero-flow";
import { ProductShowcase } from "@/components/site/product-showcase";
import { FormationCard } from "@/components/site/formation-card";
import { FormationFeature } from "@/components/site/formation-feature";
import { Faq } from "@/components/site/faq";
import { listFormations } from "@/lib/content/source";
import { CTA_FORMATIONS, accueil } from "@/lib/vitrine/textes";

export default async function HomePage() {
  const formations = await listFormations();
  const [featured, ...others] = formations;
  const { hero, constat, etapes, produit, pourQui, faq, final } = accueil;

  return (
    <>
      {/* a. Haut de page : scène sombre plein écran, titre géant. Le texte est rendu tout de suite ;
          l'animation se dessine ensuite, derrière. */}
      <section id="haut-de-page" className="on-night relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden">
        <HeroFlow className="absolute inset-0 h-full w-full" />
        <div aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top,var(--night)_0%,color-mix(in_oklch,var(--night)_88%,transparent)_34%,transparent_62%)]" />
        <div className="site-container relative mt-auto pt-[16svh] pb-8 sm:pt-[28svh] sm:pb-14 lg:pb-16">
          <h1 className="max-w-[15ch] type-hero">{hero.title}</h1>
          <div className="mt-6 grid items-end gap-x-16 gap-y-6 sm:mt-10 lg:grid-cols-[minmax(0,34rem)_auto] lg:justify-between">
            <p className="type-body text-[var(--night-foreground)]/75 sm:type-lead">{hero.subtitle}</p>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/formations" className="btn-primary">
                {CTA_FORMATIONS}
              </Link>
              <Link href="#comment-ca-marche" className="link-quiet">
                {hero.secondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

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
