"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const STEPS = [
  { num: "01", label: "Définir les zones à suivre." },
  { num: "02", label: "Injecter les données foncières." },
  { num: "03", label: "Scorer et prioriser les propriétés." },
  { num: "04", label: "Faire avancer le pipeline." },
];

export default function StepRail() {
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.35"],
  });

  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={ref} className="mt-10">
      {/* Rail */}
      <div className="relative h-px bg-neutral-200">
        <motion.div
          className="absolute inset-y-0 left-0 right-0 bg-neutral-950 origin-left"
          style={{ scaleX }}
        />

        {/* Dots */}
        <div className="absolute inset-0 flex items-center justify-between">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className="h-3 w-3 rounded-full border-2 border-neutral-950 bg-white"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.18, duration: 0.28, ease: "backOut" }}
            />
          ))}
        </div>
      </div>

      {/* Labels */}
      <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4, ease: "easeOut" }}
          >
            <p className="text-sm font-medium text-neutral-400">{step.num}</p>
            <p className="mt-2 text-base font-semibold text-neutral-950">{step.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
