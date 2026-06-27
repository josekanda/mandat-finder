import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import ProspectsSync from "@/components/prospects-sync";
import { getZoneFilters } from "@/lib/zones";

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

const PERIODE_LABELS: Record<string, string> = {
  "pre1960":   "Pré-1960",
  "1960-1979": "1960–1979",
  "1980-1999": "1980–1999",
  "2000+":     "2000+",
};

type PageProps = {
  searchParams: Promise<{ periode?: string; statut?: string }>;
};

export default async function ProspectsPage({ searchParams }: PageProps) {
  const { periode, statut } = await searchParams;
  const supabase = createServiceClient();
  const zoneFilters = await getZoneFilters();

  let query = supabase
    .from("prospects")
    .select("id, adresse, code_postal, score, annee_construction, statut, latitude, longitude")
    .order("score", { ascending: false })
    .limit(500);

  // Filtre zones actives (FSA + région + municipalité)
  if (zoneFilters) query = query.or(zoneFilters.orFilter);

  // Filtre période de construction
  if (periode === "pre1960")   query = query.lte("annee_construction", 1960);
  if (periode === "1960-1979") query = query.gte("annee_construction", 1961).lte("annee_construction", 1979);
  if (periode === "1980-1999") query = query.gte("annee_construction", 1980).lte("annee_construction", 1999);
  if (periode === "2000+")     query = query.gte("annee_construction", 2000);

  // Filtre statut pipeline
  if (statut) query = query.eq("statut", statut);

  const { data, error } = await query;

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Prospects</h1>
        <p className="mt-2 text-sm text-red-700">Impossible de charger la liste des prospects.</p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  const prospects = (data ?? []) as ProspectListItem[];
  const activeFilter = periode
    ? `Période : ${PERIODE_LABELS[periode] ?? periode}`
    : statut
    ? `Statut : ${statut}`
    : null;

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

      {activeFilter && (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-neutral-900 px-3 py-1 text-sm font-medium text-white">
            {activeFilter}
          </span>
          <Link
            href="/prospects"
            className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-2"
          >
            Effacer le filtre
          </Link>
          <span className="text-sm text-neutral-400">{prospects.length} résultat{prospects.length > 1 ? "s" : ""}</span>
        </div>
      )}

      <section>
        <ProspectsSync prospects={prospects} />
      </section>
    </div>
  );
}
