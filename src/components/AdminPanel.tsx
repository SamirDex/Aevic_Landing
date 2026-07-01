import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { attachTeamIds, extractStandingsFromImage } from '../lib/standingsParser';
import { fileToDataUrl } from '../lib/imageData';
import { getAdminHeaders } from '../lib/apiClient';
import {
  createDefaultTournamentState,
  getMatchSlot,
  getTournamentDay,
  MATCH_SCHEDULE,
  slotLabel,
  TOURNAMENT_DAY_COUNT,
} from '../lib/tournamentSchedule';
import { buildEntrySlotsFromApprovedTeams, moveEntrySlotRow, normalizeEntrySlotRows } from '../lib/entrySlots';
import {
  broadcastGlobalRoom,
  deleteTournamentStandingsSlot,
  fetchTournament,
  publishEntrySlots,
  publishTournamentStandings,
  saveEntrySlotsDraft,
  saveTournamentDraft,
  updatePublishedStandings,
  updateTournamentMeta,
  uploadSharecardBackground,
  uploadStandingsImage,
} from '../lib/tournamentApi';
import { ImageUploadZone } from './ImageUploadZone';
import { EntrySlotsTable } from './EntrySlotsTable';
import { deleteTeam, listTeams, updateTeamAdmin, type TeamRecord } from '../lib/teamAuth';
import type { EntrySlotRow, StandingsRow, TournamentSlotRef, TournamentState, TournamentDaySchedule } from '../types/tournament';
import { StandingsTable } from './StandingsTable';
import './AdminPanel.css';

type AdminTab = 'teams' | 'room' | 'standings';

