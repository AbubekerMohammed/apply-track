import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Users, Plus, ExternalLink, Mail, Building } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ContactsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return null;

  const contacts = await prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  async function createContact(formData: FormData) {
    "use server";
    const userSession = await auth();
    if (!userSession?.user?.id) return;

    const name = formData.get("name") as string;
    const company = formData.get("company") as string;
    const role = (formData.get("role") as string) || null;
    const email = (formData.get("email") as string) || null;
    const linkedInUrl = (formData.get("linkedInUrl") as string) || null;
    const relationship = (formData.get("relationship") as string) || "Colleague";
    const notes = (formData.get("notes") as string) || null;

    if (!name || !company) return;

    await prisma.contact.create({
      data: {
        userId: userSession.user.id,
        name,
        company,
        role,
        email,
        linkedInUrl,
        relationship,
        notes,
      },
    });

    revalidatePath("/contacts");
    revalidatePath("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Contacts & Referrals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scoped to {session.user?.email} • {contacts.length} professional contacts
          </p>
        </div>
      </div>

      {/* Add Contact Form */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          <span>Add New Contact</span>
        </h2>
        <form action={createContact} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Contact Name *
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Jane Doe"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Company *
            </label>
            <input
              name="company"
              required
              placeholder="e.g. Netflix, Amazon"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <input
              name="role"
              placeholder="e.g. Engineering Manager"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              name="linkedInUrl"
              type="url"
              placeholder="https://linkedin.com/in/..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="jane@company.com"
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Save Contact
            </button>
          </div>
        </form>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <div className="col-span-full py-12 text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              No contacts saved yet for this account.
            </p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  {contact.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {contact.role ? `${contact.role} at ${contact.company}` : contact.company}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">
                  {contact.relationship || "Colleague"}
                </span>
                <div className="flex items-center gap-2">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="p-1 text-slate-400 hover:text-blue-600"
                      title="Send email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {contact.linkedInUrl && (
                    <a
                      href={contact.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-blue-600"
                      title="View LinkedIn profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
