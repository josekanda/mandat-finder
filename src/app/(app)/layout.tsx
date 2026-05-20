// src/app/(app)/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/prospects", label: "Prospects" },
  { href: "/zones", label: "Zones" },
];

export default async function AppLayout({
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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-neutral-200 px-6 py-5">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
              Mandat Finder
            </Link>
            <p className="mt-1 text-sm text-neutral-500">
              Espace agence
            </p>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-neutral-200 px-6 py-4 text-xs text-neutral-500">
            Connecté en tant que
            <div className="mt-1 truncate text-sm font-medium text-neutral-800">
              {user.email}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  Espace agence
                </p>
                <p className="text-xs text-neutral-500">
                  Prospection immobilière ciblée
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-sm text-neutral-500 sm:inline">
                  {user.email}
                </span>
                <Link
                  href="/"
                  className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                >
                  Landing
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}