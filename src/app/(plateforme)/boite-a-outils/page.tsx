import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/platform/page-header";
import { PromptBlock } from "@/components/reader/prompt-block";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { lessonContent, openModules, toolbox } from "@/lib/content/library";
import { ToolboxView } from "@/components/platform/toolbox-view";

export const metadata: Metadata = { title: "Ma boîte à outils" };

export default async function ToolboxPage() {
  const [{ open }, box] = await Promise.all([openModules(), toolbox()]);
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil", href: "/" }, { label: "Ma boîte à outils" }]} />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8 md:py-10">
        <h1 className="text-title">Ma boîte à outils</h1>
        <p className="mt-2 max-w-3xl text-body text-muted-foreground">
          Les outils et les fiches gagnés en terminant les sessions, et les prompts prêts à copier. Réutilisez-les sur vos
          dossiers, après avoir anonymisé vos données.
        </p>
        <div className="mt-8">
          <ToolboxView {...box} />
        </div>
        {open.map((o) => {
          const lessons = o.module.steps.map((s) => ({ s, c: lessonContent(s) })).filter((x) => x.c);
          const prompts = lessons.filter((x) => x.c!.prompt);
          const sources = lessons.filter((x) => x.c!.sourcesHtml);
          return (
            <section key={o.module.id} className="mt-8" aria-labelledby={`m-${o.module.id}`}>
              <h2 id={`m-${o.module.id}`} className="text-heading">
                Prompts des leçons · module {o.module.position} : {o.module.title}
              </h2>
              <div className="mt-4 space-y-4">
                {prompts.map(({ s, c }) => (
                  <div key={s.id} className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">
                      Leçon{" "}
                      <Link href={`/formations/${o.formationSlug}/${o.module.slug}/${s.slug}`} className="text-primary hover:underline">
                        {s.title}
                      </Link>
                    </p>
                    <PromptBlock {...c!.prompt!} />
                  </div>
                ))}
              </div>
              {sources.length > 0 && (
                <Accordion type="multiple" className="mt-6 rounded-lg border bg-card px-4">
                  {sources.map(({ s, c }) => (
                    <AccordionItem key={s.id} value={s.id}>
                      <AccordionTrigger>Sources : {s.title}</AccordionTrigger>
                      <AccordionContent>
                        <div className="prose-lesson prose-sources" dangerouslySetInnerHTML={{ __html: c!.sourcesHtml! }} />
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
