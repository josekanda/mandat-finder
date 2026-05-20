"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ProspectListItem } from "@/app/(app)/prospects/page";

function getMarkerColor(score: number | null) {
  if ((score ?? 0) >= 80) return "#059669";
  if ((score ?? 0) >= 60) return "#d97706";
  return "#6b7280";
}

export default function ProspectsMap({
  prospects,
}: {
  prospects: ProspectListItem[];
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const points = useMemo(
    () =>
      prospects.filter(
        (prospect) =>
          typeof prospect.latitude === "number" &&
          typeof prospect.longitude === "number"
      ),
    [prospects]
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] =
      points.length > 0
        ? [points[0].longitude as number, points[0].latitude as number]
        : [4.8833, 45.7667];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/bright",
      center,
      zoom: points.length > 0 ? 11 : 9,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    points.forEach((prospect) => {
      const popupHtml = `
        <div style="min-width:220px">
          <div style="font-weight:600;color:#111827;margin-bottom:6px;">
            ${prospect.adresse ?? "Adresse inconnue"}
          </div>
          <div style="font-size:12px;color:#4b5563;margin-bottom:4px;">
            CP: ${prospect.code_postal ?? "—"}
          </div>
          <div style="font-size:12px;color:#4b5563;margin-bottom:4px;">
            Score: ${prospect.score ?? "—"} · DPE: ${prospect.etiquette_dpe ?? "—"}
          </div>
          <div style="font-size:12px;color:#4b5563;">
            Pipeline: ${prospect.statut ?? "découvert"}
          </div>
        </div>
      `;

      new maplibregl.Marker({ color: getMarkerColor(prospect.score) })
        .setLngLat([prospect.longitude as number, prospect.latitude as number])
        .setPopup(new maplibregl.Popup({ offset: 24 }).setHTML(popupHtml))
        .addTo(map);
    });

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();

      points.forEach((prospect) => {
        bounds.extend([prospect.longitude as number, prospect.latitude as number]);
      });

      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="text-base font-semibold text-neutral-950">Carte</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Les pins changent de couleur selon le score.
        </p>
      </div>

      {points.length === 0 ? (
        <div className="flex h-[540px] items-center justify-center px-6 text-center text-sm text-neutral-500">
          Aucun prospect géolocalisé pour le moment. Ajoute des coordonnées latitude / longitude
          dans la table <code className="mx-1 rounded bg-neutral-100 px-1.5 py-0.5">prospects</code>
          pour afficher la carte.
        </div>
      ) : (
        <div className="relative">
          <div ref={mapContainerRef} className="h-[540px] w-full" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-xs text-neutral-600 shadow-sm backdrop-blur">
            Vert = chaud · Orange = moyen · Gris = faible
          </div>
        </div>
      )}
    </div>
  );
}