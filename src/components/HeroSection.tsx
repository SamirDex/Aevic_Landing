import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { CountdownTimer } from './CountdownTimer';
import { CapacityProgress } from './CapacityProgress';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="hero hero--simple" id="hero">
      <div className="hero__container">
        <div className="hero__content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="section-kicker">{t('hero.kicker')}</span>
            <h1>{t('hero.headline')}</h1>
            <p className="hero__subtitle">{t('hero.lede')}</p>

            <CountdownTimer />

            <CapacityProgress />

            <div className="hero__actions">
              <Link to="/qeydiyyat" className="button button--primary">
                {t('hero.registerButton')}
              </Link>
              <Link to="/liderlik" className="button button--secondary">
                {t('hero.standingsButton')}
              </Link>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          aria-hidden="true"
        >
          <img
            src="/assets/maps/erangel.png"
            alt=""
            className="hero__background-image"
          />
        </motion.div>
      </div>
    </section>
  );
}
