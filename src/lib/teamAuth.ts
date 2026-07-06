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
  player1Photo?: File | null;
  player2Photo?: File | null;
  player3Photo?: File | null;
  player4Photo?: File | null;
  player5Photo?: File | null;
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
  admin_note?: string | null;
  rejection_reason?: string | null;
};

export type TeamAdminUpdate = {
  newPassword?: null | string;
  roomId?: null | string;
  roomPassword?: null | string;
  status?: null | string;
  adminNote?: null | string;
  rejectionReason?: null | string;
};

export type TeamSelfUpdate = {
  teamName?: string;
  captainName?: string;
  captainContact?: string;
  player1?: string;
  player2?: string;
  player3?: string;
  player4?: string;
  player5?: string;
  logoUrl?: string;
};

const SESSION_KEY = 'aevic_team';

export const registerTeam = async (formData: TeamRegistrationData) => {
  const logoUrl = await preparePngLogoDataUrl(formData.logoFile);

  // Upload player photos to get URLs
  const uploadPlayerPhoto = async (file: File | null | undefined): Promise<string | undefined> => {
    if (!file) return undefined;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Şəkil yüklənmədi');
    const data = await res.json();
    return data.url;
  };

  const [player1PhotoUrl, player2PhotoUrl, player3PhotoUrl, player4PhotoUrl, player5PhotoUrl] = await Promise.all([
    uploadPlayerPhoto(formData.player1Photo),
    uploadPlayerPhoto(formData.player2Photo),
    uploadPlayerPhoto(formData.player3Photo),
    uploadPlayerPhoto(formData.player4Photo),
    uploadPlayerPhoto(formData.player5Photo),
  ]);

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
      player1PhotoUrl,
      player2PhotoUrl,
      player3PhotoUrl,
      player4PhotoUrl,
      player5PhotoUrl,
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
  if (updates.rejectionReason !== undefined) payload.rejectionReason = updates.rejectionReason;

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

export const updateTeamSelf = async (updates: TeamSelfUpdate) => {
  const team = getSession();
  if (!team || !team.id || !team.password_hash) {
    throw new Error('Sessiya tapılmadı.');
  }

  const sessionToken = btoa(`${team.id}:${team.password_hash}`);
  const payload: Record<string, unknown> = {};
  if (updates.teamName !== undefined) payload.teamName = updates.teamName;
  if (updates.captainName !== undefined) payload.captainName = updates.captainName;
  if (updates.captainContact !== undefined) payload.captainContact = updates.captainContact;
  if (updates.player1 !== undefined) payload.player1 = updates.player1;
  if (updates.player2 !== undefined) payload.player2 = updates.player2;
  if (updates.player3 !== undefined) payload.player3 = updates.player3;
  if (updates.player4 !== undefined) payload.player4 = updates.player4;
  if (updates.player5 !== undefined) payload.player5 = updates.player5;
  if (updates.logoUrl !== undefined) payload.logoUrl = updates.logoUrl;

  const res = await fetch('/api/teams/self', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sessionToken}` },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? 'Yeniləmə uğursuz oldu.');
  }

  const updatedTeam = await res.json();
  saveSession(updatedTeam);
  return updatedTeam;
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
