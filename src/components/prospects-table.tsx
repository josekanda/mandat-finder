"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProspectListItem } from "@/app/(app)/prospects/page";

type SortKey = "adresse" | "code_postal" | "score" | "annee_construction" | "statut";
type SortDirection = "asc" | "desc";

function compareValues(a: string | number | null, b: string | number | null) {
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "fr", { sensitivity: "base" });
}

function scoreBadgeClass(score: number | null) {
  if ((score ?? 0) >= 80) return "bg-emerald-100 text-emerald-800";
  if ((score ?? 0) >= 60) return "bg-amber-100 text-amber-800";
  return "bg-neutral-100 text-neutral-700";
}

function exportCsv(prospects: ProspectListItem[]) {
  const headers = ["id", "adresse", "code_postal", "score", "annee_construction", "statut"];
  const rows = prospects.map((p) =>
    [p.id, p.adresse ?? "", p.code_postal ?? "", p.score ?? "", p.annee_construction ?? "", p.statut ?? ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "prospects.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProspectsTable({
  prospects,
  hoveredId = null,
  onHover,
}: {
  prospects: ProspectListItem[];
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDirection(nextKey === "score" ? "desc" : "asc");
  }

  const sortedProspects = useMemo(() => {
    const copy = [...prospects];
    copy.sort((a, b) => {
      const result = compareValues(a[sortKey], b[sortKey]);
      return sortDirection === "asc" ? result : -result;
    });
    return copy;
  }, [prospects, sortDirection, sortKey]);

  const sortableHeaders: Array<{ key: SortKey; label: string }> = [
    { key: "adresse", label: "Adresse" },
    { key: "code_postal", label: "CP" },
    { key: "score", label: "Score" },
    { key: "annee_construction", label: "Construit en" },
    { key: "statut", label: "Pipeline" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">Liste triable</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Survole une ligne pour centrer la carte.
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(sortedProspects)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Exporter CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              {sortableHeaders.map((header) => (
                <th key={header.key} className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort(header.key)}
                    className="inline-flex items-center gap-2 text-left hover:text-neutral-900"
                  >
                    <span>{header.label}</span>
                    <span className="text-xs text-neutral-400">
                      {sortKey === header.key ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sortedProspects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-neutral-500">
                  Aucun prospect à afficher pour le moment.
                </td>
              </tr>
            ) : (
              sortedProspects.map((prospect) => {
                const isHovered = hoveredId === prospect.id;
                const hasCoords =
                  typeof prospect.latitude === "number" &&
                  typeof prospect.longitude === "number";

                return (
                  <tr
                    key={prospect.id}
                    className={`border-t border-neutral-100 transition-colors ${
                      isHovered ? "bg-blue-50" : hasCoords ? "cursor-pointer hover:bg-neutral-50" : ""
                    }`}
                    onMouseEnter={() => hasCoords && onHover?.(prospect.id)}
                    onMouseLeave={() => onHover?.(null)}
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/prospects/${prospect.id}`}
                        className="font-medium text-neutral-900 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {prospect.adresse ?? "Adresse inconnue"}
                      </Link>
                      {!hasCoords && (
                        <span className="ml-2 text-xs text-neutral-400">sans GPS</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-neutral-600">{prospect.code_postal ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${scoreBadgeClass(prospect.score)}`}>
                        {prospect.score ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">{prospect.annee_construction ?? "—"}</td>
                    <td className="px-5 py-4 text-neutral-600">{prospect.statut ?? "découvert"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
