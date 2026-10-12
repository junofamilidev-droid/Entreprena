import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminHome } from "@/components/admin/admin-home";
import { requireAdmin } from "@/lib/admin/guard";

async function Home() {
  const { client } = await requireAdmin();
  const { data } = await client.from("formations").select("id, slug, title, status, modules(count)").order("position");
  const formations = (data ?? []).map((f) => ({
    id: f.id as string,
    slug: f.slug as string,
    title: f.title as string,
    status: f.status as "draft" | "published",
    modules: (f.modules as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
  return <AdminHome formations={formations} />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <Home />
    </Suspense>
  );
}
