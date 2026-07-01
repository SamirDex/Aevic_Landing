import { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function GlobalEnergyNetwork() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Energy flow animation through the network
  const energyFlow = useTransform(scrollYProgress, [0, 0.2, 0.4, 0.6, 0.8, 1], [0, 0.2, 0.4, 0.6, 0.8, 1]);
  const networkOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0.3, 0.6, 0.6, 0.3]);

  return (
    <section ref={containerRef} className="global-energy-network" aria-hidden="true">
      <motion.svg
        className="energy-network-svg"
        viewBox="0 0 100 400"
        preserveAspectRatio="none"
        style={{ opacity: networkOpacity }}
      >
        <defs>
          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F3C450" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#9845DC" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#00CED1" stopOpacity="0.8" />
          </linearGradient>
          <filter id="energyGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Main vertical energy line connecting all sections */}
        <motion.path
          d="M 50 0 L 50 400"
          stroke="url(#energyGradient)"
          strokeWidth="0.3"
          fill="none"
          filter="url(#energyGlow)"
          style={{
            pathLength: 1,
            strokeDashoffset: useTransform(energyFlow, (p) => 1 - p),
          }}
          initial={{ pathLength: 0 }}
        />

        {/* Horizontal branches to sections */}
        {/* Hero branch */}
        <motion.path
          d="M 50 20 L 30 20"
          stroke="#F3C450"
          strokeWidth="0.2"
          fill="none"
          filter="url(#energyGlow)"
          style={{
            pathLength: 1,
            strokeDashoffset: useTransform(scrollYProgress, [0, 0.15], [1, 0]),
          }}
        />

        {/* Features branch */}
        <motion.path
          d="M 50 120 L 70 120"
          stroke="#9845DC"
          strokeWidth="0.2"
          fill="none"
          filter="url(#energyGlow)"
          style={{
            pathLength: 1,
            strokeDashoffset: useTransform(scrollYProgress, [0.2, 0.35], [1, 0]),
          }}
        />

        {/* Tournament branch */}
        <motion.path
          d="M 50 240 L 30 240"
          stroke="#00CED1"
          strokeWidth="0.2"
          fill="none"
          filter="url(#energyGlow)"
          style={{
            pathLength: 1,
            strokeDashoffset: useTransform(scrollYProgress, [0.4, 0.55], [1, 0]),
          }}
        />

        {/* Standings branch */}
        <motion.path
          d="M 50 360 L 70 360"
          stroke="#F3C450"
          strokeWidth="0.2"
          fill="none"
          filter="url(#energyGlow)"
          style={{
            pathLength: 1,
            strokeDashoffset: useTransform(scrollYProgress, [0.6, 0.75], [1, 0]),
          }}
        />

        {/* Energy particles flowing through the network */}
        {[0.2, 0.4, 0.6, 0.8].map((delay) => (
          <motion.circle
            key={delay}
            cx={50}
            cy={useTransform(energyFlow, (p) => p * 400)}
            r="0.8"
            fill="#F3C450"
            filter="url(#energyGlow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Junction nodes at section connections */}
        {[20, 120, 240, 360].map((y, index) => (
          <motion.circle
            key={y}
            cx={50}
            cy={y}
            r="1.2"
            fill={['#F3C450', '#9845DC', '#00CED1', '#F3C450'][index]}
            filter="url(#energyGlow)"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{
              duration: 0.8,
              delay: index * 0.15,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.svg>
    </section>
  );
}
