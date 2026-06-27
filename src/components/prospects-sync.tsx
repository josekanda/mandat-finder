"use client";

import { useState } from "react";
import ProspectsTable from "@/components/prospects-table";
import ProspectsMap from "@/components/prospects-map";
import type { ProspectListItem } from "@/app/(app)/prospects/page";

export default function ProspectsSync({ prospects }: { prospects: ProspectListItem[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="min-w-0">
        <ProspectsTable
          prospects={prospects}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>
      <div className="min-w-0">
        <ProspectsMap
          prospects={prospects}
          hoveredId={hoveredId}
        />
      </div>
    </div>
  );
}
