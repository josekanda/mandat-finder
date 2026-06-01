import { createServiceClient } from "@/lib/supabase/server";
import ProspectsSync from "@/components/prospects-sync";

export type ProspectListItem = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  annee_construction: number | null;
  statut: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default async function ProspectsPage() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("prospects")
    .select("id, adresse, code_postal, score, annee_construction, statut, latitude, longitude")
    .order("score", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Prospects</h1>
        <p className="mt-2 text-sm text-red-700">
          Impossible de charger la liste des prospects.
        </p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  const prospects = (data ?? []) as ProspectListItem[];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-neutral-500">Pipeline commercial</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
          Prospects
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Explore la liste, trie les opportunités et visualise les adresses sur la carte pour repérer
          rapidement les zones à fort potentiel.
        </p>
      </section>

      <section>
        <ProspectsSync prospects={prospects} />
      </section>
    </div>
  );
}
