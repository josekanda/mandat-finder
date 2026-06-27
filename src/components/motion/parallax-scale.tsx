"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export default function ParallaxScale({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <div ref={ref}>
      <motion.div style={{ scale }}>{children}</motion.div>
    </div>
  );
}
