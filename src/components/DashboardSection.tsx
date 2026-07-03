import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, type TeamRecord } from '../context/AuthContext';
import { downloadDataUrl } from '../lib/imageData';
import { downloadBlob, renderTeamPosterSharecard } from '../lib/sharecard';
import { fetchTournament, confirmTournamentDay } from '../lib/tournamentApi';
import { notifyRoomCode, requestNotificationPermission } from '../lib/notifyRoomCode';
import { launchConfetti } from '../lib/confetti';
import {
  getMatchSlot,
  getTournamentDay,
  isSlotPublished,
  MATCH_SCHEDULE,
  slotLabel,
  TOURNAMENT_DAY_COUNT,
} from '../lib/tournamentSchedule';
import { EntrySlotsTable } from './EntrySlotsTable';
import { getTeamById, listTeams } from '../lib/teamAuth';
import type { TournamentState, TournamentDaySchedule } from '../types/tournament';
import { StandingsTable } from './StandingsTable';
import { ResetPasswordModal } from './ResetPasswordModal';
import { TournamentCalendar } from './TournamentCalendar';
import './DashboardSection.css';

const STATUS_LABELS: Record<string, { color: string }> = {
  pending: { color: 'var(--status-pending)' },
  approved: { color: 'var(--status-approved)' },
  rejected: { color: 'var(--status-rejected)' },
  disqualified: { color: 'var(--status-disqualified)' },
};

