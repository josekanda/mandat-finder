import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const QC_LAT = { min: 44.9, max: 62.6 };
const QC_LON = { min: -79.8, max: -57.1 };

async function nominatim(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: { "User-Agent": "MandatFinderQuebec/1.0 contact@mandat-finder.ca" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const hits = await res.json();
  return hits[0] ?? null;
}

const ABBREV: Record<string, string> = {
  RU: "Rue", AV: "Avenue", BD: "Boulevard", CH: "Chemin",
  PL: "Place", CR: "Croissant", MT: "Montée", RG: "Rang",
  RTE: "Route", TER: "Terrasse", AM: "Allée", IMP: "Impasse",
};

function expandAddress(adresse: string) {
  return adresse.split(" ").map((p) => ABBREV[p.toUpperCase()] ?? p).join(" ");
}

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("id, adresse, municipalite")
    .eq("id", id)
    .single();

  if (error || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  if (!prospect.adresse) {
    return NextResponse.json({ error: "Adresse manquante" }, { status: 400 });
  }

  const ville = prospect.municipalite ?? "Québec";
  const expanded = expandAddress(prospect.adresse);
  const query = `${expanded}, ${ville}, Québec, Canada`;

  const hit = await nominatim(query);

  if (!hit) {
    return NextResponse.json({ error: "Adresse introuvable" }, { status: 404 });
  }

  const lat = parseFloat(hit.lat);
  const lon = parseFloat(hit.lon);
  const postal: string | null = hit.address?.postcode ?? null;

  // Rejeter si hors Québec
  if (lat < QC_LAT.min || lat > QC_LAT.max || lon < QC_LON.min || lon > QC_LON.max) {
    return NextResponse.json({ error: "Coordonnées hors Québec" }, { status: 422 });
  }

  const update: Record<string, unknown> = { latitude: lat, longitude: lon };
  if (postal) update.code_postal = postal;

  const { error: updateError } = await supabase
    .from("prospects")
    .update(update)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur de mise à jour" }, { status: 500 });
  }

  return NextResponse.json({ latitude: lat, longitude: lon, code_postal: postal });
}
