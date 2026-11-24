import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContactsView } from "@/components/contacts/contacts-view";
import { ContactData } from "@/components/contacts/contact-modal";

export default async function ContactsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const rawContacts = await prisma.contact.findMany({
    where: { userId },
    include: {
      outreaches: {
        orderBy: { date: "desc" },
        select: {
          id: true,
          channel: true,
          date: true,
          message: true,
          response: true,
          followUpDate: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const contacts: ContactData[] = rawContacts.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    role: c.role,
    email: c.email,
    linkedInUrl: c.linkedInUrl,
    relationship: c.relationship,
    notes: c.notes,
    outreaches: c.outreaches.map((o) => ({
      ...o,
      date: o.date.toISOString(),
      followUpDate: o.followUpDate ? o.followUpDate.toISOString() : null,
    })),
    createdAt: c.createdAt.toISOString(),
  }));

  return <ContactsView initialContacts={contacts} userEmail={session.user?.email} />;
}
