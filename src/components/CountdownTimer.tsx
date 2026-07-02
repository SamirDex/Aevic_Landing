import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTournament } from '../lib/tournamentApi';
import {
  createDefaultTournamentState,
  normalizeTournamentState,
} from '../lib/tournamentSchedule';
import type {
  TournamentDaySchedule,
  TournamentState,
} from '../types/tournament';

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

export function CountdownTimer() {
  const { t } = useTranslation();
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

  return (
    <div className="hero__countdown" aria-label={t('hero.countdownLabel')}>
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
  );
}
