import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";
import { AICopilotDrawer } from "@/components/ai/ai-copilot-drawer";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar user={session.user} />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
      <AICopilotDrawer />
    </div>
  );
}
