import { Suspense } from "react";
import { SessionImport } from "@/components/admin/session-import";
import { requireAdmin } from "@/lib/admin/guard";

async function Guarded() {
  await requireAdmin();
  return <SessionImport />;
}

export default function ImportSessionPage() {
  return (
    <Suspense>
      <Guarded />
    </Suspense>
  );
}
