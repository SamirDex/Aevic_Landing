import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CountdownTimer } from '../components/CountdownTimer';
import './HomePage.css';

export default function HomePage() {
  const { t } = useTranslation();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.5 }
  };

  return (
    <div className="home-page">
      {/* Hero Section - Phoenix Motif */}
      <section className="home-hero">
        <div className="home-hero__background" />
        
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
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {/* Phoenix silhouette - refined line art */}
            <g filter="url(#glow)">
              <path
                d="M200 50 C180 60, 160 80, 150 100 C140 120, 130 140, 120 160 C110 180, 100 200, 90 220 C80 240, 70 260, 60 280 C50 300, 40 320, 30 340 C40 330, 50 320, 60 310 C70 300, 80 290, 90 280 C100 270, 110 260, 120 250 C130 240, 140 230, 150 220 C160 200, 170 180, 180 160 C190 140, 195 120, 200 100 C205 120, 210 140, 220 160 C230 180, 240 200, 250 220 C260 240, 270 260, 280 250 C290 240, 300 230, 310 220 C320 210, 330 200, 340 190 C330 200, 320 210, 310 220 C300 230, 290 240, 280 250 C270 260, 260 270, 250 280 C240 290, 230 300, 220 310 C210 320, 200 330, 190 340 C180 320, 170 300, 160 280 C150 260, 140 240, 130 220 C120 200, 110 180, 100 160 C90 140, 80 120, 70 100 C80 80, 100 60, 120 50 C140 40, 170 35, 200 50"
                fill="none"
                stroke="url(#phoenixGradient)"
                strokeWidth="2"
                opacity="0.7"
              />
              {/* Wing details */}
              <path
                d="M120 150 C100 140, 80 130, 60 120 C80 125, 100 135, 120 145"
                fill="none"
                stroke="url(#phoenixGradient)"
                strokeWidth="1.5"
                opacity="0.5"
              />
              <path
                d="M280 150 C300 140, 320 130, 340 120 C320 125, 300 135, 280 145"
                fill="none"
                stroke="url(#phoenixGradient)"
                strokeWidth="1.5"
                opacity="0.5"
              />
            </g>
          </svg>
        </motion.div>

        {/* Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="home-hero__particle"
            initial={{ 
              x: 200 + Math.cos(i * 60 * Math.PI / 180) * 120,
              y: 200 + Math.sin(i * 60 * Math.PI / 180) * 120,
              opacity: 0
            }}
            animate={{
              x: 200 + Math.cos(i * 60 * Math.PI / 180) * (140 + Math.sin(Date.now() / 1000 + i) * 20),
              y: 200 + Math.sin(i * 60 * Math.PI / 180) * (140 + Math.cos(Date.now() / 1000 + i) * 20),
              opacity: [0, 0.5, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}

        <motion.div
          className="home-hero__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.p 
            className="home-hero__kicker"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span className="home-hero__kicker-accent">►</span> Ədalətli Rəqabət Platforması
          </motion.p>
          
          <h1 className="home-hero__title">
            <span className="home-hero__title-word">AEVIC</span>
            <span className="home-hero__title-word home-hero__title-accent">ESPORTS</span>
          </h1>
          
          <p className="home-hero__description">
            PUBG Mobile&apos;ın ən böyük turnir platforması. Dəstəyi ilə xüsusi komanda tapın, ədalətli şəkildə oynayın və böyük mükafatlar qazanın.
          </p>
          
          <div className="home-hero__actions">
            <Link to="/qeydiyyat" className="button button--cta">
              ⚡ Qeydiyyata Keç
            </Link>
            <Link to="/liderlik" className="button button--outline">
              👑 Liderliyə Bax
            </Link>
          </div>
        </motion.div>

        {/* Upcoming Tournament Card */}
        <motion.div 
          className="home-hero__tournament-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="home-hero__tournament-label">Novbəti Turnir</div>
          <CountdownTimer />
          <div className="home-hero__tournament-info">
            <span className="home-hero__tournament-meta">🏆 8 Komanda</span>
            <span className="home-hero__tournament-meta">👥 32 Oyunçu</span>
          </div>
        </motion.div>

        <motion.div 
          className="home-hero__scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <span>Aşağı Sürü</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="home-stats-bar">
        <motion.div
          className="home-stats-bar__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {[
            { label: 'Komanda', value: '128+', icon: '👥' },
            { label: 'Oyunçu', value: '512+', icon: '🎮' },
            { label: 'Turnir', value: '24+', icon: '🏆' },
            { label: 'Toplam Mükafat', value: '50K₼', icon: '💰' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="home-stats-bar__stat"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <div className="home-stats-bar__icon">{stat.icon}</div>
              <div className="home-stats-bar__value">{stat.value}</div>
              <div className="home-stats-bar__label">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured Tournaments */}
      <section className="home-featured-tournaments">
        <motion.div
          className="home-featured-tournaments__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">Xüsusi Turnirləri</h2>
          <div className="home-featured-tournaments__grid">
            {[
              { name: 'Mega Turnir', map: 'Miramar', date: '15 Həm', teams: 16, prize: '25K₼', status: 'REGISTRATION OPEN' },
              { name: 'Klassik Turnir', map: 'Erangel', date: '22 Həm', teams: 12, prize: '15K₼', status: 'SOON' },
              { name: 'Pro Liqası', map: 'Taego', date: '29 Həm', teams: 20, prize: '30K₼', status: 'SOON' }
            ].map((tournament, i) => (
              <motion.div
                key={i}
                className="home-featured-tournaments__card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="home-featured-tournaments__status">{tournament.status}</div>
                <h3 className="home-featured-tournaments__name">{tournament.name}</h3>
                <div className="home-featured-tournaments__map">🗺️ {tournament.map}</div>
                <div className="home-featured-tournaments__meta">
                  <span>📅 {tournament.date}</span>
                  <span>👥 {tournament.teams}</span>
                </div>
                <div className="home-featured-tournaments__prize">💰 {tournament.prize}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why AEVIC Section */}
      <section className="home-why-aevic">
        <motion.div
          className="home-why-aevic__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">Niyə AEVIC?</h2>
          <div className="home-why-aevic__grid">
            {[
              { title: 'ƏDALƏTLƏ RƏQABƏT', desc: 'Anti-cheat sistem ilə tamamilə ədalətli oyun mühiti', icon: '⚖️' },
              { title: 'ŞƏFFAF QEYDIYYAT', desc: 'Bütün proseslər açıq və şəffafdır', icon: '👁️' },
              { title: 'AKTİV DƏSTƏK', desc: '24/7 canlı dəstək komandası həmişə hazır', icon: '🎧' },
              { title: 'REAL MÜKAFATLAR', desc: 'Hər turnirdə real pul mükafatları', icon: '🏆' }
            ].map((item, i) => (
              <motion.div
                key={i}
                className="home-why-aevic__card"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="home-why-aevic__icon">{item.icon}</div>
                <h3 className="home-why-aevic__title">{item.title}</h3>
                <p className="home-why-aevic__desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
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
                {index > 0 && <div className="home-step__arrow">→</div>}
                <div className="home-step__icon">{item.icon}</div>
                <div className="home-step__number">{item.step}</div>
                <h3 className="home-step__title">{item.title}</h3>
                <p className="home-step__desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Three Column Section - Matches, Leaderboard, CTA */}
      <section className="home-three-column">
        <motion.div
          className="home-three-column__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Upcoming Matches */}
          <div className="home-three-column__column">
            <h3 className="home-three-column__title">Novbəti Matçlar</h3>
            <div className="home-three-column__list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="home-three-column__item">
                  <span className="home-three-column__team">Komanda {i}</span>
                  <span className="home-three-column__time">20:00</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Preview */}
          <div className="home-three-column__column">
            <h3 className="home-three-column__title">Liderlik</h3>
            <div className="home-three-column__leaderboard">
              {[1, 2, 3, 4, 5].map((rank) => (
                <div key={rank} className="home-three-column__row">
                  <span className="home-three-column__rank">#{rank}</span>
                  <span className="home-three-column__team-name">Komanda {rank}</span>
                  <span className="home-three-column__points">{1000 - rank * 50}p</span>
                </div>
              ))}
            </div>
          </div>

          {/* Join Us CTA */}
          <div className="home-three-column__column home-three-column__cta-column">
            <div className="home-three-column__cta-card">
              <div className="home-three-column__cta-icon">🚀</div>
              <h3 className="home-three-column__cta-title">Bizə Qoşul</h3>
              <p className="home-three-column__cta-desc">Ən yaxşı oyunçular ilə komanda yarat və turnirlərə qatıl</p>
              <Link to="/qeydiyyat" className="button button--cta button--full">
                Hazırlaş
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Follow Us Section */}
      <section className="home-follow-us">
        <motion.div
          className="home-follow-us__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">Bizi İzləyin</h2>
          <div className="home-follow-us__icons">
            {[
              { icon: '📱', label: 'Instagram', handle: '@aevic_esports' },
              { icon: '🎵', label: 'TikTok', handle: '@aevicesports' },
              { icon: '💬', label: 'Discord', handle: 'discord.gg/aevic' }
            ].map((social, i) => (
              <motion.a
                key={i}
                href="#"
                className="home-follow-us__link"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <span className="home-follow-us__icon">{social.icon}</span>
                <span className="home-follow-us__handle">{social.handle}</span>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
