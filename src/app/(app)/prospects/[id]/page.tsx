import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import ProspectStatusSelect from "@/components/prospect-status-select";

type ProspectDetail = {
  id: string;
  adresse: string | null;
  code_postal: string | null;
  score: number | null;
  annee_construction: number | null;
  evaluation_municipale: number | null;
  type_immeuble: string | null;
  nb_logements: number | null;
  statut: string | null;
  notes: string | null;
  source: string | null;
  type_bien: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function scoreBadgeClass(score: number | null) {
  if ((score ?? 0) >= 80) return "bg-emerald-100 text-emerald-800";
  if ((score ?? 0) >= 60) return "bg-amber-100 text-amber-800";
  return "bg-neutral-100 text-neutral-700";
}


async function updateProspectStatus(formData: FormData) {
  "use server";

  const prospectId = String(formData.get("prospectId") ?? "");
  const nextStatus = String(formData.get("statut") ?? "");

  const allowedStatuses = ["découvert", "contacté", "rdv", "mandat signé"];

  if (!prospectId || !allowedStatuses.includes(nextStatus)) {
    return;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("prospects")
    .update({ statut: nextStatus })
    .eq("id", prospectId);

  if (error) {
    redirect(`/prospects/${prospectId}?error=update_failed`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/prospects");
  revalidatePath(`/prospects/${prospectId}`);
}

async function updateProspectNotes(formData: FormData) {
  "use server";

  const prospectId = String(formData.get("prospectId") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!prospectId) return;

  const supabase = await createClient();

  const { error } = await supabase
    .from("prospects")
    .update({ notes })
    .eq("id", prospectId);

  if (error) {
    redirect(`/prospects/${prospectId}?error=notes_failed`);
  }

  revalidatePath(`/prospects/${prospectId}`);
}

export default async function ProspectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("prospects")
    .select(`
  id,
  adresse,
  code_postal,
  score,
  annee_construction,
  evaluation_municipale,
  type_immeuble,
  nb_logements,
  statut,
  notes,
  source,
  type_bien,
  latitude,
  longitude
`)
    .eq("id", id)
    .single();

  if (error) {
    notFound();
  }

  const prospect = data as unknown as ProspectDetail;

  const timeline = [
    {
      label: "Prospect détecté",
      value: "Ligne créée dans la base",
      done: true,
    },
    {
      label: "Analyse du potentiel",
      value: `Score actuel: ${prospect.score ?? "—"}`,
      done: (prospect.score ?? 0) > 0,
    },
    {
      label: "Premier contact",
      value: prospect.statut === "découvert" ? "À lancer" : "Engagé",
      done: ["contacté", "rdv", "mandat signé"].includes(
        (prospect.statut ?? "").toLowerCase()
      ),
    },
    {
      label: "Avancement commercial",
      value: prospect.statut ?? "découvert",
      done: ["rdv", "mandat signé"].includes(
        (prospect.statut ?? "").toLowerCase()
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/prospects"
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          ← Retour à la liste
        </Link>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadgeClass(
            prospect.score
          )}`}
        >
          Score {prospect.score ?? "—"}
        </span>

        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
          Construit en {prospect.annee_construction ?? "—"}
        </span>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-neutral-500">Fiche prospect</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
          {prospect.adresse ?? "Adresse inconnue"}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Code postal: {prospect.code_postal ?? "—"} · Type de bien: {prospect.type_bien ?? "—"} ·
          Source: {prospect.source ?? "—"}
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Signaux</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm text-neutral-500">Score</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-950">
                  {prospect.score ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm text-neutral-500">Année de construction</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-950">
                  {prospect.annee_construction ?? "—"}
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm text-neutral-500">Évaluation municipale</p>
                <p className="mt-2 text-xl font-semibold text-neutral-950">
                  {prospect.evaluation_municipale
                    ? new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(prospect.evaluation_municipale)
                    : "—"}
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm text-neutral-500">Type d'immeuble</p>
                <p className="mt-2 text-xl font-semibold text-neutral-950">
                  {prospect.type_immeuble ?? "—"}
                  {prospect.nb_logements ? ` · ${prospect.nb_logements} log.` : ""}
                </p>
              </div>

              <div className="rounded-xl bg-neutral-50 p-4">
                <p className="text-sm text-neutral-500">Coordonnées</p>
                <p className="mt-2 text-sm font-medium text-neutral-900">
                  {prospect.latitude ?? "—"}, {prospect.longitude ?? "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Notes</h2>
            <form action={updateProspectNotes} className="mt-4 space-y-3">
              <input type="hidden" name="prospectId" value={prospect.id} />
              <textarea
                name="notes"
                defaultValue={prospect.notes ?? ""}
                rows={5}
                placeholder="Commentaires commerciaux, objections, contexte du bien, historique des échanges…"
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-950 resize-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Enregistrer les notes
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Pipeline</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Fais évoluer le prospect dans le tunnel commercial.
            </p>

            <div className="mt-4">
              <ProspectStatusSelect
                prospectId={prospect.id}
                currentStatus={prospect.statut ?? "découvert"}
                action={updateProspectStatus}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Timeline</h2>
            <ol className="mt-4 space-y-4">
              {timeline.map((item) => (
                <li key={item.label} className="flex gap-3">
                  <div
                    className={`mt-1 h-2.5 w-2.5 rounded-full ${
                      item.done ? "bg-emerald-500" : "bg-neutral-300"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                    <p className="mt-1 text-sm text-neutral-500">{item.value}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Métadonnées</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">ID</dt>
                <dd className="max-w-[60%] break-all text-right text-neutral-900">{prospect.id}</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">Statut actuel</dt>
                <dd className="text-right text-neutral-900">
                  {prospect.statut ?? "découvert"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  );
}
