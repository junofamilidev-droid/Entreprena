import Link from "next/link";
import { HeroScene, type SceneVariant } from "@/components/site/hero-scene";
import { HeroBox, type HeroTrack } from "@/components/site/hero-box";
import { ProductShowcase } from "@/components/site/product-showcase";
import { FormationCard } from "@/components/site/formation-card";
import { FormationFeature } from "@/components/site/formation-feature";
import { Faq } from "@/components/site/faq";
import { listFormations } from "@/lib/content/source";
import { CTA_FORMATIONS, accueil } from "@/lib/vitrine/textes";

export async function HomeView({ variant = "aube" }: { variant?: SceneVariant }) {
  const light = variant === "matin";
  const formations = await listFormations();
  const [featured, ...others] = formations;
  const { hero, constat, etapes, produit, pourQui, faq, final } = accueil;
  const tracks: HeroTrack[] = formations.map((f) => ({
    slug: f.slug,
    domain: f.domain,
    title: f.title,
    tasks: f.modules.map((m) => ({ title: m.title, open: m.availability === "open" })),
  }));

  return (
    <>
      {/* a. Haut de page : une scène peinte (la ville au lever du jour, un chemin de lumière),
          en plans qui suivent la souris, avec une traînée de pixels. Le texte est rendu tout de suite. */}
      <section
        id="haut-de-page"
        data-tone={light ? "light" : "dark"}
        className={
          light
            ? "relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(100deg,#f6f3ec_0%,#d9e4e3_45%,#f1dcb8_80%,#fbe8c8_100%)] text-[oklch(0.22_0.03_205)]"
            : "on-night relative -mt-16 flex min-h-[100svh] flex-col overflow-hidden bg-[linear-gradient(100deg,#0a2124_0%,#16373a_45%,#8f8463_75%,#e9c48e_100%)]"
        }
      >
        <HeroScene className="absolute inset-0 h-full w-full" variant={variant} />
        <div
          aria-hidden
          className={
            light
              ? "pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgb(250_248_242/0.92)_0%,rgb(250_248_242/0.6)_50%,rgb(250_248_242/0)_78%)] md:bg-[linear-gradient(90deg,rgb(250_248_242/0.85)_0%,rgb(250_248_242/0.5)_40%,rgb(250_248_242/0)_64%)]"
              : "pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgb(5_16_18/0.88)_0%,rgb(5_16_18/0.55)_50%,rgb(5_16_18/0)_78%)] md:bg-[linear-gradient(90deg,rgb(5_16_18/0.7)_0%,rgb(5_16_18/0.42)_40%,rgb(5_16_18/0)_66%)]"
          }
        />
        <div className="site-container relative flex flex-1 flex-col justify-end pt-24 pb-8 md:justify-center md:pt-28 md:pb-16">
          <div className="max-w-[40rem]">
            <h1 className="type-hero max-w-[16ch]">{hero.title}</h1>
            <p className={`mt-5 max-w-[34rem] type-body sm:type-lead ${light ? "text-[oklch(0.3_0.03_205)]/85" : "text-white/75"}`}>{hero.subtitle}</p>
            <div className="mt-7">
              <HeroBox tracks={tracks} cta={CTA_FORMATIONS} tone={light ? "light" : "dark"} />
            </div>
            <Link href="#comment-ca-marche" className={`link-quiet mt-6 inline-block ${light ? "" : "text-white/90"}`}>
              {hero.secondary}
            </Link>
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
