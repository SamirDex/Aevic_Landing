import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CountdownTimer } from '../components/CountdownTimer';
import './HomePage.css';

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero__container">
          <motion.div
            className="home-hero__content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="home-hero__title">
              <span className="home-hero__title-gold">AEVIC</span>
              <span className="home-hero__title-purple">ESP</span>
            </h1>
            <p className="home-hero__subtitle">
              {t('home.heroSubtitle')}
            </p>
            <div className="home-hero__actions">
              <Link to="/register" className="button button--primary button--large">
                {t('home.register')}
              </Link>
              <Link to="/leaderboard" className="button button--ghost button--large">
                {t('home.viewLeaderboard')}
              </Link>
            </div>
          </motion.div>
          
          <motion.div
            className="home-hero__visual"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <div className="home-hero__crystal" />
          </motion.div>
        </div>
      </section>

      {/* Countdown Section */}
      <section className="home-countdown">
        <motion.div
          className="home-countdown__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-countdown__title">{t('home.nextTournament')}</h2>
          <CountdownTimer />
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="home-how-it-works">
        <motion.div
          className="home-how-it-works__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">{t('home.howItWorks')}</h2>
          <div className="home-steps">
            {[
              { step: 1, icon: '📝', title: t('home.step1Title'), desc: t('home.step1Desc') },
              { step: 2, icon: '✅', title: t('home.step2Title'), desc: t('home.step2Desc') },
              { step: 3, icon: '🔑', title: t('home.step3Title'), desc: t('home.step3Desc') },
              { step: 4, icon: '🎮', title: t('home.step4Title'), desc: t('home.step4Desc') },
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

      {/* Leaderboard Preview Section */}
      <section className="home-leaderboard">
        <motion.div
          className="home-leaderboard__container"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="home-section__title">{t('home.leaderboardPreview')}</h2>
          <p className="home-leaderboard__subtitle">{t('home.leaderboardDesc')}</p>
          <Link to="/leaderboard" className="button button--primary">
            {t('home.viewFullLeaderboard')}
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
