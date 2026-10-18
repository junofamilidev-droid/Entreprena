import { PageHeader } from "@/components/platform/page-header";
import { LearnerDashboard } from "@/components/platform/learner-dashboard";
import { listFormations } from "@/lib/content/source";
import { openModuleRefs } from "@/lib/content/refs";

export default async function DashboardPage() {
  const formations = await listFormations();
  const refs = await openModuleRefs(formations);
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil" }]} />
      <LearnerDashboard formations={formations} refs={refs} />
    </>
  );
}
