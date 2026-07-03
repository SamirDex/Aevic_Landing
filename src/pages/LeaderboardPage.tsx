import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchTournament } from '../lib/tournamentApi';
import { TeamShowcase } from '../components/TeamShowcase';
import type { StandingsRow, TournamentState } from '../types/tournament';
import './LeaderboardPage.css';

type LeaderboardTeam = {
  rank: number;
  team_name: string;
  logo_url: string;
  chicken_dinners: number;
  placement_points: number;
  finish_points: number;
  total_points: number;
};

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<LeaderboardTeam[]>([]);
  const [publicTeams, setPublicTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [teamsRes, tournamentRes] = await Promise.all([
        fetch('/api/teams/public'),
        fetch('/api/tournament'),
      ]);

      if (!teamsRes.ok || !tournamentRes.ok) {
        throw new Error(t('leaderboard.error'));
      }

      const teamsData = await teamsRes.json();
      const tournamentData: TournamentState = await tournamentRes.json();

      const teamStats = new Map<string, LeaderboardTeam>();

      teamsData.forEach((team: { id: string; team_name: string; logo_url: string; captain_name: string; player1_ign: string; player2_ign: string; player3_ign: string; player4_ign: string; player5_ign: string | null; status: string }) => {
        teamStats.set(team.id, {
          rank: 0,
          team_name: team.team_name,
          logo_url: team.logo_url || '',
          chicken_dinners: 0,
          placement_points: 0,
          finish_points: 0,
          total_points: 0,
        });
      });

      tournamentData.days?.forEach((day) => {
        day.matches?.forEach((match) => {
          if (match.standings_published?.rows) {
            match.standings_published.rows.forEach((row: StandingsRow) => {
              if (row.team_id && teamStats.has(row.team_id)) {
                const team = teamStats.get(row.team_id)!;
                team.chicken_dinners += row.chicken_dinners || 0;
                team.placement_points += row.placement_points || 0;
                team.finish_points += row.finish_points || 0;
                team.total_points += row.total_points || 0;
              }
            });
          }
        });
      });

      const sortedTeams = Array.from(teamStats.values())
        .map((team) => ({ ...team, total_points: team.total_points }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((team, index) => ({ ...team, rank: index + 1 }));

      setTeams(sortedTeams);
      setPublicTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leaderboard.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  useEffect(() => {
    document.title = `${t('leaderboard.title')} — Aevic Esports`;
  }, []);

  if (loading) {
    return (
      <div className="leaderboard">
        <div className="leaderboard__container">
          <h1 className="leaderboard__title">{t('leaderboard.title')}</h1>
          <p className="leaderboard__empty">{t('leaderboard.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <div className="leaderboard__container">
          <h1 className="leaderboard__title">{t('leaderboard.title')}</h1>
          <p className="leaderboard__empty">{error}</p>
          <button type="button" className="leaderboard__refresh" onClick={() => void loadLeaderboard()}>
            {t('leaderboard.refresh')}
          </button>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="leaderboard">
        <div className="leaderboard__container">
          <h1 className="leaderboard__title">{t('leaderboard.title')}</h1>
          <p className="leaderboard__empty">{t('leaderboard.empty')}</p>
          <button type="button" className="leaderboard__refresh" onClick={() => void loadLeaderboard()}>
            {t('leaderboard.refresh')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard__container">
        <h1 className="leaderboard__title">{t('leaderboard.title')}</h1>
        <button type="button" className="leaderboard__refresh" onClick={() => void loadLeaderboard()}>
          {t('leaderboard.refresh')}
        </button>
        
        <div className="leaderboard__showcase-section">
          <h2 className="leaderboard__section-title">Komandalar</h2>
          <TeamShowcase teams={publicTeams.map((team) => ({
            id: team.id,
            team_name: team.team_name,
            captain_name: team.captain_name,
            captain_contact: '',
            email: '',
            logo_url: team.logo_url,
            player1_ign: team.player1_ign,
            player2_ign: team.player2_ign,
            player3_ign: team.player3_ign,
            player4_ign: team.player4_ign,
            player5_ign: team.player5_ign,
            status: team.status,
          }))} readonly />
        </div>

        <div className="leaderboard__table-wrapper">
          <table className="leaderboard__table">
            <thead>
              <tr>
                <th>{t('leaderboard.rank')}</th>
                <th>{t('leaderboard.team')}</th>
                <th>{t('leaderboard.cd')}</th>
                <th>{t('leaderboard.pp')}</th>
                <th>{t('leaderboard.fp')}</th>
                <th>{t('leaderboard.tp')}</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr
                  key={team.team_name}
                  className={`leaderboard__row${
                    team.rank === 1 ? '--gold' : team.rank === 2 ? '--silver' : team.rank === 3 ? '--bronze' : ''
                  }`}
                >
                  <td>
                    {team.rank === 1 && '🥇'}
                    {team.rank === 2 && '🥈'}
                    {team.rank === 3 && '🥉'}
                    {team.rank > 3 && team.rank}
                  </td>
                  <td>
                    <div className="leaderboard__team">
                      {team.logo_url && <img src={team.logo_url} alt="" className="leaderboard__logo" />}
                      <span>{team.team_name}</span>
                    </div>
                  </td>
                  <td>{team.chicken_dinners}</td>
                  <td>{team.placement_points}</td>
                  <td>{team.finish_points}</td>
                  <td className="leaderboard__total">{team.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