export function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('admin.statusPending'), value: 'pending' },
    { label: t('admin.statusApproved'), value: 'approved' },
    { label: t('admin.statusRejected'), value: 'rejected' },
  ];
  const [tab, setTab] = useState<AdminTab>('teams');
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState('pending');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [globalRoomId, setGlobalRoomId] = useState('');
  const [globalRoomPassword, setGlobalRoomPassword] = useState('');
  const [draftRows, setDraftRows] = useState<StandingsRow[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedMatch, setSelectedMatch] = useState(0);
  const [roomDay, setRoomDay] = useState(1);
  const [roomMatch, setRoomMatch] = useState(0);
  const [entrySlotDay, setEntrySlotDay] = useState(1);
  const [entrySlotRows, setEntrySlotRows] = useState<EntrySlotRow[]>([]);
  const [weekLabel, setWeekLabel] = useState('Week 01');
  const [leagueTitle, setLeagueTitle] = useState('AEVIC ESPORTS LEAGUE – PUBG MOBILE');
  const [adminMessage, setAdminMessage] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [sharecardBgUploading, setSharecardBgUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduleRows, setScheduleRows] = useState<TournamentDaySchedule[]>([]);

  const loadAll = async () => {
    setLoading(true);

    try {
      const [nextTeams, nextTournament] = await Promise.all([listTeams(), fetchTournament()]);
      setTeams(nextTeams);
      setTournament(nextTournament);
      setWeekLabel(nextTournament.week_label);
      setLeagueTitle(nextTournament.league_title);
      setAdminMessage(nextTournament.admin_message ?? '');
      setScheduleRows(nextTournament.schedule ?? []);
      const dayIndex = nextTournament.active_day_index ?? 1;
      const matchIndex = nextTournament.active_match_index ?? 0;
      setSelectedDay(dayIndex);
      setSelectedMatch(matchIndex);
      setRoomDay(dayIndex);
      setRoomMatch(matchIndex);
      setEntrySlotDay(dayIndex);
      const day = getTournamentDay(nextTournament, dayIndex);
      setEntrySlotRows(
        day?.entry_slots_draft?.rows ??
          day?.entry_slots_published?.rows ??
          buildEntrySlotsFromApprovedTeams(nextTeams),
      );
      const slot = getMatchSlot(nextTournament, { day_index: dayIndex, match_index: matchIndex });
      setDraftRows(slot?.standings_draft?.rows ?? slot?.standings_published?.rows ?? []);
      setGlobalRoomId(slot?.room_id ?? nextTournament.global_room_id ?? '');
      setGlobalRoomPassword(slot?.room_password ?? nextTournament.global_room_password ?? '');

      if (nextTeams.length > 0) {
        setSelectedId((current) => current || String(nextTeams[0].id ?? ''));
      }
    } catch {
      setMessage(t('admin.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const selectedTeam = teams.find((team) => String(team.id ?? '') === selectedId) ?? null;

  useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    setStatus(selectedTeam.status ?? 'pending');
    setRoomId(selectedTeam.room_id ?? '');
    setRoomPassword(selectedTeam.room_password ?? '');
    setAdminNote(selectedTeam.admin_note ?? '');
  }, [selectedTeam]);

  const handleSaveTeam = async () => {
    if (!selectedTeam?.id) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const updatedTeam = await updateTeamAdmin(selectedTeam.id, { status, roomId, roomPassword, newPassword, adminNote });
      setTeams((current) => current.map((team) => (team.id === updatedTeam.id ? updatedTeam : team)));
      setMessage(t('admin.teamUpdated'));
      setNewPassword('');
    } catch {
      setMessage(t('admin.teamUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam?.id) {
      return;
    }

    if (!window.confirm(`"${selectedTeam.team_name}" komandasını silmək istəyirsiniz?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await deleteTeam(selectedTeam.id);
      const nextTeams = teams.filter((team) => team.id !== selectedTeam.id);
      setTeams(nextTeams);
      setSelectedId(nextTeams[0] ? String(nextTeams[0].id) : '');
      setMessage(t('admin.teamDeleted'));
    } catch {
      setMessage(t('admin.teamDeleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/export/csv', { headers: getAdminHeaders() });
      if (!res.ok) throw new Error(t('admin.csvExportFailed'));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t('admin.csvFilename');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage(t('admin.csvDownloaded'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.csvExportFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastRoom = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const slot = { day_index: roomDay, match_index: roomMatch };
      const result = await broadcastGlobalRoom(globalRoomId.trim(), globalRoomPassword.trim(), slot);
      setTournament(result.tournament);
      setMessage(
        `${slotLabel(slot, result.tournament)} ${t('admin.roomShared')} (${result.updated} ${t('admin.statusApproved')}).`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.roomShareFailed'));
    } finally {
      setLoading(false);
    }
  };

  const selectRoomSlot = (dayIndex: number, matchIndex: number) => {
    setRoomDay(dayIndex);
    setRoomMatch(matchIndex);

    if (tournament) {
      const match = getMatchSlot(tournament, { day_index: dayIndex, match_index: matchIndex });
      setGlobalRoomId(match?.room_id ?? tournament.global_room_id ?? '');
      setGlobalRoomPassword(match?.room_password ?? tournament.global_room_password ?? '');
    }
  };

  const selectEntrySlotDay = (dayIndex: number) => {
    setEntrySlotDay(dayIndex);

    if (tournament) {
      const day = getTournamentDay(tournament, dayIndex);
      setEntrySlotRows(
        day?.entry_slots_draft?.rows ??
          day?.entry_slots_published?.rows ??
          buildEntrySlotsFromApprovedTeams(teams),
      );
    }
  };

  const handleGenerateEntrySlots = () => {
    setEntrySlotRows(buildEntrySlotsFromApprovedTeams(teams));
    setMessage(t('admin.slotsGenerated'));
  };

  const handleSaveEntrySlotsDraft = async () => {
    if (!entrySlotRows.length) {
      setMessage(t('admin.slotsEmpty'));
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const next = await saveEntrySlotsDraft(entrySlotDay, normalizeEntrySlotRows(entrySlotRows));
      setTournament(next);
      setMessage(`${t('admin.draftSaved')} ${entrySlotDay} ${t('admin.draftSavedSuffix')}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.draftSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handlePublishEntrySlots = async () => {
    if (!window.confirm(`${t('admin.day')} ${entrySlotDay} ${t('admin.slotsPublished')}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await saveEntrySlotsDraft(entrySlotDay, normalizeEntrySlotRows(entrySlotRows));
      const next = await publishEntrySlots(entrySlotDay);
      setTournament(next);
      const day = getTournamentDay(next, entrySlotDay);
      setEntrySlotRows(day?.entry_slots_published?.rows ?? []);
      setMessage(`${t('admin.slotsPublished')} ${entrySlotDay} ${t('admin.slotsPublishedSuffix')}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.slotsPublishFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSharecardBackgroundUpload = async (file: File) => {
    setSharecardBgUploading(true);
    setMessage(t('admin.sharecardUploading'));

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const next = await uploadSharecardBackground(imageDataUrl);
      setTournament(next);
      setMessage(t('admin.sharecardUpdated'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.sharecardUploadFailed'));
    } finally {
      setSharecardBgUploading(false);
    }
  };

  const handleSaveAdminMessage = async () => {
    setLoading(true);
    setMessage('');

    try {
      const next = await updateTournamentMeta({ admin_message: adminMessage.trim() });
      setTournament(next);
      setMessage(t('admin.adminMessageUpdated'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.adminMessageUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    setLoading(true);
    setMessage('');

    try {
      const next = await updateTournamentMeta({ schedule: scheduleRows });
      setTournament(next);
      setMessage(t('admin.scheduleUpdated'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.scheduleUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const activeSlot: TournamentSlotRef = { day_index: selectedDay, match_index: selectedMatch };

  const applySlotDraft = (nextTournament: TournamentState, slot: TournamentSlotRef) => {
    const match = getMatchSlot(nextTournament, slot);
    setDraftRows(match?.standings_draft?.rows ?? match?.standings_published?.rows ?? []);
  };

  const selectSlot = (dayIndex: number, matchIndex: number) => {
    setSelectedDay(dayIndex);
    setSelectedMatch(matchIndex);

    if (tournament) {
      applySlotDraft(tournament, { day_index: dayIndex, match_index: matchIndex });
    }
  };

  const handleStandingsImageUpload = async (file: File) => {
    setImageUploading(true);
    setMessage(t('admin.standingsUploading'));

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const next = await uploadStandingsImage(activeSlot, imageDataUrl);
      setTournament(next);
      applySlotDraft(next, activeSlot);
      setMessage(t('admin.standingsUploaded'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.standingsUploadFailed'));
    } finally {
      setImageUploading(false);
    }
  };

  const handleStandingsOcrUpload = async (file: File) => {
    setOcrLoading(true);
    setMessage(t('admin.ocrError'));

    try {
      const imageDataUrl = await fileToDataUrl(file);
      const response = await fetch('/api/tournament/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, slotRef: activeSlot }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t('admin.ocrError'));
      const withTeams = attachTeamIds(data.rows, teams);
      setDraftRows(withTeams);
      const matchedCount = withTeams.filter((row) => row.team_id).length;
      setMessage(
        `${withTeams.length} ${t('admin.ocrRead')} (${matchedCount} ${t('admin.ocrMatched')}). ${t('admin.ocrSuffix')}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.ocrFailed'));
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setMessage('');

    try {
      const withTeams = attachTeamIds(draftRows, teams);
      setDraftRows(withTeams);
      const next = await saveTournamentDraft({
        ...activeSlot,
        rows: withTeams,
        week_label: weekLabel,
        league_title: leagueTitle,
      });
      setTournament(next);
      await updateTournamentMeta({
        week_label: weekLabel,
        league_title: leagueTitle,
        active_day_index: selectedDay,
        active_match_index: selectedMatch,
      });
      setMessage(t('admin.draftSavedResults'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.draftSaveFailedResults'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStandings = async () => {
    if (!draftRows.length) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const withTeams = attachTeamIds(draftRows, teams);
      setDraftRows(withTeams);

      if (publishedRows.length) {
        const next = await updatePublishedStandings({
          ...activeSlot,
          rows: withTeams,
          week_label: weekLabel,
          league_title: leagueTitle,
        });
        setTournament(next);
        setMessage(t('admin.publishedResults'));
      } else {
        await handleSaveDraft();
        setMessage(t('admin.draftSavedResults'));
      }

      await loadAll();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.publishFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStandings = async () => {
    if (!window.confirm(`${slotLabel(activeSlot, tournament ?? createDefaultTournamentState())} ${t('admin.deletePublished')}?`)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const next = await deleteTournamentStandingsSlot(activeSlot);
      setTournament(next);
      setDraftRows([]);
      setMessage(t('admin.publishedResults'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const nextRank = draftRows.length > 0 ? Math.max(...draftRows.map((row) => row.rank)) + 1 : 1;
    setDraftRows((current) => [
      ...current,
      {
        rank: nextRank,
        team_name: '',
        team_id: null,
        chicken_dinners: null,
        placement_points: 0,
        finish_points: 0,
        total_points: 0,
      },
    ]);
  };

  const handlePublishStandings = async () => {
    if (!window.confirm('Nəticələri bütün komandalara paylaşmaq istəyirsiniz?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const withTeams = attachTeamIds(draftRows, teams);
      const currentMatch = tournament ? getMatchSlot(tournament, activeSlot) : null;
      const hasImage = Boolean(currentMatch?.standings_image_id || currentMatch?.standings_image_url);

      if (withTeams.length) {
        await saveTournamentDraft({
          ...activeSlot,
          rows: withTeams,
          week_label: weekLabel,
          league_title: leagueTitle,
        });
      } else if (!hasImage) {
        setMessage(t('admin.slotsEmpty'));
        return;
      }

      await updateTournamentMeta({
        week_label: weekLabel,
        league_title: leagueTitle,
        active_day_index: selectedDay,
        active_match_index: selectedMatch,
      });
      const next = await publishTournamentStandings(activeSlot);
      setTournament(next);
      applySlotDraft(next, activeSlot);
      await loadAll();
      setMessage(t('admin.publishedResults'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t('admin.publishFailed'));
    } finally {
      setLoading(false);
    }
  };

  const currentMatch = tournament ? getMatchSlot(tournament, activeSlot) : null;
  const publishedRows = currentMatch?.standings_published?.rows ?? [];
  const standingsImageUrl = currentMatch?.standings_image_url ?? null;
  const sharecardBackgroundUrl = tournament?.sharecard_background_url ?? '/aevic-sharecard-bg.webp';
  const canPublish = Boolean(draftRows.length || standingsImageUrl);

  return (
    <div className="admin-panel admin-panel--new-layout">
      {/* Fixed Sidebar */}
      <aside className="admin-panel__sidebar-fixed">
        <div className="admin-panel__sidebar-logo">
          <img src="/aevic-brandmark.png" alt="Aevic Esports" />
        </div>
        <nav className="admin-panel__sidebar-nav">
          {([
            ['teams', t('admin.tabTeams'), '👥'],
            ['matches', t('admin.match'), '🎮'],
            ['schedules', t('admin.schedule'), '📅'],
            ['standings', t('admin.tabStandings'), '📊'],
          ] as const).map(([value, label, icon]) => (
            <button
              key={value}
              type="button"
              className={`admin-panel__sidebar-item ${tab === value ? 'is-active' : ''}`}
              onClick={() => setTab(value as AdminTab)}
            >
              <span className="admin-panel__sidebar-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-panel__sidebar-footer">
          <button type="button" className="admin-panel__sidebar-action" onClick={onLogout}>
            <span>🚪</span>
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-panel__main-content">
        {/* Header with Breadcrumb */}
        <header className="admin-panel__header">
          <nav className="admin-panel__breadcrumb">
            <span>Home</span>
            <span className="admin-panel__breadcrumb-separator">/</span>
            <span>{t('admin.tabTeams')}</span>
            <span className="admin-panel__breadcrumb-separator">/</span>
            <span className="admin-panel__breadcrumb-current">Team Approvals</span>
          </nav>
          <div className="admin-panel__header-actions">
            <button type="button" className="admin-panel__header-icon" aria-label={t('common.notifications')}>
              🔔
            </button>
            <button type="button" className="admin-panel__header-icon" onClick={onLogout} aria-label={t('common.logout')}>
              🚪
            </button>
          </div>
        </header>

      {message ? <div className="form-message admin-panel__message">{message}</div> : null}

      {tab === 'teams' ? (
        <div className="admin-panel__content">
          {/* Filters and Search */}
          <div className="admin-panel__filters">
            <div className="admin-panel__search">
              <input
                type="text"
                placeholder={t('admin.searchPlaceholder')}
                className="admin-panel__search-input"
              />
              <span className="admin-panel__search-icon">🔍</span>
            </div>
            <div className="admin-panel__filter-group">
              <select className="admin-panel__filter-select">
                <option value="">{t('admin.allStatuses')}</option>
                <option value="pending">{t('admin.statusPending')}</option>
                <option value="approved">{t('admin.statusApproved')}</option>
                <option value="rejected">{t('admin.statusRejected')}</option>
              </select>
            </div>
          </div>

          {/* Teams Table */}
          <div className="admin-panel__table-container">
            <table className="admin-panel__table">
              <thead>
                <tr>
                  <th>Team ID</th>
                  <th>{t('register.teamName')}</th>
                  <th>{t('register.captainName')}</th>
                  <th>{t('admin.players')}</th>
                  <th>{t('admin.teamStatus')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={String(team.id)}>
                    <td className="admin-panel__table-cell-mono">#{team.id}</td>
                    <td className="admin-panel__table-cell-name">
                      {team.logo_url && (
                        <img src={team.logo_url} alt="" className="admin-panel__table-logo" />
                      )}
                      <strong>{team.team_name}</strong>
                    </td>
                    <td>{team.captain_name}</td>
                    <td className="admin-panel__table-cell-mono">5</td>
                    <td>
                      <span className={`admin-panel__status-badge admin-panel__status-badge--${team.status}`}>
                        {team.status === 'pending' && t('admin.statusPending')}
                        {team.status === 'approved' && t('admin.statusApproved')}
                        {team.status === 'rejected' && t('admin.statusRejected')}
                      </span>
                    </td>
                    <td>
                      <div className="admin-panel__table-actions">
                        <button
                          type="button"
                          className="button button--primary admin-panel__table-btn"
                          onClick={() => {
                            setSelectedId(String(team.id ?? ''));
                            setStatus('approved');
                            handleSaveTeam();
                          }}
                          disabled={loading || team.status === 'approved'}
                        >
                          {t('common.approve')}
                        </button>
                        <button
                          type="button"
                          className="button button--ghost admin-panel__table-btn admin-panel__table-btn--danger"
                          onClick={() => {
                            setSelectedId(String(team.id ?? ''));
                            setStatus('rejected');
                            handleSaveTeam();
                          }}
                          disabled={loading || team.status === 'rejected'}
                        >
                          {t('common.reject')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <footer className="admin-panel__footer">
            <div className="admin-panel__footer-logo">
              <img src="/aevic-brandmark.png" alt="Aevic Esports" />
            </div>
            <div className="admin-panel__footer-links">
              <a href="#">aevicesports.com</a>
              <span>© 2024 Aevic Esports</span>
            </div>
          </footer>
        </div>
      ) : null}

      {tab === 'room' ? (
        <div className="admin-panel__standings">
          <form className="admin-panel__card" onSubmit={handleBroadcastRoom}>
            <span className="story-card__eyebrow">Otaq kodu</span>
            <h3>Gün üzrə oyun otağı (gündə 4 dəfə)</h3>
            <p className="admin-panel__hint">
              Hər gün 4 oyun üçün ayrıca otaq ID və şifrə paylaşın. Komandalar paneldə seçdiyi oyunun kodunu görür.
            </p>

            <div className="tournament-slot-picker">
              <div className="tournament-slot-picker__group">
                <span className="tournament-slot-picker__label">Gün</span>
                <div className="tournament-slot-picker__tabs">
                  {Array.from({ length: TOURNAMENT_DAY_COUNT }, (_, index) => {
                    const dayIndex = index + 1;
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        className={`tournament-slot-picker__tab${roomDay === dayIndex ? ' is-active' : ''}`}
                        onClick={() => selectRoomSlot(dayIndex, roomMatch)}
                      >
                        Gün {dayIndex}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="tournament-slot-picker__group">
                <span className="tournament-slot-picker__label">Oyun</span>
                <div className="tournament-slot-picker__tabs">
                  {MATCH_SCHEDULE.map((match, matchIndex) => (
                    <button
                      key={`${match.map}-${matchIndex}`}
                      type="button"
                      className={`tournament-slot-picker__tab${roomMatch === matchIndex ? ' is-active' : ''}`}
                      onClick={() => selectRoomSlot(roomDay, matchIndex)}
                    >
                      {match.map_label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tournament ? (
              <p className="admin-panel__slot-active">
                Seçilmiş: <strong>{slotLabel({ day_index: roomDay, match_index: roomMatch }, tournament)}</strong>
              </p>
            ) : null}

            <div className="organizer__form-grid">
              <label className="field">
                <span>Room ID</span>
                <input value={globalRoomId} onChange={(event) => setGlobalRoomId(event.target.value)} placeholder="12345678" />
              </label>
              <label className="field">
                <span>Room şifrəsi</span>
                <input value={globalRoomPassword} onChange={(event) => setGlobalRoomPassword(event.target.value)} />
              </label>
            </div>
            <button type="submit" className="button button--primary" disabled={loading}>
              Bu Oyun Üçün Paylaş
            </button>
          </form>

          <div className="admin-panel__card">
            <span className="story-card__eyebrow">Admin Mesajı</span>
            <h3>Komanda panelində görünən bildiriş</h3>
            <p className="admin-panel__hint">
              Bu mesaj bütün təsdiqlənmiş komandaların panelində görünəcək. Vacib bildirişlər üçün istifadə edin.
            </p>

            <label className="field">
              <span>Mesaj</span>
              <textarea
                value={adminMessage}
                onChange={(event) => setAdminMessage(event.target.value)}
                placeholder="Məsələn: Oyun vaxtı dəyişdirildi, paneli yoxlayın."
                rows={3}
              />
            </label>

            <button type="button" className="button button--primary" onClick={handleSaveAdminMessage} disabled={loading}>
              {loading ? 'Yüklənir...' : 'Mesajı Yenilə'}
            </button>
          </div>

          <div className="admin-panel__card">
            <span className="story-card__eyebrow">Turnir Təqvimi</span>
            <h3>Gün və vaxt təyin et</h3>
            <p className="admin-panel__hint">
              Komandalar paneldə turnir təqvimini görür və iştirakı təsdiqləyir. Tarix və saatı düzgün təyin edin.
            </p>

            {scheduleRows.map((row, index) => (
              <div key={row.day_index} className="admin-panel__schedule-row">
                <label className="field">
                  <span>Gün {row.day_index} - Tarix</span>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(event) => {
                      const next = [...scheduleRows];
                      next[index] = { ...next[index], date: event.target.value };
                      setScheduleRows(next);
                    }}
                  />
                </label>
                <label className="field">
                  <span>Saat</span>
                  <input
                    type="time"
                    value={row.time}
                    onChange={(event) => {
                      const next = [...scheduleRows];
                      next[index] = { ...next[index], time: event.target.value };
                      setScheduleRows(next);
                    }}
                  />
                </label>
                <label className="field">
                  <span>Etiket</span>
                  <input
                    value={row.label}
                    onChange={(event) => {
                      const next = [...scheduleRows];
                      next[index] = { ...next[index], label: event.target.value };
                      setScheduleRows(next);
                    }}
                    placeholder="Məsələn: Gün 1 - Erangel"
                  />
                </label>
              </div>
            ))}

            <button type="button" className="button button--primary" onClick={handleSaveSchedule} disabled={loading}>
              {loading ? 'Yüklənir...' : 'Təqvimi Yenilə'}
            </button>
          </div>

          <div className="admin-panel__card">
            <span className="story-card__eyebrow">Giriş slot siyahısı</span>
            <h3>Gündə bir dəfə — otağa giriş sırası</h3>
            <p className="admin-panel__hint">
              Yalnız təsdiqlənmiş komandalar slotda olur. Komandalar bu siyahıya görə otağa hansı sırada daxil olacaqlarını bilir.
            </p>

            <div className="tournament-slot-picker">
              <div className="tournament-slot-picker__group">
                <span className="tournament-slot-picker__label">Gün</span>
                <div className="tournament-slot-picker__tabs">
                  {Array.from({ length: TOURNAMENT_DAY_COUNT }, (_, index) => {
                    const dayIndex = index + 1;
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        className={`tournament-slot-picker__tab${entrySlotDay === dayIndex ? ' is-active' : ''}`}
                        onClick={() => selectEntrySlotDay(dayIndex)}
                      >
                        Gün {dayIndex}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="admin-panel__actions-row">
              <button type="button" className="button button--ghost" onClick={handleGenerateEntrySlots} disabled={loading}>
                Təsdiqlənmiş Komandaları Əlavə Et
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => void handleSaveEntrySlotsDraft()}
                disabled={loading || !entrySlotRows.length}
              >
                Draft Saxla
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => void handlePublishEntrySlots()}
                disabled={loading || !entrySlotRows.length}
              >
                Slot Siyahısını Paylaş
              </button>
            </div>

            <EntrySlotsTable
              rows={entrySlotRows}
              teams={teams}
              editable
              onMove={(index, direction) => setEntrySlotRows((current) => moveEntrySlotRow(current, index, direction))}
              onTeamChange={(index, teamId) => {
                const team = teams.find((entry) => String(entry.id) === teamId);

                if (!team) {
                  return;
                }

                setEntrySlotRows((current) =>
                  normalizeEntrySlotRows(
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, team_id: teamId, team_name: team.team_name } : row,
                    ),
                  ),
                );
              }}
            />

            {tournament?.days.find((day) => day.day_index === entrySlotDay)?.entry_slots_published ? (
              <p className="admin-panel__hint">
                Paylaşılıb:{' '}
                {new Date(
                  tournament.days.find((day) => day.day_index === entrySlotDay)?.entry_slots_published?.published_at ?? '',
                ).toLocaleString('az-AZ')}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'standings' ? (
        <div className="admin-panel__standings">
          <div className="admin-panel__card">
            <span className="story-card__eyebrow">Nəticələr</span>
            <h3>Standings şəkli və cədvəl</h3>
            <p className="admin-panel__hint">
              3 gün × 4 oyun (Erangel → Miramar → Rondo → Erangel). Hər slot üçün ayrı şəkil və cədvəl saxlanır.
              Yeni şəkil yükləyəndə həmin oyunun köhnə şəkli silinir; cədvəli əl ilə doldurmağa davam edin.
            </p>

            <div className="tournament-slot-picker">
              <div className="tournament-slot-picker__group">
                <span className="tournament-slot-picker__label">Gün</span>
                <div className="tournament-slot-picker__tabs">
                  {Array.from({ length: TOURNAMENT_DAY_COUNT }, (_, index) => {
                    const dayIndex = index + 1;
                    return (
                      <button
                        key={dayIndex}
                        type="button"
                        className={`tournament-slot-picker__tab${selectedDay === dayIndex ? ' is-active' : ''}`}
                        onClick={() => selectSlot(dayIndex, selectedMatch)}
                      >
                        Gün {dayIndex}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="tournament-slot-picker__group">
                <span className="tournament-slot-picker__label">Xəritə / Oyun</span>
                <div className="tournament-slot-picker__tabs">
                  {MATCH_SCHEDULE.map((match, matchIndex) => (
                    <button
                      key={`${match.map}-${matchIndex}`}
                      type="button"
                      className={`tournament-slot-picker__tab${selectedMatch === matchIndex ? ' is-active' : ''}`}
                      onClick={() => selectSlot(selectedDay, matchIndex)}
                    >
                      {match.map_label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {tournament ? (
              <p className="admin-panel__slot-active">
                Seçilmiş: <strong>{slotLabel(activeSlot, tournament)}</strong>
              </p>
            ) : null}

            <div className="organizer__form-grid">
              <label className="field">
                <span>Week</span>
                <input value={weekLabel} onChange={(event) => setWeekLabel(event.target.value)} />
              </label>
              <label className="field field--wide">
                <span>Turnir adı</span>
                <input value={leagueTitle} onChange={(event) => setLeagueTitle(event.target.value)} />
              </label>
            </div>

            <div className="admin-panel__upload-grid">
              <ImageUploadZone
                variant="results"
                title="Turnir nəticə şəkli"
                description={`${slotLabel(activeSlot, tournament ?? createDefaultTournamentState())} — komandalar bu oyunun şəklini görür.`}
                actionLabel="Nəticə şəkli yüklə"
                previewUrl={standingsImageUrl}
                previewAlt="Turnir nəticələri"
                loading={imageUploading}
                disabled={ocrLoading || sharecardBgUploading}
                onFile={(file) => void handleStandingsImageUpload(file)}
              />
              <ImageUploadZone
                variant="background"
                title="Sharecard fon şəkli"
                description="Poster endiriləndə arxa fon olur. Phoenix / Aevic branding şəkli seçin."
                actionLabel="Fon şəkli yüklə"
                previewUrl={sharecardBackgroundUrl}
                previewAlt="Sharecard fonu"
                loading={sharecardBgUploading}
                disabled={imageUploading || ocrLoading}
                onFile={(file) => void handleSharecardBackgroundUpload(file)}
              />
            </div>

            <ImageUploadZone
              variant="ocr"
              title="OCR ilə cədvəl (istəyə görə)"
              description="Eyni və ya başqa standings şəklini yükləyin — sistem komanda adlarını və xalları cədvələ yazır."
              actionLabel="OCR üçün şəkil seç"
              loading={ocrLoading}
              disabled={imageUploading || sharecardBgUploading}
              onFile={(file) => void handleStandingsOcrUpload(file)}
            />

            <div className="admin-panel__actions-row">
              <button type="button" className="button button--ghost" onClick={handleAddRow}>
                Sətir Əlavə Et
              </button>
              <button type="button" className="button button--ghost" onClick={() => void handleSaveDraft()} disabled={loading || !draftRows.length}>
                Draft Saxla
              </button>
              <button type="button" className="button button--ghost" onClick={() => void handleUpdateStandings()} disabled={loading || !draftRows.length}>
                Nəticəni Yenilə
              </button>
              <button type="button" className="button button--primary" onClick={() => void handlePublishStandings()} disabled={loading || !canPublish}>
                Təsdiqlə və Paylaş
              </button>
              <button type="button" className="button button--ghost admin-panel__danger" onClick={() => void handleDeleteStandings()} disabled={loading}>
                Cədvəli Sil
              </button>
            </div>
          </div>

          <div className="admin-panel__card">
            <span className="story-card__eyebrow">Draft / Paylaşılan cədvəl</span>
            {draftRows.length ? (
              <StandingsTable
                rows={draftRows}
                teams={teams}
                editable
                onRowCommit={(index, row) => {
                  setDraftRows((current) =>
                    current.map((entry, entryIndex) =>
                      entryIndex === index ? attachTeamIds([row], teams)[0] : entry,
                    ),
                  );
                }}
              />
            ) : (
              <p className="organizer__empty">Hələ nəticə yüklənməyib.</p>
            )}
          </div>

          {publishedRows.length ? (
            <div className="admin-panel__card">
              <span className="story-card__eyebrow">Paylaşılan (komandalar görür)</span>
              <StandingsTable rows={publishedRows} teams={teams} />
            </div>
          ) : null}
        </div>
      ) : null}
      </main>
    </div>
  );
}
