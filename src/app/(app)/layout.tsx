import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard",  icon: "▦" },
  { href: "/prospects",  label: "Prospects",  icon: "◈" },
  { href: "/zones",      label: "Zones",      icon: "◎" },
];

async function logout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/login");
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[#0C0C0C] text-[#F0F0F0]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">

        {/* ── Sidebar ── */}
        <aside className="hidden w-60 shrink-0 border-r border-[#272727] bg-[#0E0E0E] lg:flex lg:flex-col">

          {/* Logo */}
          <div className="border-b border-[#272727] px-5 py-5">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-black"
                style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
              >
                IS
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F0F0F0]">Immosignaux</p>
                <p className="text-[11px] text-[#555]">Prospection ciblée</p>
              </div>
            </Link>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#777] transition hover:bg-[#1C1C1C] hover:text-[#C9A84C]"
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Profil + logout */}
          <div className="border-t border-[#272727] px-4 py-4">
            <p className="text-[11px] text-[#555]">Connecté</p>
            <p className="mt-0.5 truncate text-xs font-medium text-[#AAA]">{user.email}</p>
            <form action={logout} className="mt-3">
              <button
                type="submit"
                className="w-full rounded-lg border border-[#272727] px-3 py-1.5 text-xs font-medium text-[#777] transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <div className="flex min-h-screen flex-1 flex-col">

          {/* Header mobile */}
          <header className="sticky top-0 z-20 border-b border-[#272727] bg-[#0C0C0C]/90 backdrop-blur lg:hidden">
            <div className="flex h-14 items-center justify-between px-4">
              <Link href="/dashboard" className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-black"
                  style={{ background: "linear-gradient(135deg, #C9A84C, #A07830)" }}
                >
                  IS
                </div>
                <span className="text-sm font-semibold text-[#F0F0F0]">Immosignaux</span>
              </Link>
              <div className="flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-[#777] hover:text-[#C9A84C]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}
