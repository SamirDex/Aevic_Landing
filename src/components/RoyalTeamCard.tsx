import React, { useState } from 'react';

interface TeamStats {
  projects: number;
  wins: number;
  points: number;
}

interface RoyalTeamCardProps {
  name?: string;
  tag?: string;
  logo?: string;
  status?: 'online' | 'offline' | 'busy';
  stats?: TeamStats;
  className?: string;
  ariaLabel?: string;
}

const RoyalTeamCard: React.FC<RoyalTeamCardProps> = ({
  name = 'KOMANDA ADI',
  tag = 'TAG',
  logo = '',
  status = 'online',
  stats = { projects: 0, wins: 0, points: 0 },
  className = '',
  ariaLabel,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    online: 'var(--color-gold)',
    offline: 'var(--color-foreground-muted)',
    busy: 'var(--color-purple)',
  };

  return (
    <div 
      className={`royal-team-card ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="article"
      aria-label={ariaLabel || `${name} - ${status}`}
    >
      {/* Scanning line effect */}
      <div className="royal-team-card__scanline" style={{ opacity: isHovered ? 1 : 0 }} aria-hidden="true" />

      {/* Glow effect on hover */}
      <div 
        className="royal-team-card__glow"
        style={{ opacity: isHovered ? 0.3 : 0 }}
        aria-hidden="true"
      />

      {/* Corner accents */}
      <div className="royal-team-card__corner royal-team-card__corner--tl" aria-hidden="true" />
      <div className="royal-team-card__corner royal-team-card__corner--tr" aria-hidden="true" />
      <div className="royal-team-card__corner royal-team-card__corner--bl" aria-hidden="true" />
      <div className="royal-team-card__corner royal-team-card__corner--br" aria-hidden="true" />

      {/* Content */}
      <div className="royal-team-card__content">
        {/* Header with status */}
        <div className="royal-team-card__header">
          <div className="royal-team-card__status-wrapper">
            <div 
              className="royal-team-card__status-dot"
              style={{ backgroundColor: statusColors[status] }}
              aria-hidden="true"
            />
            <span className="royal-team-card__status-text">
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Logo with HUD overlay */}
        <div className="royal-team-card__logo-wrapper">
          {logo ? (
            <img 
              src={logo}
              alt={`${name} logo`}
              className="royal-team-card__logo"
            />
          ) : (
            <div className="royal-team-card__logo-placeholder" aria-hidden="true">
              {tag}
            </div>
          )}
          
          {/* HUD overlay lines */}
          <div className="royal-team-card__hud-overlay" style={{ opacity: isHovered ? 1 : 0 }} aria-hidden="true">
            <div className="royal-team-card__hud-line royal-team-card__hud-line--h1" />
            <div className="royal-team-card__hud-line royal-team-card__hud-line--h2" />
            <div className="royal-team-card__hud-line royal-team-card__hud-line--h3" />
            <div className="royal-team-card__hud-line royal-team-card__hud-line--v1" />
            <div className="royal-team-card__hud-line royal-team-card__hud-line--v2" />
            <div className="royal-team-card__hud-line royal-team-card__hud-line--v3" />
          </div>
        </div>

        {/* Team info */}
        <div className="royal-team-card__info">
          <h2 className="royal-team-card__name">{name}</h2>
          <p className="royal-team-card__tag">[{tag}]</p>
        </div>

        {/* Stats grid */}
        <div className="royal-team-card__stats">
          <div className="royal-team-card__stat">
            <div className="royal-team-card__stat-value">{stats.projects}</div>
            <div className="royal-team-card__stat-label">LAYİHƏ</div>
          </div>
          <div className="royal-team-card__stat royal-team-card__stat--border">
            <div className="royal-team-card__stat-value">{stats.wins}</div>
            <div className="royal-team-card__stat-label">QƏLƏBƏ</div>
          </div>
          <div className="royal-team-card__stat">
            <div className="royal-team-card__stat-value">{stats.points}</div>
            <div className="royal-team-card__stat-label">XAL</div>
          </div>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="royal-team-card__accent" aria-hidden="true" />
    </div>
  );
};

export default RoyalTeamCard;
