"use client";

import { motion } from "motion/react";

type Tag = "h1" | "h2" | "h3" | "p" | "span";

export default function WordReveal({
  children,
  as: Tag = "span",
  className,
  delay = 0,
}: {
  children: string;
  as?: Tag;
  className?: string;
  delay?: number;
}) {
  const words = children.split(" ");

  return (
    <Tag className={className} aria-label={children}>
      <motion.span
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={{
              hidden: { opacity: 0, filter: "blur(6px)", y: 8 },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: {
                  duration: 0.38,
                  delay: delay + i * 0.05,
                  ease: "easeOut",
                },
              },
            }}
            className="inline-block mr-[0.28em]"
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
