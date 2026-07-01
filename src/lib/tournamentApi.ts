import { getAdminHeaders, parseApiResponse } from './apiClient';
import type { EntrySlotRow, StandingsRow, TournamentSlotRef, TournamentState } from '../types/tournament';

export type SlotPayload = TournamentSlotRef & {
  rows?: StandingsRow[];
  week_label?: string;
  league_title?: string;
  standings_image_url?: string | null;
  imageDataUrl?: string;
};

export const fetchTournament = async () => parseApiResponse<TournamentState>(await fetch('/api/tournament'));

export const uploadStandingsImage = async (slot: TournamentSlotRef, imageDataUrl: string) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/standings/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify({ ...slot, imageDataUrl }),
    }),
  );

export const uploadSharecardBackground = async (imageDataUrl: string) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/sharecard/background', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify({ imageDataUrl }),
    }),
  );

export const saveTournamentDraft = async (
  payload: SlotPayload & {
    rows: StandingsRow[];
    week_label: string;
    league_title: string;
  },
) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/standings/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify(payload),
    }),
  );

export const publishTournamentStandings = async (slot: TournamentSlotRef) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/standings/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify(slot),
    }),
  );

export const broadcastGlobalRoom = async (
  roomId: string,
  roomPassword: string,
  slot: TournamentSlotRef,
) =>
  parseApiResponse<{ updated: number; tournament: TournamentState; slot: TournamentSlotRef }>(
    await fetch('/api/tournament/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify({ roomId, roomPassword, ...slot }),
    }),
  );

export const saveEntrySlotsDraft = async (dayIndex: number, rows: EntrySlotRow[]) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/entry-slots/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
      body: JSON.stringify({ day_index: dayIndex, rows }),
    }),
  );

export const publishEntrySlots = async (dayIndex: number) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/entry-slots/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day_index: dayIndex }),
    }),
  );

export const updateTournamentMeta = async (payload: Partial<TournamentState>) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/meta', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

export const updatePublishedStandings = async (
  payload: SlotPayload & {
    rows: StandingsRow[];
    week_label: string;
    league_title: string;
  },
) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/standings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  );

export const deleteTournamentStandingsSlot = async (slot: TournamentSlotRef) =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/standings/slot', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slot),
    }),
  );

/** @deprecated Bütün turniri silir */
export const deleteTournamentStandings = async () =>
  parseApiResponse<TournamentState>(
    await fetch('/api/tournament/standings', {
      method: 'DELETE',
    }),
  );

export const confirmTournamentDay = async (
  teamId: string | number,
  dayIndex: number,
  confirmed: boolean,
): Promise<void> => {
  const res = await fetch('/api/tournament/confirm-day', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId: String(teamId), dayIndex, confirmed }),
  });
  if (!res.ok) throw new Error('Təsdiqləmə uğursuz oldu.');
};
