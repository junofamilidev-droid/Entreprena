import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SessionPlayer } from "@/components/session/session-player";
import { requireAdmin } from "@/lib/admin/guard";
import { mapSession } from "@/lib/content/source";
import { filesBase } from "@/lib/sessions/files";

// Aperçu d'une session, brouillon compris, telle que l'apprenant la verra.
// Sa progression est rangée à part (« apercu-… ») et aucune mesure n'est envoyée.
async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  const { data } = await client.from("sessions").select("*, modules(title, position)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = mapSession(data);
  const m = data.modules as unknown as { title: string; position: number };
  return (
    <>
      <p className="fixed right-3 bottom-20 z-50 rounded-md bg-foreground px-2.5 py-1 text-caption text-background shadow">Aperçu</p>
      <SessionPlayer
        session={s.content}
        moduleLabel={`Module ${m.position} : ${m.title}`}
        exitHref={`/admin/sessions/${id}`}
        fileBase={filesBase(s.content)}
        keyPrefix="apercu-"
        measure={false}
      />
    </>
  );
}

export default function SessionPreviewPage(props: PageProps<"/admin/apercu-session/[id]">) {
  return (
    <Suspense>
      <Preview params={props.params} />
    </Suspense>
  );
}
