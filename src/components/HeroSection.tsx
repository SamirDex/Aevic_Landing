import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { fetchTournament } from '../lib/tournamentApi';
import {
  createDefaultTournamentState,
  normalizeTournamentState,
} from '../lib/tournamentSchedule';
import type {
  TournamentDaySchedule,
  TournamentState,
} from '../types/tournament';
import { useScrollProgress } from '../hooks/useScrollProgress';
import { CRYSTAL_ASSETS, MAP_ASSETS } from './journeyAssets';
import { MapJourney } from './MapJourney';
import { stageProgress } from './mapJourneyTimeline';
import { ResponsiveJourneyImage } from './ResponsiveJourneyImage';

type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

const zeroCountdown: CountdownParts = {
  days: '00',
  hours: '00',
  minutes: '00',
  seconds: '00',
};

const padCountdown = (value: number) => String(value).padStart(2, '0');

const parseScheduleDate = (item: TournamentDaySchedule) => {
  if (!item.date) return null;

  const time = item.time?.trim() || '00:00';
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const parsed = new Date(`${item.date}T${normalizedTime}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getNextEventDate = (tournament: TournamentState) => {
  const now = Date.now();
  const events = (tournament.schedule ?? [])
    .map((item) => ({ date: parseScheduleDate(item) }))
    .filter((event): event is { date: Date } => Boolean(event.date))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return events.find((event) => event.date.getTime() > now)?.date ?? null;
};

const getCountdownParts = (target: Date | null): CountdownParts => {
  if (!target) return zeroCountdown;

  const remaining = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);

  return {
    days: padCountdown(Math.floor(seconds / 86400)),
    hours: padCountdown(Math.floor((seconds % 86400) / 3600)),
    minutes: padCountdown(Math.floor((seconds % 3600) / 60)),
    seconds: padCountdown(seconds % 60),
  };
};

function HeroIntroScene({ opacity = 1 }: { opacity?: number }) {
  return (
    <motion.div
      className="hero__visual hero__visual--journey-intro"
      aria-hidden="true"
      initial={false}
      style={{
        opacity,
        transform: `translate3d(${(1 - opacity) * 3.5}%, 0, 0) scale(${1 - (1 - opacity) * 0.025})`,
      }}
    >
      <div className="hero-network-stage hero-network-stage--intro">
        <svg
          className="hero-intro-network"
          viewBox="0 0 900 650"
          fill="none"
        >
          <path d="M450 318 L450 122" />
          <path d="M430 338 L228 470" />
          <path d="M470 338 L686 470" />
          <circle cx="450" cy="325" r="8" />
          <circle cx="450" cy="112" r="4" />
          <circle cx="218" cy="478" r="4" />
          <circle cx="698" cy="478" r="4" />
        </svg>

        <div className="hero-map-layer hero-map-layer--intro">
          <span className="hero-map hero-map--erangel">
            <ResponsiveJourneyImage
              asset={MAP_ASSETS.erangel}
              alt=""
              className="hero-map__image"
              draggable={false}
            />
          </span>
          <span className="hero-map hero-map--miramar">
            <ResponsiveJourneyImage
              asset={MAP_ASSETS.miramar}
              alt=""
              className="hero-map__image"
              draggable={false}
            />
          </span>
          <span className="hero-map hero-map--rondo">
            <ResponsiveJourneyImage
              asset={MAP_ASSETS.rondo}
              alt=""
              className="hero-map__image"
              draggable={false}
            />
          </span>
        </div>

        <div className="hero-crystal-layer hero-crystal-layer--intro">
          <ResponsiveJourneyImage
            asset={CRYSTAL_ASSETS.main}
            alt=""
            className="hero-crystal hero-crystal--core hero-intro-crystal--core"
          />
          <ResponsiveJourneyImage
            asset={CRYSTAL_ASSETS.medium}
            alt=""
            className="hero-crystal hero-crystal--medium hero-intro-crystal--north-west"
          />
          <ResponsiveJourneyImage
            asset={CRYSTAL_ASSETS.medium}
            alt=""
            className="hero-crystal hero-crystal--medium hero-intro-crystal--south-east"
          />
          <ResponsiveJourneyImage
            asset={CRYSTAL_ASSETS.small}
            alt=""
            className="hero-crystal hero-crystal--small hero-intro-crystal--north-east"
          />
          <ResponsiveJourneyImage
            asset={CRYSTAL_ASSETS.small}
            alt=""
            className="hero-crystal hero-crystal--small hero-intro-crystal--south-west"
          />
          <ResponsiveJourneyImage
            asset={CRYSTAL_ASSETS.small}
            alt=""
            className="hero-crystal hero-crystal--small hero-intro-crystal--east"
          />
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(heroRef);
  const reducedMotion = useReducedMotion();
  const [tournament, setTournament] = useState<TournamentState>(() =>
    normalizeTournamentState(createDefaultTournamentState()),
  );
  const nextEventDate = useMemo(
    () => getNextEventDate(tournament),
    [tournament],
  );
  const [countdown, setCountdown] = useState<CountdownParts>(() =>
    getCountdownParts(nextEventDate),
  );

  useEffect(() => {
    let mounted = true;

    fetchTournament()
      .then((data) => {
        if (mounted) {
          setTournament(normalizeTournamentState(data));
        }
      })
      .catch(() => {
        if (mounted) {
          setTournament(
            normalizeTournamentState(createDefaultTournamentState()),
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setCountdown(getCountdownParts(nextEventDate));

    if (!nextEventDate) return undefined;

    const intervalId = window.setInterval(() => {
      setCountdown(getCountdownParts(nextEventDate));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [nextEventDate]);

  const countdownSegments = useMemo(
    () => [
      { value: countdown.days, label: t('hero.countdown.days') },
      { value: countdown.hours, label: t('hero.countdown.hours') },
      { value: countdown.minutes, label: t('hero.countdown.minutes') },
      { value: countdown.seconds, label: t('hero.countdown.seconds') },
    ],
    [countdown, t],
  );

  const renderedProgress = progress;
  const introExitProgress = stageProgress(0.005, 0.04, renderedProgress);
  const introVisualExitProgress = stageProgress(0.004, 0.022, renderedProgress);
  const introOpacity = reducedMotion ? 1 : 1 - introExitProgress;
  const introVisualOpacity = reducedMotion ? 1 : 1 - introVisualExitProgress;

  return (
    <section
      ref={heroRef}
      className="hero hero--map-journey"
      id="hero"
    >
      <MapJourney
        progress={renderedProgress}
        countdown={countdownSegments}
        countdownPending={!nextEventDate}
      />

      <motion.div
        className="hero__container hero__container--journey"
        initial={false}
        style={{
          opacity: introOpacity,
          transform: reducedMotion
            ? 'none'
            : `translate3d(0, ${introExitProgress * -24}px, 0)`,
          pointerEvents: introOpacity > 0.5 ? 'auto' : 'none',
        }}
        aria-hidden={introOpacity < 0.05}
      >
        <div className="hero__copy hero__copy--journey">
          <span className="section-kicker">{t('hero.kicker')}</span>
          <h1>{t('hero.headline')}</h1>
          <p className="hero__subtitle">{t('hero.lede')}</p>

          <div
            className="hero__countdown"
            aria-label={t('hero.countdownLabel')}
          >
            <span className="hero__countdown-label">
              {t('hero.countdownLabel')}
            </span>
            <div className="hero__countdown-grid">
              {countdownSegments.map((segment, index) => (
                <span className="hero__countdown-wrap" key={segment.label}>
                  <span className="hero__countdown-cell">
                    <strong>{segment.value}</strong>
                    <span>{segment.label}</span>
                  </span>
                  {index < countdownSegments.length - 1 ? (
                    <span
                      className="hero__countdown-separator"
                      aria-hidden="true"
                    >
                      :
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
            {!nextEventDate ? (
              <span className="hero__countdown-note">
                {t('hero.countdownPending')}
              </span>
            ) : null}
          </div>

          <div className="hero__actions">
            <div>
              <Link to="/qeydiyyat" className="button button--primary">
                {t('hero.registerButton')}
              </Link>
            </div>
            <div>
              <Link
                to="/liderlik"
                className="button button--hero-secondary"
              >
                {t('hero.standingsButton')}
              </Link>
            </div>
          </div>
        </div>

        <HeroIntroScene opacity={introVisualOpacity} />
      </motion.div>
    </section>
  );
}
