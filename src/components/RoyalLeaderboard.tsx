import React from 'react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  level: number;
  streak: number;
  avatar?: string;
}

interface RoyalLeaderboardProps {
  entries?: LeaderboardEntry[];
  title?: string;
  className?: string;
  ariaLabel?: string;
}

const RoyalLeaderboard: React.FC<RoyalLeaderboardProps> = ({
  entries = [],
  title = 'LİDERLİK CƏDVƏLİ',
  className = '',
  ariaLabel,
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'royal-leaderboard__rank--gold';
    if (rank === 2) return 'royal-leaderboard__rank--silver';
    if (rank === 3) return 'royal-leaderboard__rank--bronze';
    return 'royal-leaderboard__rank--default';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  return (
    <div className={`royal-leaderboard ${className}`} role="region" aria-label={ariaLabel || title}>
      <div className="royal-leaderboard__container">
        {/* Corner decorations */}
        <div className="royal-leaderboard__corner royal-leaderboard__corner--tl" aria-hidden="true" />
        <div className="royal-leaderboard__corner royal-leaderboard__corner--tr" aria-hidden="true" />
        <div className="royal-leaderboard__corner royal-leaderboard__corner--bl" aria-hidden="true" />
        <div className="royal-leaderboard__corner royal-leaderboard__corner--br" aria-hidden="true" />

        {/* Header */}
        <div className="royal-leaderboard__header">
          <div className="royal-leaderboard__header-content">
            <div className="royal-leaderboard__status-dot" aria-hidden="true" />
            <h1 className="royal-leaderboard__title">{title}</h1>
            <div className="royal-leaderboard__divider" aria-hidden="true" />
            <div className="royal-leaderboard__icon" aria-hidden="true">⚡</div>
          </div>
        </div>

        {/* Table */}
        <table className="royal-leaderboard__table" aria-label={`${title} data`}>
          <thead>
            <tr className="royal-leaderboard__header-row">
              <th className="royal-leaderboard__header-cell" scope="col">SİRA</th>
              <th className="royal-leaderboard__header-cell" scope="col">KOMANDA</th>
              <th className="royal-leaderboard__header-cell royal-leaderboard__header-cell--right" scope="col">XAL</th>
              <th className="royal-leaderboard__header-cell royal-leaderboard__header-cell--right" scope="col">SƏVİYYƏ</th>
              <th className="royal-leaderboard__header-cell royal-leaderboard__header-cell--right" scope="col">SERİYA</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => (
              <tr
                key={entry.rank}
                className={`royal-leaderboard__row ${getRankColor(entry.rank)}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="royal-leaderboard__cell">
                  <div className="royal-leaderboard__rank-wrapper">
                    <div
                      className={`royal-leaderboard__rank-badge ${getRankColor(entry.rank)}`}
                      aria-label={`Rank ${entry.rank}`}
                    >
                      {entry.rank}
                    </div>
                    {getRankBadge(entry.rank) && (
                      <span className="royal-leaderboard__rank-emoji" aria-hidden="true">
                        {getRankBadge(entry.rank)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="royal-leaderboard__cell">
                  <div className="royal-leaderboard__team-wrapper">
                    {entry.avatar ? (
                      <div className="royal-leaderboard__avatar-wrapper">
                        <img
                          src={entry.avatar}
                          alt={`${entry.username} avatar`}
                          className="royal-leaderboard__avatar"
                        />
                        <div className="royal-leaderboard__avatar-dot" aria-hidden="true" />
                      </div>
                    ) : (
                      <div className="royal-leaderboard__avatar-placeholder" aria-hidden="true">
                        {entry.username.charAt(0)}
                      </div>
                    )}
                    <span className="royal-leaderboard__username">
                      {entry.username}
                    </span>
                  </div>
                </td>
                <td className="royal-leaderboard__cell royal-leaderboard__cell--right">
                  <div className="royal-leaderboard__score-wrapper">
                    <span className="royal-leaderboard__score">
                      {entry.score.toLocaleString()}
                    </span>
                    <div className="royal-leaderboard__score-dot" aria-hidden="true" />
                  </div>
                </td>
                <td className="royal-leaderboard__cell royal-leaderboard__cell--right">
                  <div className="royal-leaderboard__level-badge">
                    <span>{entry.level}</span>
                  </div>
                </td>
                <td className="royal-leaderboard__cell royal-leaderboard__cell--right">
                  <div className="royal-leaderboard__streak-badge">
                    <span className="royal-leaderboard__streak-icon" aria-hidden="true">⚡</span>
                    <span className="royal-leaderboard__streak-value">
                      {entry.streak}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer accent */}
        <div className="royal-leaderboard__footer" aria-hidden="true" />
      </div>
    </div>
  );
};

export default RoyalLeaderboard;
