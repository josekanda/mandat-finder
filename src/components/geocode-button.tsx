"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { prospectId: string };

export default function GeocodeButton({ prospectId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [postal, setPostal] = useState<string | null>(null);

  async function handleGeocode() {
    setStatus("loading");
    try {
      const res = await fetch(`/api/geocode/${prospectId}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setPostal(data.code_postal ?? null);
      setStatus("done");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm text-emerald-600 font-medium">
        ✓ Géocodé{postal ? ` — ${postal}` : ""}
      </p>
    );
  }

  if (status === "error") {
    return <p className="text-sm text-red-500">Adresse introuvable dans Nominatim</p>;
  }

  return (
    <button
      onClick={handleGeocode}
      disabled={status === "loading"}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 transition"
    >
      {status === "loading" ? "Géocodage…" : "📍 Obtenir le code postal"}
    </button>
  );
}
