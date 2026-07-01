import { preparePngLogoDataUrl } from './logo';
import { getAdminHeaders } from './apiClient';

type TeamRegistrationData = {
  teamName: string;
  captainName: string;
  captainContact: string;
  email: string;
  password: string;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  player5?: string;
  logoFile: File;
};

export type MatchResult = {
  image_url?: string | null;
  match_number?: number | null;
  match_type?: string | null;
  placement?: number | null;
  kills?: number | null;
  total_points?: number | null;
};

export type TeamRecord = {
  captain_contact: string;
  captain_name: string;
  email: string;
  id?: number | string;
  logo_url?: string | null;
  match_results?: MatchResult[] | null;
  password_hash?: string | null;
  player1_ign: string;
  player2_ign: string;
  player3_ign: string;
  player4_ign: string;
  player5_ign?: string | null;
  room_id?: string | null;
  room_password?: string | null;
  status?: string | null;
  team_name: string;
  tier?: string | null;
  admin_note?: string | null;
};

export type TeamAdminUpdate = {
  newPassword?: null | string;
  roomId?: null | string;
  roomPassword?: null | string;
  status?: null | string;
  adminNote?: null | string;
};

const SESSION_KEY = 'aevic_team';

export const registerTeam = async (formData: TeamRegistrationData) => {
  const logoUrl = await preparePngLogoDataUrl(formData.logoFile);

  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamName: formData.teamName,
      captainName: formData.captainName,
      captainContact: formData.captainContact,
      email: formData.email,
      password: formData.password,
      player1: formData.player1,
      player2: formData.player2,
      player3: formData.player3,
      player4: formData.player4,
      player5: formData.player5 || undefined,
      logoUrl,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Qeydiyyat uğursuz oldu.');
  }

  return res.json();
};

export const loginTeam = async (email: string, password: string) => {
  const res = await fetch('/api/teams/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Email və ya şifrə yanlışdır.');
  }

  return res.json();
};

export const getTeamByEmail = async (email: string) => {
  const res = await fetch(`/api/teams/by-email?email=${encodeURIComponent(email)}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
};

export const getTeamById = async (teamId: number | string) => {
  const res = await fetch(`/api/teams/${encodeURIComponent(String(teamId))}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
};

export const listTeams = async () => {
  const res = await fetch('/api/teams', { headers: getAdminHeaders() });
  if (!res.ok) throw new Error('Komandalar yüklənmədi.');
  return res.json();
};

export const deleteTeam = async (teamId: number | string) => {
  const res = await fetch(`/api/teams/${encodeURIComponent(String(teamId))}`, {
    method: 'DELETE',
    headers: getAdminHeaders(),
  });
  if (!res.ok) throw new Error('Silmə uğursuz oldu.');
};

export const updateTeamAdmin = async (teamId: number | string, updates: TeamAdminUpdate) => {
  const payload: Record<string, unknown> = {};
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.roomId !== undefined) payload.roomId = updates.roomId;
  if (updates.roomPassword !== undefined) payload.roomPassword = updates.roomPassword;
  if (updates.newPassword !== undefined) payload.newPassword = updates.newPassword;
  if (updates.adminNote !== undefined) payload.adminNote = updates.adminNote;

  const res = await fetch(`/api/teams/${encodeURIComponent(String(teamId))}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Yeniləmə uğursuz oldu.');
  }

  return res.json();
};

export const saveSession = (team: TeamRecord) => {
  const { password_hash, ...safeTeam } = team;
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeTeam));
};

export const getSession = (): TeamRecord | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TeamRecord;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};
