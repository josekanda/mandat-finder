"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export default function Parallax({
  children,
  offset = 24,
}: {
  children: React.ReactNode;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <div ref={ref}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}