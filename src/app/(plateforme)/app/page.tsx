import type { Metadata } from "next";
import { PageHeader } from "@/components/platform/page-header";
import { LearnerDashboard } from "@/components/platform/learner-dashboard";
import { listFormations } from "@/lib/content/source";
import { openModuleRefs } from "@/lib/content/refs";

export const metadata: Metadata = { title: "Ma formation" };

export default async function MyFormationPage() {
  const formations = await listFormations();
  const refs = await openModuleRefs(formations);
  return (
    <>
      <PageHeader crumbs={[{ label: "Ma formation" }]} />
      <LearnerDashboard formations={formations} refs={refs} />
    </>
  );
}
