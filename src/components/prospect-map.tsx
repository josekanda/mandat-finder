"use client";

import Map, { Marker } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Carto Positron — vecteur, gratuit, sans clé API
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

type Props = {
  latitude: number;
  longitude: number;
  adresse?: string | null;
};

export default function ProspectMap({ latitude, longitude, adresse }: Props) {
  return (
    <div className="h-[300px] w-full overflow-hidden rounded-xl">
      <Map
        initialViewState={{ latitude, longitude, zoom: 15 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
      >
        <Marker latitude={latitude} longitude={longitude} anchor="bottom">
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-4 w-4 rounded-full bg-red-500 ring-2 ring-white shadow-lg" />
            {adresse && (
              <div className="max-w-[180px] truncate rounded bg-white px-2 py-0.5 text-[11px] font-medium shadow">
                {adresse}
              </div>
            )}
          </div>
        </Marker>
      </Map>
    </div>
  );
}
