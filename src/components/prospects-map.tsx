"use client";

import { useEffect, useMemo, useRef } from "react";
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
  hoveredId = null,
}: {
  prospects: ProspectListItem[];
  hoveredId?: string | null;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const points = useMemo(
    () =>
      prospects.filter(
        (p) => typeof p.latitude === "number" && typeof p.longitude === "number"
      ),
    [prospects]
  );

  // Initialise la carte et les marqueurs
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
            Score: ${prospect.score ?? "—"} · Construit en: ${prospect.annee_construction ?? "—"}
          </div>
          <div style="font-size:12px;color:#4b5563;">
            Pipeline: ${prospect.statut ?? "découvert"}
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 24, closeButton: false }).setHTML(popupHtml);

      const marker = new maplibregl.Marker({ color: getMarkerColor(prospect.score) })
        .setLngLat([prospect.longitude as number, prospect.latitude as number])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(prospect.id, marker);
    });

    if (points.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.longitude as number, p.latitude as number]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }

    return () => {
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [points]);

  // Synchronise la carte avec la ligne survolée
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Ferme tous les popups ouverts
    markersRef.current.forEach((marker) => {
      if (marker.getPopup().isOpen()) marker.togglePopup();
    });

    if (!hoveredId) return;

    const prospect = points.find((p) => p.id === hoveredId);
    const marker = markersRef.current.get(hoveredId);
    if (!prospect || !marker) return;

    map.flyTo({
      center: [prospect.longitude as number, prospect.latitude as number],
      zoom: Math.max(map.getZoom(), 15),
      duration: 700,
      essential: true,
    });

    // Ouvre le popup après le vol
    const timer = setTimeout(() => {
      if (!marker.getPopup().isOpen()) marker.togglePopup();
    }, 750);

    return () => clearTimeout(timer);
  }, [hoveredId, points]);

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-5 py-4">
        <h2 className="text-base font-semibold text-neutral-950">Carte</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Survole une ligne du tableau pour centrer et ouvrir le détail.
        </p>
      </div>

      {points.length === 0 ? (
        <div className="flex h-[540px] items-center justify-center px-6 text-center text-sm text-neutral-500">
          Aucun prospect géolocalisé pour le moment.
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
