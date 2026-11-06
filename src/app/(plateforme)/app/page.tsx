import { PageHeader } from "@/components/platform/page-header";
import { LearnerDashboard } from "@/components/platform/learner-dashboard";
import { listFormations } from "@/lib/content/source";
import { openModuleRefs } from "@/lib/content/refs";
import { sessionsIndex } from "@/lib/content/library";

export default async function DashboardPage() {
  const formations = await listFormations();
  const [refs, index] = await Promise.all([openModuleRefs(formations), sessionsIndex(formations)]);
  return (
    <>
      <PageHeader crumbs={[{ label: "Accueil" }]} />
      <LearnerDashboard formations={formations} refs={refs} sessions={index.sessions} durations={index.durations} />
    </>
  );
}
