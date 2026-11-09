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
import { METIERS_A_VENIR } from "@/lib/vitrine/metiers";
import { UpcomingMarquee } from "@/components/site/upcoming-marquee";
import { TaskSort } from "@/components/site/task-sort";
import { StepsPath } from "@/components/site/steps-path";
import { CheckIcon, XIcon } from "lucide-react";
import { CTA_FORMATIONS, accueil } from "@/lib/vitrine/textes";

export type HeroVariant = "abstrait" | "produit" | "illustration";

export async function HomeView({ variant = "produit" }: { variant?: HeroVariant }) {
  const formations = await listFormations();
  const [featured, ...others] = formations;
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

      {/* b. Constat, suivi immédiatement de la réponse : les tâches se partagent sous vos yeux. */}
      <section>
        <div className="site-container site-section">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:gap-20">
            <h2 className="max-w-[20ch] type-h2">{constat.title}</h2>
            <div className="max-w-[var(--text-max)] space-y-3 type-lead text-foreground/75">
              {constat.text.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
          </div>
          <div className="mt-12">
            <TaskSort columns={constat.partage} />
          </div>
          <h3 className="mt-16 type-h3">{constat.answerTitle}</h3>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {constat.answer.map((t, i) => (
              <li key={t} className="flex gap-4 rounded-[1.25rem] border border-white/80 bg-white/55 p-6 dark:border-white/10 dark:bg-white/[0.04]">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular-nums">{i + 1}</span>
                <p className="type-body">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* c. Comment ça marche : trois cartes reliées par un chemin qui se trace au défilement. */}
      <section id="comment-ca-marche" className="scroll-mt-16">
        <div className="site-container site-section">
          <div className="mx-auto max-w-[40rem] text-center">
            <h2 className="type-h2">{etapes.title}</h2>
            <p className="mt-4 type-lead text-muted-foreground">{etapes.intro}</p>
          </div>
          <div className="mt-14">
            <StepsPath
              steps={etapes.items.map((it, i) => ({
                ...it,
                ...[
                  { image: "/captures/mission", w: 760, h: 1008, alt: "Le message de mission reçu dans la session." },
                  { image: "/captures/outil", w: 900, h: 657, alt: "L'outil Claude et ses règles." },
                  { image: "/captures/fiche", w: 860, h: 517, alt: "La fiche à réutiliser sur vos dossiers." },
                ][i],
              }))}
            />
          </div>
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
        <UpcomingMarquee metiers={upcoming} title="Et bientôt, d'autres métiers" />
      </section>

      {/* f. Pour qui / ce que ce n'est pas : deux cartes, coches d'un côté, limites franches de l'autre. */}
      <section>
        <div className="site-container site-section grid gap-5 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-primary/20 bg-[linear-gradient(160deg,rgb(255_255_255/0.85),rgb(214_232_228/0.6))] p-7 shadow-[0_30px_70px_-40px_rgb(20_70_70/0.4)] sm:p-10 dark:border-primary/30 dark:bg-white/[0.05]">
            <h2 className="type-h2 text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)]">{pourQui.title}</h2>
            <ul className="mt-8 space-y-5">
              {pourQui.forWhom.map((t) => (
                <li key={t} className="flex gap-4 type-body">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <CheckIcon className="size-4" aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.75rem] border border-white/80 bg-white/45 p-7 sm:p-10 dark:border-white/10 dark:bg-white/[0.03]">
            <h2 className="type-h2 text-[clamp(1.75rem,1.3rem+1.6vw,2.5rem)]">{pourQui.notThisTitle}</h2>
            <ul className="mt-8 space-y-5">
              {pourQui.notThis.map((t) => (
                <li key={t} className="flex gap-4 type-body text-foreground/80">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground">
                    <XIcon className="size-3.5" aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* g. FAQ courte, puis bouton final */}
      <section className="border-t border-border">
        <div className="site-container site-section grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
          <h2 className="type-h2">{faq.title}</h2>
          <Faq items={faq.items} />
        </div>
      </section>

      {/* Dernier appel : écho de la matière fluide du haut de page (dégradés CSS, sans calcul). */}
      <section className="relative overflow-hidden bg-[#f6efe2] text-[oklch(0.22_0.03_205)]">
        <div aria-hidden className="absolute inset-0">
          <div className="absolute -top-[20%] -left-[10%] size-[60vw] max-w-[900px] rounded-full bg-[#f1d4a3] opacity-70 blur-[120px]" />
          <div className="absolute -right-[10%] -bottom-[30%] size-[55vw] max-w-[860px] rounded-full bg-[#86b5ad] opacity-70 blur-[120px]" />
          <div className="absolute top-[30%] left-[45%] size-[30vw] max-w-[480px] rounded-full bg-[#4f8e8a] opacity-35 blur-[120px]" />
        </div>
        <div className="site-container relative py-[calc(var(--section-space)*1.1)] text-center">
          <h2 className="mx-auto max-w-[16ch] type-hero text-[clamp(2.5rem,1rem+5vw,6rem)]">{final.title}</h2>
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
