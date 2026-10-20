import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionEditor } from "@/components/admin/session-editor";
import { requireAdmin } from "@/lib/admin/guard";
import { mapSession } from "@/lib/content/source";

async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { client } = await requireAdmin();
  const { data } = await client.from("sessions").select("*, modules(id, title, position, formations(id, title))").eq("id", id).maybeSingle();
  if (!data) notFound();
  const s = mapSession(data);
  const m = data.modules as unknown as { id: string; title: string; position: number; formations: { id: string; title: string } };
  return (
    <SessionEditor
      key={data.updated_at as string}
      id={s.id}
      status={s.status}
      content={s.content}
      moduleInfo={{ id: m.id, title: m.title, position: m.position, formationId: m.formations.id, formationTitle: m.formations.title }}
    />
  );
}

export default function SessionAdminPage(props: PageProps<"/admin/sessions/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
