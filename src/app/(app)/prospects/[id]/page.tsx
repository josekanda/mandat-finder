import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import ProspectStatusSelect from "@/components/prospect-status-select";
import ProspectMap from "@/components/prospect-map";
import GeocodeButton from "@/components/geocode-button";

type ProspectDetail = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  municipalite: string | null;
  region_administrative: string | null;
  mrc: string | null;
  score: number | null;
  annee_construction: number | null;
  annees_detention: number | null;
  evaluation_municipale: number | null;
  type_immeuble: string | null;
  nb_logements: number | null;
  is_societe: boolean | null;
  statut: string | null;
  notes: string | null;
  source: string | null;
  type_bien: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PageProps = { params: Promise<{ id: string }> };

function scoreBadge(score: number | null) {
  const s = score ?? 0;
  if (s >= 80) return "border-[#C9A84C]/40 bg-[#C9A84C]/15 text-[#C9A84C]";
  if (s >= 70) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  return "border-[#272727] bg-[#1C1C1C] text-[#777]";
}

async function updateProspectStatus(formData: FormData) {
  "use server";
  const prospectId = String(formData.get("prospectId") ?? "");
  const nextStatus = String(formData.get("statut") ?? "");
  const allowed    = ["découvert", "contacté", "rdv", "mandat signé"];
  if (!prospectId || !allowed.includes(nextStatus)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").update({ statut: nextStatus }).eq("id", prospectId);
  if (error) redirect(`/prospects/${prospectId}?error=update_failed`);
  revalidatePath("/dashboard");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospectId}`);
}

async function updateProspectNotes(formData: FormData) {
  "use server";
  const prospectId = String(formData.get("prospectId") ?? "");
  const notes      = String(formData.get("notes") ?? "");
  if (!prospectId) return;
  const supabase = await createClient();
  const { error } = await supabase.from("prospects").update({ notes }).eq("id", prospectId);
  if (error) redirect(`/prospects/${prospectId}?error=notes_failed`);
  revalidatePath(`/prospects/${prospectId}`);
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("prospects")
    .select(`id, adresse, code_postal, municipalite, region_administrative, mrc, score,
             annee_construction, annees_detention, evaluation_municipale, type_immeuble,
             nb_logements, is_societe, statut, notes, source, type_bien, latitude, longitude`)
    .eq("id", id)
    .single();

  if (error) notFound();
  const p = data as unknown as ProspectDetail;

  const timeline = [
    { label: "Prospect détecté",      value: "Ligne créée dans la base",          done: true },
    { label: "Analyse du potentiel",  value: `Score actuel : ${p.score ?? "—"}`,   done: (p.score ?? 0) > 0 },
    { label: "Premier contact",       value: p.statut === "découvert" ? "À lancer" : "Engagé",
      done: ["contacté", "rdv", "mandat signé"].includes((p.statut ?? "").toLowerCase()) },
    { label: "Avancement commercial", value: p.statut ?? "découvert",
      done: ["rdv", "mandat signé"].includes((p.statut ?? "").toLowerCase()) },
  ];

  return (
    <div className="space-y-6">

      {/* Breadcrumb + badges */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/prospects"
          className="rounded-lg border border-[#272727] px-3 py-2 text-sm font-medium text-[#777] transition hover:border-[#C9A84C] hover:text-[#C9A84C]"
        >
          ← Retour à la liste
        </Link>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${scoreBadge(p.score)}`}>
          Score {p.score ?? "—"}
        </span>
        {p.annee_construction && (
          <span className="rounded-full border border-[#272727] bg-[#1C1C1C] px-2.5 py-1 text-xs font-medium text-[#777]">
            Construit en {p.annee_construction}
          </span>
        )}
      </div>

      {/* En-tête */}
      <section className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Fiche prospect</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#F0F0F0]">
          {p.adresse ?? "Adresse inconnue"}
        </h1>
        <p className="mt-2 text-sm text-[#777]">
          {p.code_postal ?? "—"} · {p.type_bien ?? "—"} · Source : {p.source ?? "—"}
        </p>
      </section>

      {/* Carte GPS */}
      {p.latitude != null && p.longitude != null && (
        <section className="rounded-2xl border border-[#272727] bg-[#141414] p-4 shadow-sm">
          <p className="mb-3 text-sm font-medium text-[#777]">
            Localisation · {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
          </p>
          <ProspectMap latitude={p.latitude} longitude={p.longitude} adresse={p.adresse} />
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">

          {/* Couche 1 — Géographique */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Couche 1 · Géographique</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Municipalité</p>
                <p className="mt-1 font-semibold text-[#F0F0F0]">{p.municipalite ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Code postal</p>
                <div className="mt-1 flex items-center gap-2 flex-wrap font-semibold text-[#F0F0F0]">
                  {p.latitude != null ? (
                    <span>{p.code_postal ?? "—"}</span>
                  ) : (
                    <>
                      <span className="text-sm italic text-[#555]">Non géocodé</span>
                      <GeocodeButton prospectId={p.id} />
                    </>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Région administrative</p>
                <p className="mt-1 font-semibold text-[#F0F0F0]">{p.region_administrative ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">MRC</p>
                <p className="mt-1 font-semibold text-[#F0F0F0]">{p.mrc ?? "—"}</p>
              </div>
              {p.latitude != null && (
                <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4 sm:col-span-2">
                  <p className="text-sm text-[#777]">Coordonnées GPS</p>
                  <p className="mt-1 font-mono text-sm text-[#F0F0F0]">
                    {p.latitude.toFixed(5)}, {p.longitude?.toFixed(5)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Couche 2 — Foncière */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Couche 2 · Foncière</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Type d'immeuble</p>
                <p className="mt-1 font-semibold text-[#F0F0F0]">{p.type_immeuble ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Nombre de logements</p>
                <p className="mt-1 text-2xl font-semibold text-[#F0F0F0]">{p.nb_logements ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Année de construction</p>
                <p className="mt-1 text-2xl font-semibold text-[#F0F0F0]">{p.annee_construction ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Évaluation municipale</p>
                <p className={`mt-1 text-xl font-semibold ${(p.evaluation_municipale ?? 0) >= 500_000 ? "text-[#C9A84C]" : "text-[#F0F0F0]"}`}>
                  {p.evaluation_municipale
                    ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(p.evaluation_municipale)
                    : "—"}
                </p>
                {(p.evaluation_municipale ?? 0) >= 500_000 && (
                  <p className="mt-1 text-xs text-[#C9A84C]">Deal &gt; 500k$ — commission élevée</p>
                )}
              </div>
            </div>
          </div>

          {/* Couche 3 — Signaux */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Couche 3 · Signaux</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Score global</p>
                <p className="mt-1 text-3xl font-bold text-[#C9A84C]">
                  {p.score ?? "—"}<span className="text-base font-normal text-[#555]"> /100</span>
                </p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Durée de détention</p>
                <p className={`mt-1 text-2xl font-semibold ${(p.annees_detention ?? 0) > 15 ? "text-emerald-400" : "text-[#F0F0F0]"}`}>
                  {p.annees_detention != null ? `${Math.round(p.annees_detention)} ans` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Évaluation municipale</p>
                <p className={`mt-1 text-2xl font-semibold ${(p.evaluation_municipale ?? 0) >= 500_000 ? "text-[#C9A84C]" : "text-[#F0F0F0]"}`}>
                  {p.evaluation_municipale != null
                    ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(p.evaluation_municipale)
                    : "—"}
                </p>
                {(p.evaluation_municipale ?? 0) >= 500_000 && (
                  <p className="mt-1 text-xs text-[#C9A84C]">Deal &gt; 500k$ — commission élevée</p>
                )}
              </div>
              <div className="rounded-xl border border-[#272727] bg-[#1C1C1C] p-4">
                <p className="text-sm text-[#777]">Type de propriétaire</p>
                <p className="mt-1 font-semibold text-[#F0F0F0]">
                  {p.is_societe ? "Société (personne morale)" : "Personne physique"}
                </p>
                {p.is_societe && (
                  <p className="mt-1 text-xs text-[#C9A84C]">Vérifiable au REQ</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#F0F0F0]">Notes</h2>
            <form action={updateProspectNotes} className="mt-4 space-y-3">
              <input type="hidden" name="prospectId" value={p.id} />
              <textarea
                name="notes"
                defaultValue={p.notes ?? ""}
                rows={5}
                placeholder="Commentaires commerciaux, objections, contexte, historique des échanges…"
                className="w-full resize-none rounded-lg border border-[#272727] bg-[#1C1C1C] px-3 py-2 text-sm text-[#F0F0F0] outline-none transition placeholder:text-[#555] focus:border-[#C9A84C]"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#C9A84C] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#E5C97A]"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {/* Pipeline */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#F0F0F0]">Pipeline</h2>
            <p className="mt-2 text-sm text-[#777]">Fais évoluer le prospect dans le tunnel commercial.</p>
            <div className="mt-4">
              <ProspectStatusSelect
                prospectId={p.id}
                currentStatus={p.statut ?? "découvert"}
                action={updateProspectStatus}
              />
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#F0F0F0]">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((item) => (
                <li key={item.label} className="flex gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.done ? "bg-[#C9A84C]" : "bg-[#272727]"}`} />
                  <div>
                    <p className="text-sm font-medium text-[#F0F0F0]">{item.label}</p>
                    <p className="mt-0.5 text-sm text-[#777]">{item.value}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Métadonnées */}
          <div className="rounded-2xl border border-[#272727] bg-[#141414] p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#F0F0F0]">Métadonnées</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#777]">ID</dt>
                <dd className="max-w-[60%] break-all text-right text-[#AAA]">{p.id}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-[#777]">Statut actuel</dt>
                <dd className="text-right text-[#F0F0F0]">{p.statut ?? "découvert"}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
