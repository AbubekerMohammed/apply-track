import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationsView } from "@/components/applications/applications-view";

export default async function ApplicationsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const [applications, contacts] = await Promise.all([
    prisma.application.findMany({
      where: { userId },
      include: {
        referrerContact: {
          select: { id: true, name: true, company: true, email: true },
        },
        stageHistory: {
          orderBy: { changedAt: "desc" },
        },
        emailEvents: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.findMany({
      where: { userId },
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates to ISO strings for client component compatibility
  const serializedApplications = applications.map((app) => ({
    ...app,
    dateApplied: app.dateApplied.toISOString(),
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
    stageHistory: app.stageHistory.map((sh) => ({
      ...sh,
      changedAt: sh.changedAt.toISOString(),
    })),
    emailEvents: app.emailEvents.map((ee) => ({
      ...ee,
      date: ee.date.toISOString(),
    })),
  }));

  return (
    <ApplicationsView
      initialApplications={serializedApplications}
      contacts={contacts}
    />
  );
}
