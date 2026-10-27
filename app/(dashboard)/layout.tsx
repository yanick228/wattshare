import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userEmail = user.email || "";
  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Propriétaire";

  return (
    <div className="min-h-screen flex bg-slate-50/50 relative overflow-x-hidden">
      {/* Subtle Background Gradient Accents */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-0 left-1/4 w-[500px] h-[500px] bg-teal-100/30 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-40">
        <Sidebar userEmail={userEmail} userName={userName} />
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 relative z-10">
        <Header userEmail={userEmail} userName={userName} />
        <main className="flex-1 p-4 sm:p-5 lg:py-6 lg:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
