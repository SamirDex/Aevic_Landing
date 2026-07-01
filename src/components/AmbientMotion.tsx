import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export function AmbientMotion() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Subtle lighting shifts over time
  const lightIntensity = useSpring(useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.6, 0.4]), {
    stiffness: 50,
    damping: 20,
  });

  // Background gradient shift
  const gradientShift = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <section ref={containerRef} className="ambient-motion" aria-hidden="true">
      {/* Dynamic background gradient */}
      <motion.div
        className="ambient-gradient"
        style={{
          background: `linear-gradient(${gradientShift}deg, 
            rgba(106, 27, 154, ${useTransform(lightIntensity, (v: number) => v)}) 0%, 
            rgba(243, 196, 80, ${useTransform(lightIntensity, (v: number) => v * 0.5)}) 50%, 
            rgba(0, 206, 209, ${useTransform(lightIntensity, (v: number) => v * 0.3)}) 100%)`,
        }}
      />

      {/* Floating crystal fragments */}
      {[...Array(8)].map((_, i) => {
        const index = i as number;
        return (
        <motion.div
          key={i}
          className="ambient-crystal"
          style={{
            left: `${10 + index * 12}%`,
            top: `${10 + (index % 3) * 30}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8 + index * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.5,
          }}
        />
        );
      })}

      {/* Ambient particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="ambient-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 10 + Math.random() * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 3,
          }}
        />
      ))}

      {/* Soft lighting layers */}
      <motion.div
        className="ambient-light-layer ambient-light-layer--1"
        style={{ opacity: useTransform(lightIntensity, (v) => v * 0.3) }}
      />
      <motion.div
        className="ambient-light-layer ambient-light-layer--2"
        style={{ opacity: useTransform(lightIntensity, (v) => v * 0.2) }}
      />
    </section>
  );
}
