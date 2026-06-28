"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";

type Props = {
  prospects: Array<{
    annee_construction: number | null;
    statut: string | null;
    score: number | null;
  }>;
};

const DECADE_BUCKETS = [
  { label: "Pré-1960",  color: "#ef4444", test: (y: number) => y <= 1960,            param: "pre1960"   },
  { label: "1960–1979", color: "#f97316", test: (y: number) => y >= 1961 && y <= 1979, param: "1960-1979" },
  { label: "1980–1999", color: "#eab308", test: (y: number) => y >= 1980 && y <= 1999, param: "1980-1999" },
  { label: "2000+",     color: "#10b981", test: (y: number) => y >= 2000,              param: "2000+"     },
];

const STATUT_ORDER = ["découvert", "contacté", "rdv", "mandat signé"];
const STATUT_LABELS: Record<string, string> = {
  "découvert": "Découvert",
  "contacté": "Contacté",
  "rdv": "RDV",
  "mandat signé": "Signé",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-neutral-900">{label}</p>
      <p className="text-neutral-600">{payload[0].value} propriété{payload[0].value > 1 ? "s" : ""}</p>
    </div>
  );
}

export default function DashboardCharts({ prospects }: Props) {
  const router = useRouter();

  const decadeData = DECADE_BUCKETS.map(({ label, color, test, param }) => ({
    label,
    color,
    param,
    count: prospects.filter((p) => p.annee_construction != null && test(p.annee_construction)).length,
  })).filter((d) => d.count > 0);

  const statutData = STATUT_ORDER.map((s) => ({
    label: STATUT_LABELS[s],
    statut: s,
    count: prospects.filter((p) => (p.statut ?? "découvert") === s).length,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">Année de construction</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Propriétés par période · <span className="text-neutral-400">cliquer pour filtrer</span>
        </p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={decadeData}
              barCategoryGap="30%"
              style={{ cursor: "pointer" }}
            >
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(data: any) =>
                  router.push(`/prospects?periode=${data.param}`)
                }
              >
                {decadeData.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">État du pipeline</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Propriétés par étape · <span className="text-neutral-400">cliquer pour filtrer</span>
        </p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={statutData}
              barCategoryGap="30%"
              style={{ cursor: "pointer" }}
            >
              <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f5f5" }} />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                fill="#171717"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={(data: any) =>
                  router.push(`/prospects?statut=${encodeURIComponent(data.statut)}`)
                }
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
