import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const REGIONS_QC = [
  "Bas-Saint-Laurent",
  "Saguenay–Lac-Saint-Jean",
  "Capitale-Nationale",
  "Mauricie",
  "Estrie",
  "Montréal",
  "Outaouais",
  "Abitibi-Témiscamingue",
  "Côte-Nord",
  "Nord-du-Québec",
  "Gaspésie–Îles-de-la-Madeleine",
  "Chaudière-Appalaches",
  "Laval",
  "Lanaudière",
  "Laurentides",
  "Montérégie",
  "Centre-du-Québec",
];

type ZoneRow = {
  id: string;
  code_postal: string | null;
  ville: string | null;
  region_administrative: string | null;
  actif: boolean | null;
  rayon_km: number | null;
};

async function addZone(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const supa = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const agence = await supa.from("agences").select("id").limit(1).single();
  if (!agence.data) return;

  const code_postal = (formData.get("code_postal") as string ?? "").trim().toUpperCase() || null;
  const ville = (formData.get("ville") as string ?? "").trim() || null;
  const region = (formData.get("region_administrative") as string ?? "").trim();

  if (!region) return;

  await supa.from("zones").insert({
    agence_id: agence.data.id,
    code_postal,
    ville,
    region_administrative: region,
    actif: true,
  });

  revalidatePath("/zones");
}

async function deleteZone(formData: FormData) {
  "use server";
  const supa = createServiceClient();
  const id = formData.get("id") as string;
  if (!id) return;
  await supa.from("zones").delete().eq("id", id);
  revalidatePath("/zones");
}

async function toggleZone(formData: FormData) {
  "use server";
  const supa = createServiceClient();
  const id = formData.get("id") as string;
  const actif = formData.get("actif") === "true";
  if (!id) return;
  await supa.from("zones").update({ actif: !actif }).eq("id", id);
  revalidatePath("/zones");
}

export default async function ZonesPage() {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("zones")
    .select("id, code_postal, ville, region_administrative, actif, rayon_km")
    .order("region_administrative", { ascending: true })
    .limit(200);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">Impossible de charger les zones : {error.message}</p>
      </div>
    );
  }

  const zones = (data ?? []) as ZoneRow[];
  const actives = zones.filter((z) => z.actif);

  // Regrouper par région
  const byRegion: Record<string, ZoneRow[]> = {};
  for (const z of zones) {
    const r = z.region_administrative ?? "Sans région";
    if (!byRegion[r]) byRegion[r] = [];
    byRegion[r].push(z);
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-neutral-500">Périmètre commercial</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">Zones</h1>
        <p className="mt-2 max-w-3xl text-sm text-neutral-600">
          Définis les secteurs surveillés par l'agence : région administrative, préfixe postal (FSA 3 caractères) et ville.
        </p>
      </section>

      {/* KPIs */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Zones configurées</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">{zones.length}</p>
          <p className="mt-2 text-xs text-neutral-500">{Object.keys(byRegion).length} région{Object.keys(byRegion).length > 1 ? "s" : ""}</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Zones actives</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">{actives.length}</p>
          <p className="mt-2 text-xs text-neutral-500">Périmètre actuellement exploité</p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-neutral-500">Régions couvertes</p>
          <p className="mt-3 text-3xl font-semibold text-neutral-950">{Object.keys(byRegion).length}</p>
          <p className="mt-2 text-xs text-neutral-500">Régions administratives</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Liste groupée par région */}
        <div className="space-y-4">
          {zones.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
              Aucune zone configurée — ajoute ta première zone ci-contre.
            </div>
          ) : (
            Object.entries(byRegion).map(([region, regionZones]) => (
              <div key={region} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-3">
                  <h2 className="text-sm font-semibold text-neutral-700">{region}</h2>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="text-left text-neutral-500">
                    <tr>
                      <th className="px-5 py-2.5 font-medium">Préfixe postal</th>
                      <th className="px-5 py-2.5 font-medium">Ville</th>
                      <th className="px-5 py-2.5 font-medium">Statut</th>
                      <th className="px-5 py-2.5 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionZones.map((zone) => (
                      <tr key={zone.id} className="border-t border-neutral-100">
                        <td className="px-5 py-3">
                          <span className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-sm font-semibold text-neutral-900">
                            {zone.code_postal ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-neutral-600">{zone.ville ?? "—"}</td>
                        <td className="px-5 py-3">
                          <form action={toggleZone}>
                            <input type="hidden" name="id" value={zone.id} />
                            <input type="hidden" name="actif" value={String(zone.actif)} />
                            <button
                              type="submit"
                              className={`rounded-full px-2.5 py-1 text-xs font-medium transition hover:opacity-80 ${
                                zone.actif
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {zone.actif ? "Active" : "Inactive"}
                            </button>
                          </form>
                        </td>
                        <td className="px-5 py-3">
                          <form action={deleteZone}>
                            <input type="hidden" name="id" value={zone.id} />
                            <button
                              type="submit"
                              className="text-xs text-neutral-400 hover:text-red-600 transition"
                            >
                              Supprimer
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* Formulaire d'ajout */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Ajouter une zone</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Le préfixe postal FSA correspond aux 3 premiers caractères (ex&nbsp;: H2S, H1S, G1K).
            </p>

            <form action={addZone} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Région administrative
                </label>
                <select
                  name="region_administrative"
                  required
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-950"
                >
                  <option value="">— Choisir —</option>
                  {REGIONS_QC.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Préfixe postal FSA (3 car.) <span className="text-neutral-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="code_postal"
                  maxLength={3}
                  placeholder="ex : H2S  (optionnel)"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-sm uppercase text-neutral-900 outline-none focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Ville / Arrondissement <span className="text-neutral-400 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  name="ville"
                  placeholder="ex : Rosemont, Plateau-Mont-Royal"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-950"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Ajouter la zone
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-neutral-950">Exemples de FSA Montréal</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
              {[
                ["H2S", "Rosemont"],
                ["H1S", "Mercier"],
                ["H2J", "Plateau-Mont-Royal"],
                ["H3H", "Ville-Marie"],
                ["H4E", "LaSalle"],
                ["H8R", "Lachine"],
              ].map(([fsa, nom]) => (
                <div key={fsa} className="rounded-lg bg-neutral-50 px-3 py-2">
                  <span className="font-mono font-semibold text-neutral-900">{fsa}</span>
                  <span className="ml-2 text-neutral-500">{nom}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
