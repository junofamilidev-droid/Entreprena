import { Suspense } from "react";
import { FormationImport } from "@/components/admin/formation-import";
import { requireAdmin } from "@/lib/admin/guard";

async function Guarded() {
  await requireAdmin();
  return <FormationImport />;
}

export default function ImportFormationPage() {
  return (
    <Suspense>
      <Guarded />
    </Suspense>
  );
}
