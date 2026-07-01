import { motion, useReducedMotion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

type SectionRevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
}>;

export function SectionReveal({ children, className, delay = 0 }: SectionRevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 36 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

