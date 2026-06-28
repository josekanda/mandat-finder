import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/dashboard-charts";
import { getZoneFilters } from "@/lib/zones";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CA").format(value);
}

type ProspectRow = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  annee_construction: number | null;
  statut: string | null;
};

function scoreBadge(score: number | null) {
  const s = score ?? 0;
  if (s >= 80) return "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30";
  if (s >= 70) return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25";
  return "bg-[#1C1C1C] text-[#777] border border-[#272727]";
}

export default async function DashboardPage() {
  const supabase = createServiceClient();
  const zoneFilters = await getZoneFilters();
  const zoneFilter = zoneFilters?.orFilter ?? null;
  const fsaPrefixes = zoneFilters?.fsaPrefixes ?? null;

  let prospectsQuery = supabase
    .from("prospects")
    .select("id, adresse, code_postal, score, annee_construction, statut")
    .order("score", { ascending: false })
    .limit(500);
  if (zoneFilter) prospectsQuery = prospectsQuery.or(zoneFilter);

  let chartQuery = supabase
    .from("prospects")
    .select("annee_construction, statut, score")
    .limit(500);
  if (zoneFilter) chartQuery = chartQuery.or(zoneFilter);

  const { data: prospects, error } = await prospectsQuery;
  const { data: chartData } = await chartQuery;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <h1 className="text-xl font-semibold text-red-400">Dashboard</h1>
        <p className="mt-2 text-sm text-red-400/80">Impossible de charger les prospects.</p>
        <p className="mt-1 text-xs text-red-400/60">{error.message}</p>
      </div>
    );
  }

  const rows = (prospects ?? []) as ProspectRow[];
  const totalProspects   = rows.length;
  const hotProspects     = rows.filter((r) => (r.score ?? 0) >= 70).length;
  const pre1960          = rows.filter((r) => (r.annee_construction ?? Infinity) <= 1960).length;
  const contacted        = rows.filter((r) =>
    ["contacté", "rdv", "mandat signé"].includes((r.statut ?? "").toLowerCase())
  ).length;

  const topProspects = rows.slice(0, 5);
  const zoneActive   = zoneFilters !== null;

  return (
    <div className="space-y-8">

      {/* Titre */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Vue d'ensemble</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F0F0F0]">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#777]">
          Suis les opportunités prioritaires, les bâtiments pré-1960 et les prospects déjà engagés.
        </p>
      </section>

      {/* Filtre zone actif */}
      {zoneActive && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <p className="text-sm text-emerald-400">
            Filtré par zones actives : <span className="font-semibold">{fsaPrefixes!.join(", ")}</span>
          </p>
          <Link href="/zones" className="ml-auto text-xs text-emerald-400/70 underline underline-offset-2">
            Gérer les zones
          </Link>
        </div>
      )}

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Propriétés visibles",  value: formatNumber(totalProspects), sub: "Résultats chargés" },
          { label: "Prospects ≥ 70 pts",   value: formatNumber(hotProspects),   sub: "Score fort", gold: true },
          { label: "Bâtiments pré-1960",   value: formatNumber(pre1960),        sub: "Signal pré-1960 (+40 pts)" },
          { label: "Déjà engagés",         value: formatNumber(contacted),       sub: "Contactés, RDV ou signé" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-2xl border p-5 shadow-sm ${kpi.gold ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-[#272727] bg-[#141414]"}`}
          >
            <p className="text-sm text-[#777]">{kpi.label}</p>
            <p className={`mt-3 text-3xl font-bold ${kpi.gold ? "text-[#C9A84C]" : "text-[#F0F0F0]"}`}>
              {kpi.value}
            </p>
            <p className="mt-2 text-xs text-[#555]">{kpi.sub}</p>
          </div>
        ))}
      </section>

      {/* Top prospects + lecture rapide */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-[#272727] bg-[#141414] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#272727] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#F0F0F0]">Top prospects</h2>
              <p className="mt-1 text-sm text-[#777]">Les opportunités les plus prometteuses</p>
            </div>
            <Link
              href="/prospects"
              className="rounded-lg border border-[#272727] px-3 py-2 text-sm font-medium text-[#777] transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
            >
              Voir tout
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#0C0C0C] text-left">
                <tr>
                  {["Adresse", "Code postal", "Score", "Construit en", "Pipeline"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#555]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topProspects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[#555]">
                      Aucun prospect disponible.
                    </td>
                  </tr>
                ) : (
                  topProspects.map((p) => (
                    <tr key={p.id} className="border-t border-[#1C1C1C] hover:bg-[#1A1A1A]">
                      <td className="px-5 py-4">
                        <Link href={`/prospects/${p.id}`} className="font-medium text-[#F0F0F0] hover:text-[#C9A84C]">
                          {p.adresse ?? "Adresse inconnue"}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-[#777]">{p.code_postal ?? "—"}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadge(p.score)}`}>
                          {p.score ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#777]">{p.annee_construction ?? "—"}</td>
                      <td className="px-5 py-4 text-[#777]">{p.statut ?? "découvert"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-[#272727] bg-[#141414] p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[#F0F0F0]">Lecture rapide</h2>
          <div className="mt-4 space-y-3 text-sm">
            {[
              { title: "Priorité du jour",      body: "Commencer par les scores ≥ 70 et les bâtiments pré-1960 — ce sont les signaux les plus forts." },
              { title: "Action recommandée",    body: "Ouvre la liste prospects, trie par score et qualifie les fiches une par une." },
              { title: "Étape suivante",         body: "Mets à jour le statut pipeline dès qu'un contact est lancé." },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="font-medium text-[#F0F0F0]">{c.title}</p>
                <p className="mt-1 text-[#777]">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <DashboardCharts prospects={chartData ?? []} />
      </section>
    </div>
  );
}
