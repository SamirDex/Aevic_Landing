import { useState } from 'react';
import './TournamentCalendar.css';
import type { TournamentDaySchedule } from '../types/tournament';

type Props = {
  schedule: TournamentDaySchedule[];
  teamId?: string | number | null;
  confirmations?: Record<string, string[]>;
  onConfirm?: (dayIndex: number, confirmed: boolean) => Promise<void>;
  readonly?: boolean;
};

export function TournamentCalendar({ schedule, teamId, confirmations = {}, onConfirm, readonly }: Props) {
  const [loading, setLoading] = useState<number | null>(null);

  if (!schedule || schedule.length === 0) {
    return (
      <div className="tcal tcal--empty">
        <span>Turnir tarixi hələ açıqlanmayıb.</span>
      </div>
    );
  }

  const myDays = teamId ? (confirmations[String(teamId)] ?? []) : [];
  const now = new Date();

  const handleToggle = async (dayIndex: number) => {
    if (!onConfirm || readonly) return;
    const confirmed = myDays.includes(String(dayIndex));
    setLoading(dayIndex);
    try {
      await onConfirm(dayIndex, !confirmed);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="tcal">
      {schedule.map((day) => {
        const dayDate = new Date(`${day.date}T${day.time}:00`);
        const isPast = dayDate < now;
        const isCancelled = day.status === 'cancelled';
        const isCompleted = day.status === 'completed';
        const diffMs = dayDate.getTime() - now.getTime();
        const diffH = Math.floor(diffMs / 3600000);
        const diffD = Math.floor(diffH / 24);
        const countdown =
          isCancelled
            ? '❌ Ləğv edildi'
            : isCompleted
            ? '✅ Bitdi'
            : diffMs <= 0
            ? '🔴 Başladı'
            : diffD > 0
            ? `${diffD} gün qaldı`
            : diffH > 0
            ? `${diffH} saat qaldı`
            : '⚡ Az qaldı';

        const isConfirmed = myDays.includes(String(day.day_index));
        const confirmCount = Object.values(confirmations).filter((days) =>
          days.includes(String(day.day_index)),
        ).length;

        return (
          <div
            key={day.day_index}
            className={`tcal__day${isPast ? ' tcal__day--past' : ''}${isConfirmed ? ' tcal__day--confirmed' : ''}${isCancelled ? ' tcal__day--cancelled' : ''}${isCompleted ? ' tcal__day--completed' : ''}`}
          >
            <div className="tcal__head">
              <span className="tcal__label">{day.label}</span>
              <span className={`tcal__countdown${diffMs <= 0 ? ' tcal__countdown--live' : ''}${isCancelled ? ' tcal__countdown--cancelled' : ''}${isCompleted ? ' tcal__countdown--completed' : ''}`}>
                {countdown}
              </span>
            </div>
            <div className="tcal__date">
              {dayDate.toLocaleDateString('az-AZ', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              {' · '}
              {day.time}
            </div>
            {!readonly && teamId && (
              <button
                type="button"
                className={`tcal__btn${isConfirmed ? ' tcal__btn--on' : ''}`}
                onClick={() => handleToggle(day.day_index)}
                disabled={loading === day.day_index || isPast || isCancelled}
              >
                {loading === day.day_index
                  ? '...'
                  : isConfirmed
                  ? '✓ İştirak edəcəyəm'
                  : 'İştirak edəcəyəm'}
              </button>
            )}
            {readonly && (
              <div className="tcal__count">{confirmCount} komanda iştirak edəcək</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