export function DashboardSection() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamRecord | null>(user);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [allTeams, setAllTeams] = useState<TeamRecord[]>([]);
  const [posterLoading, setPosterLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(0);
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const prevRoomIdRef = useRef<string | null>(null);
  const prevPublishedAtRef = useRef<string | null>(null);
  const teamRef = useRef(team);

  useEffect(() => {
    teamRef.current = team;
  }, [team]);

  const loadTournament = async () => {
    try {
      const [nextTournament, teams] = await Promise.all([fetchTournament(), listTeams()]);
      setTournament(nextTournament);
      setAllTeams(teams);
      setSelectedDay(nextTournament.active_day_index ?? 1);
      setSelectedMatch(nextTournament.active_match_index ?? 0);
    } catch {
      setTournament(null);
    }
  };

  useEffect(() => {
    void loadTournament();
    void requestNotificationPermission();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    const refreshTeam = async () => {
      if (!team?.id) {
        return;
      }

      try {
        const freshTeam = await getTeamById(team.id);

        if (freshTeam) {
          setTeam((prev) => ({ ...prev, ...freshTeam }));
        }

        await loadTournament();
      } catch {
        logout();
        setTeam(null);
      }
    };

    void refreshTeam();
  }, [team?.id, logout]);

  useEffect(() => {
    if (!team?.id) return;

    const interval = setInterval(async () => {
      try {
        const [freshTournament, freshTeamData] = await Promise.all([
          fetchTournament(),
          teamRef.current?.id ? getTeamById(teamRef.current.id) : Promise.resolve(null),
        ]);

        setTournament(freshTournament);

        if (freshTeamData) {
          setTeam((prev) => ({ ...prev, ...freshTeamData }));
        }

        // Room kodu yeni gəldimi?
        const newRoomId =
          freshTournament.global_room_id ??
          (teamRef.current?.id
            ? getMatchSlot(freshTournament, {
                day_index: freshTournament.active_day_index ?? 1,
                match_index: freshTournament.active_match_index ?? 0,
              })?.room_id
            : null);

        if (newRoomId && newRoomId !== prevRoomIdRef.current && prevRoomIdRef.current !== null) {
          // Yeni room kodu gəldi!
          notifyRoomCode(newRoomId);
        }

        prevRoomIdRef.current = newRoomId ?? prevRoomIdRef.current;

        // Standings publish olundumu?
        const activeSlot = { day_index: freshTournament.active_day_index ?? 1, match_index: freshTournament.active_match_index ?? 0 };
        const currentMatch = getMatchSlot(freshTournament, activeSlot);
        const newPublishedAt = currentMatch?.standings_published?.published_at ?? null;

        if (
          newPublishedAt &&
          newPublishedAt !== prevPublishedAtRef.current &&
          prevPublishedAtRef.current !== null
        ) {
          // Yeni standings publish olundu!
          launchConfetti();
        }

        prevPublishedAtRef.current = newPublishedAt ?? prevPublishedAtRef.current;
      } catch {
        // sessiz keç
      }
    }, 20_000); // hər 20 saniyə

    return () => clearInterval(interval);
  }, [team?.id]);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');
    const email = params.get('email');

    if (token && email) {
      setResetToken(token);
      setResetEmail(email);
      setShowResetModal(true);
    }
  }, []);

  const handleConfirmDay = async (dayIndex: number, confirmed: boolean) => {
    if (!team?.id) return;
    try {
      await confirmTournamentDay(team.id, dayIndex, confirmed);
      await loadTournament();
    } catch (error) {
      console.error('Təsdiqləmə xətası:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!team?.id || !tournament) return;
    setCheckinLoading(true);
    try {
      const res = await fetch('/api/tournament/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team.id,
          dayIndex: tournament.active_day_index ?? 1,
          matchIndex: tournament.active_match_index ?? 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Check-in xətası');
      await loadTournament();
    } catch (error) {
      console.error('Check-in xətası:', error);
    } finally {
      setCheckinLoading(false);
    }
  };

  if (!team) {
    return (
      <section className="dashboard" id="dashboard">
        <div className="dashboard__container">
          <div className="dashboard__login-wrap">
            <span className="section-kicker">{t('dashboard.kicker')}</span>
            <h2 className="dashboard__title">{t('dashboard.heading')}</h2>
            <p className="dashboard__subtitle">{t('dashboard.subtitle')}</p>
            <p className="dashboard__subtitle">
              {t('dashboard.loginPrompt')} <button onClick={() => navigate('/login')} className="dashboard__inline-link">{t('dashboard.loginLink')}</button>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (team.status === 'disqualified') {
    return (
      <section className="dashboard" id="dashboard">
        <div className="dashboard__container">
          <div className="dashboard__login-wrap">
            <span className="section-kicker">{t('dashboard.statusKicker')}</span>
            <h2 className="dashboard__title" style={{ color: 'var(--status-disqualified)' }}>
              {t('dashboard.statusDisqualified')}
            </h2>
            <p className="dashboard__subtitle">
              <strong>{team.team_name}</strong> komandası diskvalifikasiya edilib. Əlavə məlumat üçün admin ilə əlaqə saxlayın.
            </p>
            {tournament?.admin_message ? (
              <div className="dashboard__admin-message">
                <span className="dashboard__admin-message-label">{t('dashboard.adminMessage')}</span>
                <p className="dashboard__admin-message-text">{tournament.admin_message}</p>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className="button button--ghost"
                onClick={() => { logout(); navigate('/'); }}
              >
                {t('dashboard.logout')}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (team.status === 'rejected') {
    return (
      <section className="dashboard" id="dashboard">
        <div className="dashboard__container">
          <div className="dashboard__login-wrap">
            <span className="section-kicker">{t('dashboard.statusKicker')}</span>
            <h2 className="dashboard__title" style={{ color: 'var(--status-rejected)' }}>
              {t('dashboard.rejectedTitle')}
            </h2>
            <p className="dashboard__subtitle">
              <strong>{team.team_name}</strong> {t('dashboard.rejectedMessage')}
            </p>
            {tournament?.admin_message ? (
              <div className="dashboard__admin-message">
                <span className="dashboard__admin-message-label">{t('dashboard.adminMessage')}</span>
                <p className="dashboard__admin-message-text">{tournament.admin_message}</p>
              </div>
            ) : null}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <button
                className="button button--ghost"
                onClick={() => { logout(); navigate('/'); }}
              >
                {t('dashboard.logout')}
              </button>
              <a
                href="https://instagram.com/aevicesports"
                target="_blank"
                rel="noopener noreferrer"
                className="button button--primary"
              >
                {t('dashboard.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const statusInfo = STATUS_LABELS[team.status ?? 'pending'] || STATUS_LABELS.pending;
  const activeSlot = { day_index: selectedDay, match_index: selectedMatch };
  const currentMatch = tournament ? getMatchSlot(tournament, activeSlot) : null;
  const currentDay = tournament ? getTournamentDay(tournament, selectedDay) : null;
  const published = currentMatch?.standings_published ?? null;
  const standingsImageUrl = currentMatch?.standings_image_url ?? null;
  const hasPublishedResults = isSlotPublished(currentMatch ?? undefined);
  const teamRow = published?.rows.find((row) => row.team_id === String(team.id)) ?? null;
  const displayRoomId = currentMatch?.room_id || tournament?.global_room_id || team.room_id;
  const displayRoomPassword = currentMatch?.room_password || tournament?.global_room_password || team.room_password;
  const entrySlots = currentDay?.entry_slots_published ?? null;
  const myEntrySlot = entrySlots?.rows.find((row) => row.team_id === String(team.id)) ?? null;
  const results = Array.isArray(team.match_results) ? team.match_results : [];

  const players = [
    { label: t('dashboard.player1'), ign: team.player1_ign },
    { label: t('dashboard.player2'), ign: team.player2_ign },
    { label: t('dashboard.player3'), ign: team.player3_ign },
    { label: t('dashboard.player4'), ign: team.player4_ign },
    ...(team.player5_ign ? [{ label: t('dashboard.reserve'), ign: team.player5_ign }] : []),
  ];

  const cd = teamRow?.chicken_dinners ?? null;
  const pp = teamRow?.placement_points ?? null;
  const fp =
    teamRow?.finish_points ??
    (results.length ? results.reduce((sum, result) => sum + (typeof result.kills === 'number' ? result.kills : 0), 0) : null);
  const tp =
    teamRow?.total_points ??
    (results.length ? results.reduce((sum, result) => sum + (typeof result.total_points === 'number' ? result.total_points : 0), 0) : null);

  const downloadPoster = async () => {
    setPosterLoading(true);

    try {
      const blob = await renderTeamPosterSharecard({
        team,
        statusLabel: t(`dashboard.status.${team.status ?? 'pending'}`),
        snapshot: published ?? null,
        sharecardBackgroundUrl: tournament?.sharecard_background_url ?? '/aevic-sharecard-bg.webp',
      });
      downloadBlob(blob, `${team.team_name.toLowerCase().replace(/\s+/g, '-')}-aevic-sharecard.png`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Poster yaradılmadı.');
    } finally {
      setPosterLoading(false);
    }
  };

  const downloadStandingsImage = () => {
    if (!standingsImageUrl) {
      return;
    }

    downloadDataUrl(standingsImageUrl, 'aevic-standings.png');
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const sharePoster = async () => {
    setPosterLoading(true);

    try {
      const blob = await renderTeamPosterSharecard({
        team,
        statusLabel: t(`dashboard.status.${team.status ?? 'pending'}`),
        snapshot: published ?? null,
        sharecardBackgroundUrl: tournament?.sharecard_background_url ?? '/aevic-sharecard-bg.webp',
      });

      const file = new File([blob], `${team.team_name.toLowerCase().replace(/\s+/g, '-')}-aevic-sharecard.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${team.team_name} - Aevic Esports Turniri`,
          files: [file],
        });
      } else {
        downloadBlob(blob, `${team.team_name.toLowerCase().replace(/\s+/g, '-')}-aevic-sharecard.png`);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        alert(error instanceof Error ? error.message : 'Poster paylaşılmadı.');
      }
    } finally {
      setPosterLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} kopyalandı!`);
    } catch {
      alert('Kopyalamaq olmadı');
    }
  };

  return (
    <section className="dashboard" id="dashboard">
      <div className="dashboard__container">
        <div className="dashboard__header">
          <div className="dashboard__team-info">
            {team.logo_url ? <img src={team.logo_url} alt="" className="dashboard__team-logo" /> : null}
            <div>
              <span className="dashboard__brand-tag">Aevic Esports Turniri</span>
              <h2 className="dashboard__team-name">{team.team_name}</h2>
              <div className="dashboard__team-meta">
                <span className="dashboard__status" style={{ color: statusInfo.color }}>
                  ● {t(`dashboard.status.${team.status ?? 'pending'}`)}
                </span>
                <span>
                  {tournament
                    ? slotLabel(activeSlot, tournament)
                    : 'Nəticə gözlənilir'}
                  {published?.map_label ? ` • ${published.map_label}` : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="dashboard__header-actions">
            {showInstallPrompt && (
              <button
                type="button"
                className="dashboard__notify-btn"
                onClick={() => void handleInstallClick()}
              >
                📲 {t('dashboard.installApp')}
              </button>
            )}
            {team.status === 'approved' && 'Notification' in window && Notification.permission === 'default' && (
              <button
                type="button"
                className="dashboard__notify-btn"
                onClick={() => void requestNotificationPermission()}
              >
                🔔 {t('dashboard.enableNotifications')}
              </button>
            )}
            <button type="button" className="dashboard__logout" onClick={() => { logout(); navigate('/'); }}>
              {t('dashboard.logout')}
            </button>
          </div>
        </div>

        {showResetModal ? (
          <ResetPasswordModal
            token={resetToken}
            email={resetEmail}
            onClose={() => {
              setShowResetModal(false);
              setResetToken('');
              setResetEmail('');
            }}
            onSuccess={() => {
              setShowResetModal(false);
              setResetToken('');
              setResetEmail('');
              window.location.href = '/panel';
            }}
          />
        ) : null}

        {tournament?.admin_message ? (
          <div className="dashboard__admin-message">
            <span className="dashboard__admin-message-label">{t('dashboard.adminMessage')}</span>
            <p className="dashboard__admin-message-text">{tournament.admin_message}</p>
          </div>
        ) : null}

        <div className="dashboard__summary">
          <div className="dashboard__summary-card">
            <span className="dashboard__summary-label">{t('dashboard.resultRank')}</span>
            <strong className="dashboard__summary-value">{teamRow ? `#${teamRow.rank}` : '—'}</strong>
          </div>
          <div className="dashboard__summary-card">
            <span className="dashboard__summary-label">{t('dashboard.entrySlot')}</span>
            <strong className="dashboard__summary-value">{myEntrySlot ? `#${myEntrySlot.slot}` : '—'}</strong>
          </div>
          <div className="dashboard__summary-card">
            <span className="dashboard__summary-label">{t('dashboard.cdWin')}</span>
            <strong className="dashboard__summary-value">{cd ?? '—'}</strong>
          </div>
          <div className="dashboard__summary-card">
            <span className="dashboard__summary-label">{t('dashboard.fpKill')}</span>
            <strong className="dashboard__summary-value">{fp ?? '—'}</strong>
          </div>
          <div className="dashboard__summary-card">
            <span className="dashboard__summary-label">{t('dashboard.tpPoint')}</span>
            <strong className="dashboard__summary-value">{tp ?? '—'}</strong>
          </div>
          {team.status === 'approved' && displayRoomId ? (
            <div className="dashboard__summary-card dashboard__summary-card--room">
              <span className="dashboard__summary-label">{t('dashboard.roomId')}</span>
              <strong className="dashboard__summary-value">{displayRoomId}</strong>
            </div>
          ) : null}
        </div>

        {team.status === 'approved' && tournament && (
          <div className="dashboard__card">
            <p className="dashboard__card-label">{t('dashboard.tournamentSchedule')}</p>
            <TournamentCalendar
              schedule={tournament.schedule ?? []}
              teamId={team.id}
              confirmations={tournament.team_confirmations ?? {}}
              onConfirm={async (dayIndex, confirmed) => {
                await handleConfirmDay(dayIndex, confirmed);
              }}
            />
          </div>
        )}

        <div className="dashboard__poster dashboard__poster--aevic">
          <div
            className="dashboard__poster-bg-preview"
            style={{
              backgroundImage: `url(${tournament?.sharecard_background_url ?? '/aevic-sharecard-bg.webp'})`,
            }}
            aria-hidden="true"
          />
          <div className="dashboard__poster-head">
            <span>{t('dashboard.shareCard')}</span>
            <div className="dashboard__poster-actions">
              <strong className="dashboard__poster-team">{team.team_name}</strong>
              <span title={!hasPublishedResults ? t('dashboard.posterHint') : undefined}>
                <button
                  type="button"
                  className="dashboard__poster-button"
                  onClick={() => void downloadPoster()}
                  disabled={posterLoading || !hasPublishedResults}
                >
                  {posterLoading ? 'Hazırlanır...' : hasPublishedResults ? t('dashboard.downloadPoster') : t('dashboard.waitingResults')}
                </button>
              </span>
              <button
                type="button"
                className="dashboard__poster-button dashboard__poster-button--ghost"
                onClick={() => void sharePoster()}
                disabled={posterLoading}
              >
                {t('dashboard.share')}
              </button>
              {!hasPublishedResults && (
                <p className="dashboard__poster-hint">
                  {t('dashboard.posterHint')}
                </p>
              )}
              {standingsImageUrl ? (
                <button
                  type="button"
                  className="dashboard__poster-button dashboard__poster-button--ghost"
                  onClick={downloadStandingsImage}
                  disabled={posterLoading}
                >
                  {t('dashboard.downloadImage')}
                </button>
              ) : null}
            </div>
          </div>
          <div className="dashboard__poster-grid">
            <div>
              <span>CD</span>
              <strong>{cd ?? '—'}</strong>
            </div>
            <div>
              <span>PP</span>
              <strong>{pp ?? '—'}</strong>
            </div>
            <div>
              <span>FP</span>
              <strong>{fp ?? '—'}</strong>
            </div>
            <div>
              <span>TP</span>
              <strong>{tp ?? '—'}</strong>
            </div>
          </div>
          <p className="dashboard__poster-note">
            {teamRow
              ? t('dashboard.posterNote')
              : t('dashboard.posterNoteNoData')}
          </p>
        </div>

        <div className="dashboard__grid">
          <div className="dashboard__card">
            <div className="dashboard__card-title">
              {t('dashboard.roomCode')}{tournament ? ` • ${slotLabel(activeSlot, tournament)}` : ''}
            </div>
            {team.status === 'approved' && displayRoomId ? (
              <div className="dashboard__room">
                <div className="dashboard__room-row">
                  <span>{t('dashboard.roomId')}</span>
                  <div className="dashboard__room-value-row">
                    <span className="dashboard__room-value">{displayRoomId}</span>
                    <button
                      type="button"
                      className="dashboard__copy-btn"
                      onClick={() => void copyToClipboard(displayRoomId, 'Room ID')}
                      title="Kopyala"
                    >
                      📋
                    </button>
                  </div>
                </div>
                <div className="dashboard__room-row">
                  <span>{t('dashboard.password')}</span>
                  <div className="dashboard__room-value-row">
                    <span className="dashboard__room-value">{displayRoomPassword || '—'}</span>
                    {displayRoomPassword && (
                      <button
                        type="button"
                        className="dashboard__copy-btn"
                        onClick={() => void copyToClipboard(displayRoomPassword, 'Şifrə')}
                        title="Kopyala"
                      >
                        📋
                      </button>
                    )}
                  </div>
                </div>
                {myEntrySlot ? (
                  <p className="dashboard__room-note">
                    {t('dashboard.enterWithSlot')} <strong>#{myEntrySlot.slot}</strong> {t('dashboard.slotSuffix')}
                  </p>
                ) : null}
              </div>
            ) : team.status === 'approved' ? (
              <div className="dashboard__room-checkin">
                <p className="dashboard__empty">
                  {t('dashboard.waitingForRoom')}
                </p>
                {currentMatch?.checked_in_teams?.includes(String(team.id)) ? (
                  <button className="button button--secondary" disabled>
                    ✓ Check-in edilib
                  </button>
                ) : (
                  <button 
                    className="button button--primary" 
                    onClick={handleCheckIn}
                    disabled={checkinLoading}
                  >
                    {checkinLoading ? 'Yüklənir...' : 'Check-in et / Hazıram'}
                  </button>
                )}
              </div>
            ) : (
              <p className="dashboard__empty">
                {t('dashboard.waitingForRoom')}
              </p>
            )}
          </div>

          <div className="dashboard__card">
            <div className="dashboard__card-title">
              {t('dashboard.entrySlots')}{currentDay ? ` • ${currentDay.day_label}` : ''}
            </div>
            {entrySlots?.rows.length ? (
              <EntrySlotsTable rows={entrySlots.rows} highlightTeamId={String(team.id)} />
            ) : (
              <p className="dashboard__empty">{t('dashboard.noSlotsToday')}</p>
            )}
          </div>

          <div className="dashboard__card">
            <div className="dashboard__card-title">{t('dashboard.players')}</div>
            <div className="dashboard__players">
              {players.map((player) => (
                <div key={player.label} className="dashboard__player-row">
                  <span className="dashboard__player-label">{player.label}</span>
                  <span className="dashboard__player-ign">{player.ign}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard__card dashboard__card--full">
            <div className="dashboard__card-title">{t('dashboard.results')}</div>

            {tournament ? (
              <div className="tournament-slot-picker tournament-slot-picker--dashboard">
                <div className="tournament-slot-picker__group">
                  <span className="tournament-slot-picker__label">{t('dashboard.day')}</span>
                  <div className="tournament-slot-picker__tabs">
                    {Array.from({ length: TOURNAMENT_DAY_COUNT }, (_, index) => {
                      const dayIndex = index + 1;
                      return (
                        <button
                          key={dayIndex}
                          type="button"
                          className={`tournament-slot-picker__tab${selectedDay === dayIndex ? ' is-active' : ''}`}
                          onClick={() => setSelectedDay(dayIndex)}
                        >
                          {t('dashboard.dayLabel')} {dayIndex}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="tournament-slot-picker__group">
                  <span className="tournament-slot-picker__label">{t('dashboard.match')}</span>
                  <div className="tournament-slot-picker__tabs">
                    {MATCH_SCHEDULE.map((match, matchIndex) => (
                      <button
                        key={`${match.map}-${matchIndex}`}
                        type="button"
                        className={`tournament-slot-picker__tab${selectedMatch === matchIndex ? ' is-active' : ''}`}
                        onClick={() => setSelectedMatch(matchIndex)}
                      >
                        {match.map_label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {standingsImageUrl && hasPublishedResults ? (
              <div className="dashboard__standings-image-wrap">
                <img src={standingsImageUrl} alt="Turnir nəticələri" className="dashboard__standings-image" />
              </div>
            ) : null}
            {published?.rows.length ? (
              <StandingsTable rows={published.rows} teams={allTeams} highlightTeamId={String(team.id)} />
            ) : !standingsImageUrl || !hasPublishedResults ? (
              <p className="dashboard__empty">{t('dashboard.noResults')}</p>
            ) : null}
          </div>

          {results.length ? (
            <div className="dashboard__card dashboard__card--full">
              <div className="dashboard__card-title">{t('dashboard.syncResults')}</div>
              <div className="dashboard__results">
                <div className="dashboard__results-header">
                  <span>{t('dashboard.matchLabel')}</span>
                  <span>{t('dashboard.type')}</span>
                  <span>{t('dashboard.placement')}</span>
                  <span>{t('dashboard.killFp')}</span>
                  <span>TP</span>
                </div>
                {results.map((result, index) => (
                  <div key={`${result.match_number ?? index}`} className="dashboard__results-row">
                    <span>{t('dashboard.matchLabel')} {result.match_number || index + 1}</span>
                    <span>{result.match_type || '—'}</span>
                    <span>{result.placement ? `${result.placement}. ${t('dashboard.placementSuffix')}` : '—'}</span>
                    <span>{result.kills ?? '—'}</span>
                    <span style={{ color: 'var(--accent)' }}>{result.total_points ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tournament ? (
            <div className="dashboard__card dashboard__card--full">
              <div className="dashboard__card-title">{t('dashboard.matchHistory')}</div>
              <div className="match-history">
                {tournament.days.map((day) => {
                  const dayHasResults = day.matches?.some((m) => m.standings_published);
                  if (!dayHasResults) return null;

                  return (
                    <div key={day.day_index} className="match-history__day">
                      <button
                        type="button"
                        className="match-history__day-header"
                        onClick={() => {
                          const content = document.getElementById(`day-${day.day_index}-content`);
                          if (content) {
                            content.classList.toggle('is-collapsed');
                          }
                        }}
                      >
                        <span>{t('dashboard.dayLabel')} {day.day_index} — {day.day_label}</span>
                        <span className="match-history__day-toggle">▼</span>
                      </button>
                      <div id={`day-${day.day_index}-content`} className="match-history__day-content">
                        {day.matches?.map((match, matchIndex) => {
                          if (!match.standings_published) return null;
                          const teamRow = match.standings_published.rows.find((r) => r.team_id === String(team.id));
                          if (!teamRow) return null;

                          return (
                            <div key={matchIndex} className="match-history__match">
                              <span className="match-history__match-label">{MATCH_SCHEDULE[matchIndex]?.map_label || `Match ${matchIndex + 1}`}</span>
                              <div className="match-history__stats">
                                <span>#{teamRow.rank}</span>
                                <span>CD: {teamRow.chicken_dinners}</span>
                                <span>PP: {teamRow.placement_points}</span>
                                <span>FP: {teamRow.finish_points}</span>
                                <span className="match-history__total">TP: {teamRow.total_points}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="match-history__day-total">
                          <span>{t('dashboard.dayTotal')}:</span>
                          <strong>
                            {day.matches?.reduce((sum, m) => {
                              const row = m.standings_published?.rows.find((r) => r.team_id === String(team.id));
                              return sum + (row?.total_points || 0);
                            }, 0) || 0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {!tournament.days.some((d) => d.matches?.some((m) => m.standings_published)) && (
                  <p className="dashboard__empty">{t('dashboard.noResultsPublished')}</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
