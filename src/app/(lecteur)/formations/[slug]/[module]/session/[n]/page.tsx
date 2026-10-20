import type { Metadata } from "next";
import { atLeastOne, PLACEHOLDER } from "@/lib/content/static-params";
import { notFound } from "next/navigation";
import { SessionPlayer } from "@/components/session/session-player";
import { getFormation, getSession, listFormations, listSessions } from "@/lib/content/source";
import { filesBase } from "@/lib/sessions/files";

type Props = PageProps<"/formations/[slug]/[module]/session/[n]">;

// Les sessions publiées après la mise en ligne sont rendues à la demande (puis mises en cache).
export const instant = false;

export async function generateStaticParams() {
  const params: { slug: string; module: string; n: string }[] = [];
  for (const f of await listFormations()) {
    for (const m of f.modules) {
      for (const s of await listSessions(f.slug, m.slug)) params.push({ slug: f.slug, module: m.slug, n: String(s.number) });
    }
  }
  return atLeastOne(params, { slug: PLACEHOLDER, module: PLACEHOLDER, n: "0" });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug, module, n } = await props.params;
  const s = await getSession(slug, module, Number(n));
  return s ? { title: s.title } : {};
}

export default async function SessionPage(props: Props) {
  const { slug, module, n } = await props.params;
  const number = Number(n);
  if (!Number.isInteger(number)) notFound();
  const [formation, record, all] = await Promise.all([getFormation(slug), getSession(slug, module, number), listSessions(slug, module)]);
  const mod = formation?.modules.find((m) => m.slug === module);
  if (!formation || !mod || !record) notFound();
  const next = all.find((s) => s.number > number);
  const moduleHref = `/formations/${slug}/${module}`;

  return (
    <SessionPlayer
      session={record.content}
      moduleLabel={`Module ${mod.position} : ${mod.title}`}
      exitHref={moduleHref}
      fileBase={filesBase(record.content)}
      next={next ? { titre: next.title, duree_min: next.durationMin, href: `${moduleHref}/session/${next.number}` } : null}
    />
  );
}
