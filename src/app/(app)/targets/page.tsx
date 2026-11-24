import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TargetsView } from "@/components/targets/targets-view";
import { TargetCompanyData } from "@/components/targets/target-modal";

export default async function TargetsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const rawTargets = await prisma.targetCompany.findMany({
    where: { userId },
    include: {
      outreaches: {
        select: {
          id: true,
          channel: true,
          date: true,
          response: true,
        },
      },
    },
    orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
  });

  const targets: TargetCompanyData[] = rawTargets.map((t) => ({
    id: t.id,
    name: t.name,
    priority: t.priority,
    targetRole: t.targetRole,
    jobLink: t.jobLink,
    status: t.status,
    notes: t.notes,
    checklist: (t.checklist as Array<{ id: string; label: string; completed: boolean }>) || null,
    createdAt: t.createdAt.toISOString(),
  }));

  return <TargetsView initialTargets={targets} userEmail={session.user?.email} />;
}
