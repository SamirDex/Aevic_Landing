import { useTranslation } from 'react-i18next';
import { fetchTournament } from '../lib/tournamentApi';
import { listTeams } from '../lib/teamAuth';
import type { TournamentState } from '../types/tournament';
import type { TeamRecord } from '../context/AuthContext';
import { useEffect, useState } from 'react';

export function CapacityProgress() {
  const { t } = useTranslation();
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tournData, teams] = await Promise.all([fetchTournament(), listTeams()]);
        setTournament(tournData);
        const approvedCount = teams.filter((team: TeamRecord) => team.status === 'approved').length;
        setTeamCount(approvedCount);
      } catch {
        // Silent fail
      }
    };
    void loadData();
  }, []);

  const maxTeams = tournament?.max_teams ?? 64;
  const percentage = Math.min((teamCount / maxTeams) * 100, 100);
  const remaining = maxTeams - teamCount;

  return (
    <div className="capacity-progress">
      <div className="capacity-progress__header">
        <span className="capacity-progress__label">
          {t('hero.capacityLabel')}
        </span>
        <span className="capacity-progress__count">
          {teamCount} / {maxTeams}
        </span>
      </div>
      <div className="capacity-progress__bar">
        <div
          className="capacity-progress__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="capacity-progress__remaining">
        {t('hero.capacityRemaining', { count: remaining })}
      </span>
    </div>
  );
}
