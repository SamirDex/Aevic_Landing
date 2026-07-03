import { useState } from 'react';
import type { TeamRecord } from '../context/AuthContext';
import './TeamShowcase.css';

type Props = {
  teams: TeamRecord[];
} & (
  | { readonly: true; onTeamClick?: never }
  | { readonly?: false; onTeamClick: (team: TeamRecord) => void }
);

export function TeamShowcase({ teams, readonly = false, onTeamClick }: Props) {
  const [hoveredTeam, setHoveredTeam] = useState<TeamRecord | null>(null);

  if (!teams || teams.length === 0) {
    return (
      <div className="team-showcase team-showcase--empty">
        <p>Komanda yoxdur.</p>
      </div>
    );
  }

  return (
    <div className="team-showcase">
      <div className="team-showcase__grid">
        {teams.map((team) => (
          <div
            key={team.id}
            className="team-showcase__card"
            onMouseEnter={() => setHoveredTeam(team)}
            onMouseLeave={() => setHoveredTeam(null)}
            onClick={() => !readonly && onTeamClick?.(team)}
          >
            <div className="team-showcase__card-inner">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.team_name} className="team-showcase__logo" />
              ) : (
                <div className="team-showcase__logo-placeholder">
                  {team.team_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="team-showcase__card-info">
                <h3 className="team-showcase__team-name">{team.team_name}</h3>
                <p className="team-showcase__captain">{team.captain_name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hoveredTeam && (
        <div
          className="team-showcase__tooltip"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="team-showcase__tooltip-header">
            {hoveredTeam.logo_url && (
              <img src={hoveredTeam.logo_url} alt="" className="team-showcase__tooltip-logo" />
            )}
            <div className="team-showcase__tooltip-title">
              <h3>{hoveredTeam.team_name}</h3>
              <p className="team-showcase__tooltip-captain">Kapitan: {hoveredTeam.captain_name}</p>
            </div>
          </div>
          <div className="team-showcase__tooltip-players">
            <div className="team-showcase__player">
              <span className="team-showcase__player-label">Oyunçu 1</span>
              <span className="team-showcase__player-ign">{hoveredTeam.player1_ign}</span>
            </div>
            <div className="team-showcase__player">
              <span className="team-showcase__player-label">Oyunçu 2</span>
              <span className="team-showcase__player-ign">{hoveredTeam.player2_ign}</span>
            </div>
            <div className="team-showcase__player">
              <span className="team-showcase__player-label">Oyunçu 3</span>
              <span className="team-showcase__player-ign">{hoveredTeam.player3_ign}</span>
            </div>
            <div className="team-showcase__player">
              <span className="team-showcase__player-label">Oyunçu 4</span>
              <span className="team-showcase__player-ign">{hoveredTeam.player4_ign}</span>
            </div>
            {hoveredTeam.player5_ign && (
              <div className="team-showcase__player">
                <span className="team-showcase__player-label">Ehtiyat</span>
                <span className="team-showcase__player-ign">{hoveredTeam.player5_ign}</span>
              </div>
            )}
          </div>
          <div className="team-showcase__tooltip-footer">
            <span className={`team-showcase__status team-showcase__status--${hoveredTeam.status || 'pending'}`}>
              {hoveredTeam.status === 'approved' && 'Təsdiqlənib'}
              {hoveredTeam.status === 'pending' && 'Gözləyir'}
              {hoveredTeam.status === 'rejected' && 'Rədd edilib'}
              {hoveredTeam.status === 'disqualified' && 'Diskvalifikasiya'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
