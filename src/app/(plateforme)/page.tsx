import { PageHeader } from "@/components/platform/page-header";
import { LearnerDashboard } from "@/components/platform/learner-dashboard";
import { listFormations } from "@/lib/content/source";
import { demoEnrollments } from "@/lib/demo/progress";

export default async function DashboardPage() {
  const formations = await listFormations();
  const enrollments = demoEnrollments(formations);
  const followedIds = new Set(enrollments.map((e) => e.formation.id));
  return (
    <>
      <PageHeader crumbs={[{ label: "Tableau de bord" }]} />
      <LearnerDashboard
        enrollments={enrollments}
        others={formations.filter((f) => !followedIds.has(f.id))}
      />
    </>
  );
}
