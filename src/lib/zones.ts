import { createServiceClient } from "@/lib/supabase/server";

type ZoneFilter = {
  orFilter: string;       // filtre Supabase .or(...)
  fsaPrefixes: string[];  // pour l'affichage dans le badge
};

/**
 * Construit le filtre OR pour les zones actives.
 * Couvre deux cas :
 *  1. Prospects géocodés  → code_postal commence par le préfixe FSA (ex: H2L%)
 *  2. Prospects non géocodés → region_administrative ou municipalite correspond
 *
 * Retourne null si aucune zone active → pas de filtre, tout s'affiche.
 */
export async function getZoneFilters(): Promise<ZoneFilter | null> {
  const supa = createServiceClient();
  const { data } = await supa
    .from("zones")
    .select("code_postal, region_administrative, ville")
    .eq("actif", true);

  if (!data || data.length === 0) return null;

  const parts: string[] = [];
  const fsaPrefixes: string[] = [];

  for (const z of data) {
    if (z.code_postal) {
      parts.push(`code_postal.ilike.${z.code_postal}%`);
      fsaPrefixes.push(z.code_postal);
    }
    if (z.region_administrative) {
      parts.push(`region_administrative.eq.${z.region_administrative}`);
      parts.push(`municipalite.eq.${z.region_administrative}`);
    }
    if (z.ville) {
      parts.push(`municipalite.eq.${z.ville}`);
    }
  }

  if (parts.length === 0) return null;

  // Dédoublonner
  const unique = [...new Set(parts)];

  return { orFilter: unique.join(","), fsaPrefixes };
}
