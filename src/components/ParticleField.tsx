const particles = [
  { top: '8%', left: '12%', size: '0.5rem', delay: '0s', duration: '16s' },
  { top: '16%', left: '74%', size: '0.3rem', delay: '1.2s', duration: '18s' },
  { top: '25%', left: '90%', size: '0.4rem', delay: '0.8s', duration: '22s' },
  { top: '33%', left: '5%', size: '0.45rem', delay: '2.2s', duration: '17s' },
  { top: '40%', left: '62%', size: '0.25rem', delay: '0.4s', duration: '15s' },
  { top: '52%', left: '28%', size: '0.55rem', delay: '1.8s', duration: '20s' },
  { top: '65%', left: '81%', size: '0.35rem', delay: '0.6s', duration: '19s' },
  { top: '72%', left: '18%', size: '0.4rem', delay: '1.6s', duration: '24s' },
  { top: '84%', left: '54%', size: '0.3rem', delay: '2.8s', duration: '21s' },
  { top: '90%', left: '92%', size: '0.45rem', delay: '1s', duration: '18s' },
  { top: '14%', left: '46%', size: '0.25rem', delay: '0.2s', duration: '14s' },
  { top: '58%', left: '49%', size: '0.5rem', delay: '2.4s', duration: '23s' },
];

export function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          key={`${particle.top}-${particle.left}`}
          className={`particle-field__dot particle-field__dot--${index % 3}`}
          style={{
            top: particle.top,
            left: particle.left,
            width: particle.size,
            height: particle.size,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}
    </div>
  );
}

