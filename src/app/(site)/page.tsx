import Link from "next/link";
import { PrismScene } from "@/components/site/prism-scene";
import { FormationCard } from "@/components/site/formation-card";
import { Faq } from "@/components/site/faq";
import { listFormations } from "@/lib/content/source";
import { CTA_FORMATIONS, accueil } from "@/lib/vitrine/textes";

export default async function HomePage() {
  const formations = await listFormations();
  const { hero, constat, etapes, pourQui, faq, final } = accueil;

  return (
    <>
      {/* a. Haut de page : titre et bouton s'affichent tout de suite ; la scène est un décor. */}
      <section className="site-container grid gap-x-16 gap-y-8 pt-10 pb-16 sm:pt-16 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:pt-20 lg:pb-24">
        <h1 className="type-display max-w-[17ch] lg:col-span-2">{hero.title}</h1>
        <div className="lg:pt-4">
          <p className="max-w-[34rem] type-lead text-foreground/75">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/formations" className="btn-primary">
              {CTA_FORMATIONS}
            </Link>
            <Link href="#comment-ca-marche" className="link-quiet">
              {hero.secondary}
            </Link>
          </div>
        </div>
        <div className="-mx-[var(--gutter)] sm:mx-0 lg:-mt-6">
          <PrismScene className="block h-auto w-full" />
        </div>
      </section>

      {/* b. Constat, suivi immédiatement de la réponse */}
      <section className="border-t border-border">
        <div className="site-container site-section grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="type-h2">{constat.title}</h2>
            <div className="mt-6 max-w-[var(--text-max)] space-y-4 type-lead text-foreground/80">
              {constat.text.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
          <div className="self-end rounded-[var(--radius-card)] border border-border bg-card p-6 sm:p-8">
            <h3 className="type-h3">{constat.answerTitle}</h3>
            <ul className="mt-5 divide-y divide-border">
              {constat.answer.map((t) => (
                <li key={t} className="flex gap-4 py-4 type-body first:pt-0 last:pb-0">
                  <span className="mt-[0.7em] h-px w-4 shrink-0 bg-primary" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* c. Comment ça marche : une vraie séquence, d'où la numérotation */}
      <section id="comment-ca-marche" className="scroll-mt-4 border-t border-border">
        <div className="site-container site-section">
          <h2 className="type-h2">{etapes.title}</h2>
          <p className="mt-4 type-lead text-muted-foreground">{etapes.intro}</p>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {etapes.items.map((s, i) => (
              <li key={s.title} className="border-t border-foreground/80 pt-6">
                <span className="font-display text-5xl leading-none font-medium tracking-tight text-muted-foreground tabular-nums" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="mt-6 type-h3">{s.title}</h3>
                <p className="mt-3 type-body text-foreground/75">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* e. Les formations par métier, générées depuis les données */}
      <section className="border-t border-border">
        <div className="site-container site-section">
          <h2 className="type-h2">{accueil.formations.title}</h2>
          <p className="mt-4 max-w-[var(--text-max)] type-lead text-muted-foreground">{accueil.formations.intro}</p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => (
              <FormationCard key={f.id} formation={f} available />
            ))}
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
              <ul className="mt-8 divide-y divide-border border-y border-border">
                {col.items.map((t) => (
                  <li key={t} className="py-5 type-body">
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

      <section className="border-t border-border bg-muted">
        <div className="site-container site-section">
          <h2 className="max-w-[18ch] type-h2">{final.title}</h2>
          <Link href="/formations" className="btn-primary mt-8">
            {CTA_FORMATIONS}
          </Link>
        </div>
      </section>
    </>
  );
}
