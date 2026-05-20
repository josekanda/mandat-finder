// src/app/(app)/zones/page.tsx
import { createClient } from "@/lib/supabase/server";

type ZoneRow = {
  id: string;
  code_postal: string | null;
  ville: string | null;
  actif: boolean | null;
  rayon_km: number | null;
};

export default async function ZonesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("zones")
    .select("id, code_postal, ville, actif, rayon_km")
    .order("code_postal", { ascending: true })
    .limit(100);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-xl font-semibold text-red-900">Zones</h1>
        <p className="mt-2 text-sm text-red-700">
          Impossible de charger la configuration des zones.
        </p>
        <p className="mt-1 text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  const zones = (data ?? []) as ZoneRow[];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-neutral-500">Périmètre commercial</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
          Zones
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Définis les secteurs surveillés par l’agence pour concentrer la prospection sur les
          communes et codes postaux prioritaires.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Zones configurées</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">{zones.length}</p>
          <p className="mt-2 text-xs text-neutral-500">Nombre de lignes visibles</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Zones actives</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {zones.filter((zone) => zone.actif).length}
          </p>
          <p className="mt-2 text-xs text-neutral-500">Périmètre actuellement exploité</p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Rayon moyen</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">
            {zones.length > 0
              ? Math.round(
                  zones.reduce((sum, zone) => sum + (zone.rayon_km ?? 0), 0) / zones.length
                )
              : 0}{" "}
            km
          </p>
          <p className="mt-2 text-xs text-neutral-500">Approximation sur les lignes chargées</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h2 className="text-base font-semibold text-neutral-950">Liste des zones</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Cette première version sert surtout à visualiser le périmètre configuré.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Code postal</th>
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Rayon</th>
                  <th className="px-5 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {zones.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-neutral-500">
                      Aucune zone configurée pour le moment.
                    </td>
                  </tr>
                ) : (
                  zones.map((zone) => (
                    <tr key={zone.id} className="border-t border-neutral-100">
                      <td className="px-5 py-4 font-medium text-neutral-900">
                        {zone.code_postal ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {zone.ville ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-neutral-600">
                        {zone.rayon_km ?? "—"} km
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            zone.actif
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {zone.actif ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Mode d’emploi</h2>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <p>
                Commence par les codes postaux où l’agence convertit déjà bien.
              </p>
              <p>
                Ajoute ensuite des zones proches avec un rayon raisonnable pour éviter de disperser la prospection.
              </p>
              <p>
                Dans une version suivante, cette page pourra intégrer création, édition et suppression des zones.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Exemple simple</h2>
            <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Villeurbanne 69100</p>
              <p className="mt-1">
                Zone active, rayon 3 à 5 km, idéale pour tester rapidement l’acquisition ciblée et
                la remontée des signaux faibles.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}