// src/app/(app)/dashboard/page.tsx
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/dashboard-charts";

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

export default async function DashboardPage() {
  const supabase = createServiceClient();

  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, adresse, code_postal, score, annee_construction, statut")
    .order("score", { ascending: false })
    .limit(12);

  const { data: chartData } = await supabase
    .from("prospects")
    .select("annee_construction, statut, score")
    .limit(500);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Dashboard</h1>
        <p className="mt-2 text-sm text-red-700">
          Impossible de charger les prospects pour le moment.
        </p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  const rows = (prospects ?? []) as ProspectRow[];

  const totalProspects = rows.length;
  const hotProspects = rows.filter((row) => (row.score ?? 0) >= 80).length;
  const pre1960 = rows.filter((row) => (row.annee_construction ?? Infinity) <= 1960).length;
  const contacted = rows.filter((row) =>
    ["contacté", "rdv", "mandat signé"].includes((row.statut ?? "").toLowerCase())
  ).length;

  const topProspects = rows.slice(0, 5);

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-neutral-500">Vue d’ensemble</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Suis les opportunités prioritaires, les biens énergivores et les prospects déjà engagés dans le pipeline.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Propriétés visibles</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {formatNumber(totalProspects)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Résultats chargés pour le dashboard
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Biens chauds</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {formatNumber(hotProspects)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Score supérieur ou égal à 80
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Bâtiments pré-1960</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {formatNumber(pre1960)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Opportunités de rénovation à prioriser
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Déjà engagés</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {formatNumber(contacted)}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Contactés, RDV ou mandat signé
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">Top prospects</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Les opportunités les plus prometteuses du moment
              </p>
            </div>

            <Link
              href="/prospects"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Voir tout
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Adresse</th>
                  <th className="px-5 py-3 font-medium">Code postal</th>
                  <th className="px-5 py-3 font-medium">Score</th>
                  <th className="px-5 py-3 font-medium">Construit en</th>
                  <th className="px-5 py-3 font-medium">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {topProspects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">
                      Aucun prospect disponible pour le moment.
                    </td>
                  </tr>
                ) : (
                  topProspects.map((prospect) => (
                    <tr key={prospect.id} className="border-t border-neutral-100">
                      <td className="px-5 py-4">
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="font-medium text-neutral-900 hover:underline"
                        >
                          {prospect.adresse ?? "Adresse inconnue"}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {prospect.code_postal ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                          {prospect.score ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {prospect.annee_construction ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {prospect.statut ?? "découvert"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-neutral-950">Lecture rapide</h2>
          <div className="mt-4 space-y-4 text-sm text-neutral-600">
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="font-medium text-neutral-900">Priorité du jour</p>
              <p className="mt-1">
                Commencer par les scores élevés et les DPE F/G permet de concentrer l’effort commercial sur les cas à potentiel.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="font-medium text-neutral-900">Action recommandée</p>
              <p className="mt-1">
                Ouvre la liste prospects pour trier, explorer la carte et qualifier les fiches une par une.
              </p>
            </div>

            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="font-medium text-neutral-900">Étape suivante</p>
              <p className="mt-1">
                Mets à jour le statut pipeline dès qu’un contact est lancé pour garder une vue exploitable.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <DashboardCharts prospects={chartData ?? []} />
      </section>
    </div>
  );
}