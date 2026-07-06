import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CountdownTimer } from '../components/CountdownTimer';
import './HomePage.css';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      {/* Hero Section - Phoenix Motif */}
      <section className="home-hero">
        <motion.div 
          className="home-hero__phoenix"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 400 400" className="home-hero__phoenix-svg">
            <defs>
              <linearGradient id="phoenixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F3C450" />
                <stop offset="100%" stopColor="#6A1B9A" />
              </linearGradient>
            </defs>
            {/* Phoenix silhouette - line art style */}
            <path
              d="M200 50 C180 60, 160 80, 150 100 C140 120, 130 140, 120 160 C110 180, 100 200, 90 220 C80 240, 70 260, 60 280 C50 300, 40 320, 30 340 C40 330, 50 320, 60 310 C70 300, 80 290, 90 280 C100 270, 110 260, 120 250 C130 240, 140 230, 150 220 C160 200, 170 180, 180 160 C190 140, 195 120, 200 100 C205 120, 210 140, 220 160 C230 180, 240 200, 250 220 C260 240, 270 260, 280 250 C290 240, 300 230, 310 220 C320 210, 330 200, 340 190 C330 200, 320 210, 310 220 C300 230, 290 240, 280 250 C270 260, 260 270, 250 280 C240 290, 230 300, 220 310 C210 320, 200 330, 190 340 C180 320, 170 300, 160 280 C150 260, 140 240, 130 220 C120 200, 110 180, 100 160 C90 140, 80 120, 70 100 C80 80, 100 60, 120 50 C140 40, 170 35, 200 50"
              fill="none"
              stroke="url(#phoenixGradient)"
              strokeWidth="2"
              opacity="0.6"
            />
            {/* Wing details */}
            <path
              d="M120 150 C100 140, 80 130, 60 120 C80 125, 100 135, 120 145"
              fill="none"
              stroke="url(#phoenixGradient)"
              strokeWidth="1.5"
              opacity="0.4"
            />
            <path
              d="M280 150 C300 140, 320 130, 340 120 C320 125, 300 135, 280 145"
              fill="none"
              stroke="url(#phoenixGradient)"
              strokeWidth="1.5"
              opacity="0.4"
            />
          </svg>
        </motion.div>

        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="home-hero__particle"
            initial={{ 
              x: 200 + Math.cos(i * 45 * Math.PI / 180) * 100,
              y: 200 + Math.sin(i * 45 * Math.PI / 180) * 100,
              opacity: 0
            }}
            animate={{
              x: 200 + Math.cos(i * 45 * Math.PI / 180) * (120 + Math.sin(Date.now() / 1000 + i) * 20),
              y: 200 + Math.sin(i * 45 * Math.PI / 180) * (120 + Math.cos(Date.now() / 1000 + i) * 20),
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}

        <motion.div
          className="home-hero__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="home-hero__title">AEVIC ESPORTS</h1>
          <p className="home-hero__subtitle">PUBG MOBILE TURNIRLERI</p>
          <div className="home-hero__actions">
            <Link to="/register" className="button button--cta">
              Qeydiyyata Keç
            </Link>
            <Link to="/leaderboard" className="button button--outline">
              Liderliyə Bax
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="home-hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <span>Scroll</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* Countdown Strip */}
      <section className="home-countdown-strip">
        <CountdownTimer />
      </section>

      {/* How It Works - 4 Steps */}
      <section className="home-how-it-works">
        <motion.div
          className="home-how-it-works__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">Necə İşləyir?</h2>
          <div className="home-steps">
            {[
              { step: 1, icon: '📝', title: 'Qeydiyyat', desc: 'Komanda məlumatlarını daxil et' },
              { step: 2, icon: '✅', title: 'Təsdiq', desc: 'Admin təsdiqi gözlə' },
              { step: 3, icon: '🔑', title: 'Room Kodu', desc: 'Otaq kodu al' },
              { step: 4, icon: '🎮', title: 'Oyna', desc: 'Turnirə qatıl' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="home-step"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="home-step__icon">{item.icon}</div>
                <div className="home-step__number">{item.step}</div>
                <h3 className="home-step__title">{item.title}</h3>
                <p className="home-step__desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Leaderboard Preview */}
      <section className="home-leaderboard-preview">
        <motion.div
          className="home-leaderboard-preview__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">Liderlik</h2>
          <div className="home-leaderboard-preview__cards">
            {[1, 2, 3].map((rank) => (
              <div key={rank} className="home-leaderboard-preview__card">
                <div className="home-leaderboard-preview__rank">{rank}</div>
                <div className="home-leaderboard-preview__team">Komanda {rank}</div>
                <div className="home-leaderboard-preview__points">{1000 - rank * 50} xal</div>
              </div>
            ))}
          </div>
          <Link to="/leaderboard" className="button button--outline">
            Tam Liderliyə Bax →
          </Link>
        </motion.div>
      </section>

      {/* Registered Teams Grid */}
      <section className="home-teams-grid">
        <motion.div
          className="home-teams-grid__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">Qeydiyyatdan Keçmiş Komandalar</h2>
          <div className="home-teams-grid__logos">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="home-teams-grid__logo"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                whileHover={{ scale: 1.1 }}
              >
                <div className="home-teams-grid__logo-placeholder">K{i + 1}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
