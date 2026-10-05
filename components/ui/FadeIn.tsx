"use client";

import { motion, useInView } from "framer-motion";
import { CSSProperties, useRef } from "react";

const EASE = [0.25, 0.1, 0.25, 1] as const;

type FadeInProps = {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  duration?: number;
  once?: boolean;
};

export function FadeIn({
  children,
  className,
  style,
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
}: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-40px" });

  const offsets: Record<string, { x?: number; y?: number }> = {
    up:    { y: 22 },
    down:  { y: -22 },
    left:  { x: 22 },
    right: { x: -22 },
    none:  {},
  };

  const offset = offsets[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

type StaggerContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
  staggerDelay?: number;
};

export function StaggerContainer({
  children,
  className,
  style,
  staggerDelay = 0.08,
}: StaggerContainerProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: { transition: { staggerChildren: staggerDelay } },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
