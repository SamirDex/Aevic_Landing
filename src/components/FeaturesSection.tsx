import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

export function FeaturesSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Section activation based on scroll
  const sectionActivation = useSpring(useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 1]), {
    stiffness: 50,
    damping: 20,
  });

  const features = [
    {
      id: 'competitive',
      title: 'Competitive Gaming',
      description: 'Professional tournament structure with prize pools and recognition',
      icon: '🏆',
      color: '#F3C450',
    },
    {
      id: 'community',
      title: 'Community Driven',
      description: 'Built by gamers, for gamers with active participation',
      icon: '👥',
      color: '#9845DC',
    },
    {
      id: 'skill',
      title: 'Skill Based',
      description: 'Fair matchmaking based on actual performance and skill',
      icon: '⚡',
      color: '#00CED1',
    },
    {
      id: 'rewards',
      title: 'Exclusive Rewards',
      description: 'Unique prizes and recognition for top performers',
      icon: '💎',
      color: '#F3C450',
    },
  ];

  return (
    <section ref={sectionRef} className="features-section" id="features">
      <div className="section-frame">
        <motion.div
          className="features-header"
          style={{ opacity: sectionActivation }}
        >
          <span className="section-kicker">Features</span>
          <h2>Premium Esports Experience</h2>
          <p>Discover what makes Aevic the ultimate competitive gaming platform</p>
        </motion.div>

        <div className="features-grid">
          {features.map((feature, index) => {
            const featureActivation = useTransform(scrollYProgress, [0.2 + index * 0.1, 0.5 + index * 0.1], [0, 1]);
            
            return (
              <motion.div
                key={feature.id}
                className="feature-panel"
                style={{
                  opacity: featureActivation,
                  scale: useSpring(featureActivation, { stiffness: 50, damping: 20 }),
                  borderColor: feature.color,
                }}
                initial={{ y: 50, opacity: 0 }}
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <motion.div
                  className="feature-icon"
                  style={{ 
                    background: `linear-gradient(135deg, ${feature.color}40, ${feature.color}20)`,
                    color: feature.color,
                  }}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                >
                  {feature.icon}
                </motion.div>
                <h3 style={{ color: feature.color }}>{feature.title}</h3>
                <p>{feature.description}</p>
                <motion.div
                  className="feature-glow"
                  style={{ 
                    background: feature.color,
                    opacity: useTransform(featureActivation, (v) => v * 0.3),
                  }}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
