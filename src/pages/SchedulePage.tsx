import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTournament } from '../lib/tournamentApi';
import { MATCH_SCHEDULE } from '../lib/tournamentSchedule';
import type { TournamentState } from '../types/tournament';
import './SchedulePage.css';

export function SchedulePage() {
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTournament();
      setTournament(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leaderboard.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedule();
  }, []);

  useEffect(() => {
    document.title = `${t('schedule.title')} — Aevic Esports`;
  }, []);

  if (loading) {
    return (
      <div className="schedule-page">
        <div className="schedule-page__container">
          <h1 className="schedule-page__title">{t('schedule.title')}</h1>
          <p className="schedule-page__empty">{t('schedule.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-page">
        <div className="schedule-page__container">
          <h1 className="schedule-page__title">{t('schedule.title')}</h1>
          <p className="schedule-page__empty">{error}</p>
          <button type="button" className="schedule-page__refresh" onClick={() => void loadSchedule()}>
            {t('schedule.refresh')}
          </button>
        </div>
      </div>
    );
  }

  const schedule = tournament?.schedule || [];

  if (schedule.length === 0) {
    return (
      <div className="schedule-page">
        <div className="schedule-page__container">
          <h1 className="schedule-page__title">{t('schedule.title')}</h1>
          <p className="schedule-page__empty">{t('schedule.empty')}</p>
          <button type="button" className="schedule-page__refresh" onClick={() => void loadSchedule()}>
            {t('schedule.refresh')}
          </button>
        </div>
      </div>
    );
  }

  const activeDayIndex = tournament?.active_day_index ?? 1;

  return (
    <div className="schedule-page">
      <div className="schedule-page__container">
        <h1 className="schedule-page__title">{t('schedule.title')}</h1>
        <div className="schedule-page__meta">
          <div className="schedule-page__meta-item">
            <span>{t('schedule.week')}</span>
            <strong>{tournament?.week_label || 'Week 01'}</strong>
          </div>
          <div className="schedule-page__meta-item">
            <span>{t('schedule.league')}</span>
            <strong>{tournament?.league_title || 'AEVIC ESPORTS LEAGUE'}</strong>
          </div>
        </div>
        <div className="schedule-page__cards">
          {schedule.map((day) => {
            const isActive = day.day_index === activeDayIndex;
            const dayData = tournament?.days.find((d) => d.day_index === day.day_index);
            const publishedMatches = dayData?.matches?.filter((m) => m.standings_published).length || 0;
            const totalMatches = MATCH_SCHEDULE.length;

            return (
              <div
                key={day.day_index}
                className={`schedule-page__card${isActive ? ' is-active' : ''}`}
              >
                <div className="schedule-page__card-header">
                  <span className="schedule-page__day-label">{t('schedule.day')} {day.day_index}</span>
                  {isActive && <span className="schedule-page__active-badge">{t('schedule.active')}</span>}
                </div>
                <div className="schedule-page__card-date">
                  <span className="schedule-page__date">{day.date}</span>
                  <span className="schedule-page__time">{day.time}</span>
                </div>
                <div className="schedule-page__card-label">{day.label}</div>
                <div className="schedule-page__card-status">
                  <span>{t('schedule.results')}: {publishedMatches}/{totalMatches}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="schedule-page__refresh" onClick={() => void loadSchedule()}>
          {t('schedule.refresh')}
        </button>
      </div>
    </div>
  );
}
