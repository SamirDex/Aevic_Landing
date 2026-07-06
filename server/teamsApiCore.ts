import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import {
  buildSnapshotMeta,
  createDefaultTournamentState,
  getMatchSlot,
  getTournamentDay,
  normalizeTournamentState,
} from './tournamentSchedule';
import { deleteMedia, parseImageDataUrl, readMedia, saveMedia } from './mediaStore';
import { hydrateTournamentForClient, stripTournamentForPersist } from './tournamentPersist';
import { createSupabasePersist, isSupabasePersistEnabled, getSupabaseAdmin } from './supabasePersist';
import { sendRegistrationEmail, sendStatusChangeEmail, sendRoomCodeEmail, sendOtpEmail, sendResetEmail } from './emailService';
import { saveOtp, verifyAndConsumeOtp, getOtpData } from './otpStore';
import type {
  EntrySlotRow,
  StandingsRow,
  StandingsSnapshot,
  TournamentSlotRef,
  TournamentState,
} from '../src/types/tournament';

// Rate limiter in-memory store (fallback for local dev)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitInMemory(ip: string, endpoint: string, maxRequests: number, windowMs: number): boolean {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count++;
  return true;
}

// Rate limiter cleanup interval - only start in dev server
let cleanupInterval: NodeJS.Timeout | null = null;

export const startRateLimitCleanup = () => {
  if (cleanupInterval || process.env.NODE_ENV === 'production') return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const entries = Array.from(rateLimitMap.entries());
    for (const [key, value] of entries) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  }, 5 * 60 * 1000);
};

export const stopRateLimitCleanup = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// Unified rate-limit function - uses Supabase if available, falls back to in-memory
async function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number,
  supabaseStore: ReturnType<typeof createSupabasePersist> | null
): Promise<boolean> {
  if (supabaseStore && typeof supabaseStore.checkRateLimit === 'function') {
    try {
      const result = await supabaseStore.checkRateLimit(ip, endpoint, maxRequests, windowMs);
      return result.allowed;
    } catch (err) {
      console.error('[rate-limit] Supabase error, falling back to in-memory:', err);
      return checkRateLimitInMemory(ip, endpoint, maxRequests, windowMs);
    }
  }
  return checkRateLimitInMemory(ip, endpoint, maxRequests, windowMs);
}

export type TeamsApiRequest = {
  method: string;
  pathname: string;
  searchParams: URLSearchParams;
  body: Record<string, unknown>;
  headers?: Record<string, string>;
};

export type TeamsApiResponse = {
  status: number;
  payload?: unknown;
  rawBody?: Buffer;
  headers?: Record<string, string>;
};


type StoredTeam = {
  id: string;
  team_name: string;
  captain_name: string;
  captain_contact: string;
  email: string;
  password_hash: string;
  player1_ign: string;
  player2_ign: string;
  player3_ign: string;
  player4_ign: string;
  player5_ign: string | null;
  logo_url: string;
  player1_photo_url?: string | null;
  player2_photo_url?: string | null;
  player3_photo_url?: string | null;
  player4_photo_url?: string | null;
  player5_photo_url?: string | null;
  status: string;
  room_id: string | null;
  room_password: string | null;
  match_results: unknown[];
  created_at: string;
  reset_token?: string | null;
  admin_note?: string | null;
  rejection_reason?: string | null;
};

type RegisterBody = {
  teamName: string;
  captainName: string;
  captainContact: string;
  email: string;
  password?: string;
  passwordHash?: string;
  player1: string;
  player2: string;
  player3: string;
  player4: string;
  player5?: string;
  player1PhotoUrl?: string;
  player2PhotoUrl?: string;
  player3PhotoUrl?: string;
  player4PhotoUrl?: string;
  player5PhotoUrl?: string;
  logoUrl: string;
  otpCode?: string;
};

const json = (status: number, payload: unknown, headers?: Record<string, string>): TeamsApiResponse => ({ status, payload, headers });
const PUBLIC_TEAM_FIELDS = ['id', 'team_name', 'logo_url', 'status'] as const;

const getAdminKey = (): string => process.env.ADMIN_SERVER_KEY?.trim() ?? '';

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

const verifyHash = async (password: string, stored: string): Promise<boolean> => {
  // Support legacy SHA-256 hashes (salt:hash format) during transition
  if (stored.includes(':') && stored.split(':')[0].length === 32) {
    const [salt, hash] = stored.split(':');
    const legacyHash = createHash('sha256').update(salt + password).digest('hex');
    return legacyHash === hash;
  }
  return bcrypt.compare(password, stored);
};

const pickPublicTeam = (team: StoredTeam) =>
  PUBLIC_TEAM_FIELDS.reduce(
    (publicTeam, field) => ({
      ...publicTeam,
      [field]: team[field],
    }),
    {} as Pick<StoredTeam, (typeof PUBLIC_TEAM_FIELDS)[number]>,
  );

const stripSensitiveFields = <T extends { password_hash?: unknown; reset_token?: unknown }>(
  team: T,
): Omit<T, 'password_hash' | 'reset_token'> => {
  const { password_hash, reset_token, ...safe } = team as Record<string, unknown>;
  void password_hash;
  void reset_token;
  return safe as Omit<T, 'password_hash' | 'reset_token'>;
};

// Check if request is from authenticated admin via session cookie
async function isAdminRequest(apiReq: TeamsApiRequest): Promise<boolean> {
  const cookieHeader = apiReq.headers?.cookie || '';
  const match = cookieHeader.match(/aevic_admin_session=([^;]+)/);
  
  if (!match) return false;
  
  const token = match[1];
  const supabase = getSupabaseAdmin();
  
  if (!supabase) return false;
  
  try {
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select('expires_at')
      .eq('token', token)
      .maybeSingle();
    
    if (error || !session) return false;
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from('admin_sessions').delete().eq('token', token);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

const parseSlot = (body: Record<string, unknown>, tournament: TournamentState): TournamentSlotRef => ({
  day_index: Math.min(3, Math.max(1, Number(body.day_index ?? tournament.active_day_index ?? 1))),
  match_index: Math.min(3, Math.max(0, Number(body.match_index ?? tournament.active_match_index ?? 0))),
});

const parseDayIndex = (body: Record<string, unknown>, tournament: TournamentState) =>
  Math.min(3, Math.max(1, Number(body.day_index ?? tournament.active_day_index ?? 1)));

const validateEntrySlotRows = (rows: EntrySlotRow[], approvedIds: Set<string>) => {
  if (!rows.length) {
    return 'Slot siyahısı boşdur.';
  }

  const seen = new Set<string>();

  for (const row of rows) {
    if (!row.team_id || !approvedIds.has(row.team_id)) {
      return 'Slot yalnız təsdiqlənmiş komandalardan ibarət ola bilər.';
    }

    if (seen.has(row.team_id)) {
      return 'Eyni komanda iki dəfə slotda ola bilməz.';
    }

    seen.add(row.team_id);
  }

  return null;
};

const syncTeamStatsFromStandings = (teams: StoredTeam[], rows: StandingsRow[]) => {
  for (const row of rows) {
    if (!row.team_id) {
      continue;
    }

    const index = teams.findIndex((team) => team.id === row.team_id);

    if (index === -1) {
      continue;
    }

    teams[index].match_results = [
      {
        match_number: 1,
        match_type: 'League',
        placement: row.rank,
        kills: row.finish_points,
        total_points: row.total_points,
        image_url: null,
      },
    ];
  }
};

export const createTeamsApiHandler = (dataDir: string) => {
  const storePath = path.join(dataDir, 'teams.json');
  const tournamentPath = path.join(dataDir, 'tournament.json');
  const supabaseStore = isSupabasePersistEnabled() ? createSupabasePersist() : null;

  const ensureStore = async () => {
    await fs.mkdir(dataDir, { recursive: true });

    try {
      await fs.access(storePath);
    } catch {
      await fs.writeFile(storePath, '[]', 'utf8');
    }

    try {
      await fs.access(tournamentPath);
    } catch {
      await fs.writeFile(tournamentPath, JSON.stringify(createDefaultTournamentState(), null, 2), 'utf8');
    }
  };

  const readTeams = async (): Promise<StoredTeam[]> => {
    if (supabaseStore) {
      return supabaseStore.readTeams();
    }

    await ensureStore();
    const raw = await fs.readFile(storePath, 'utf8');
    const parsed = JSON.parse(raw) as StoredTeam[];
    return Array.isArray(parsed) ? parsed : [];
  };

  const writeTeams = async (teams: StoredTeam[]) => {
    if (supabaseStore) {
      await supabaseStore.writeTeams(teams);
      return;
    }

    await ensureStore();
    await fs.writeFile(storePath, JSON.stringify(teams, null, 2), 'utf8');
  };

  const migrateLegacyMediaInTournament = async (state: TournamentState): Promise<TournamentState> => {
    let changed = false;

    const migrateDataUrl = async (url: string | null | undefined) => {
      if (!url?.startsWith('data:')) {
        return null;
      }

      try {
        changed = true;
        return await persistImageUpload(url);
      } catch {
        return null;
      }
    };

    for (const day of state.days) {
      for (const match of day.matches) {
        if (!match.standings_image_id && match.standings_image_url?.startsWith('data:')) {
          const id = await migrateDataUrl(match.standings_image_url);

          if (id) {
            match.standings_image_id = id;
            match.standings_image_url = undefined;
          }
        }
      }
    }

    if (!state.sharecard_background_id && state.sharecard_background_url?.startsWith('data:')) {
      const id = await migrateDataUrl(state.sharecard_background_url);

      if (id) {
        state.sharecard_background_id = id;
        state.sharecard_background_url = undefined;
      }
    }

    if (changed) {
      await writeTournament(state);
    }

    return state;
  };

  const readTournament = async (): Promise<TournamentState> => {
    if (supabaseStore) {
      const normalized = await supabaseStore.readTournament();
      return migrateLegacyMediaInTournament(normalized);
    }

    await ensureStore();
    const raw = await fs.readFile(tournamentPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<TournamentState>;
    const normalized = normalizeTournamentState(parsed);

    if (!parsed.days?.length) {
      await writeTournament(normalized);
    }

    return migrateLegacyMediaInTournament(normalized);
  };

  const writeTournament = async (state: TournamentState) => {
    if (supabaseStore) {
      await supabaseStore.writeTournament(state);
      return;
    }

    await ensureStore();
    await fs.writeFile(tournamentPath, JSON.stringify(stripTournamentForPersist(state), null, 2), 'utf8');
  };

  const persistImageUpload = async (imageDataUrl: string) => {
    const parsed = parseImageDataUrl(imageDataUrl);

    if (!parsed) {
      throw new Error('Düzgün şəkil formatı tələb olunur.');
    }

    if (supabaseStore) {
      await supabaseStore.uploadMedia(parsed.id, parsed.buffer, parsed.mime);
      return parsed.id;
    }

    return saveMedia(dataDir, parsed);
  };

  const removeMediaById = async (id: string | null | undefined) => {
    if (!id) {
      return;
    }

    if (supabaseStore) {
      await supabaseStore.removeMedia(id);
      return;
    }

    await deleteMedia(dataDir, id);
  };

  const loadMediaById = async (id: string) => {
    if (supabaseStore) {
      return supabaseStore.downloadMedia(id);
    }

    return readMedia(dataDir, id);
  };

  const handleTeams = async (apiReq: TeamsApiRequest): Promise<TeamsApiResponse> => {
    const { method, pathname, searchParams, body } = apiReq;

    // Extract client IP for rate limiting
    const clientIp = apiReq.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      ?? apiReq.headers?.['x-nf-client-connection-ip']
      ?? apiReq.headers?.['cf-connecting-ip']
      ?? 'unknown';

    // Public teams endpoint (no auth required)
    if (method === 'GET' && pathname === '/api/teams/public') {
      const teams = await readTeams();
      const publicTeams = teams
        .filter((team) => team.status === 'approved')
        .map((team) => ({
          id: team.id,
          team_name: team.team_name,
          logo_url: team.logo_url,
          captain_name: team.captain_name,
          player1_ign: team.player1_ign,
          player2_ign: team.player2_ign,
          player3_ign: team.player3_ign,
          player4_ign: team.player4_ign,
          player5_ign: team.player5_ign,
          status: team.status,
        }));
      return json(200, publicTeams);
    }


    if (method === 'GET' && pathname === '/api/teams') {
      const teams = await readTeams();
      const sorted = teams.sort((a, b) => a.team_name.localeCompare(b.team_name));
      return json(200, (await isAdminRequest(apiReq)) ? sorted : sorted.map(pickPublicTeam));
    }


    if (method === 'GET' && pathname === '/api/teams/by-email') {
      const email = String(searchParams.get('email') || '').toLowerCase().trim();
      const teams = await readTeams();
      const team = teams.find((entry) => entry.email === email) ?? null;

      if (!team) {
        return json(404, { error: 'Komanda tapılmadı.' });
      }

      return json(200, (await isAdminRequest(apiReq)) ? stripSensitiveFields(team) : pickPublicTeam(team));
    }

    if (method === 'GET' && pathname.startsWith('/api/teams/') && pathname !== '/api/teams/by-email') {
      const teamId = pathname.replace('/api/teams/', '');
      const teams = await readTeams();
      const team = teams.find((entry) => String(entry.id) === teamId) ?? null;

      if (!team) {
        return json(404, { error: 'Komanda tapılmadı.' });
      }

      return json(200, (await isAdminRequest(apiReq)) ? stripSensitiveFields(team) : pickPublicTeam(team));
    }

    if (method === 'POST' && pathname === '/api/teams/login') {
      if (!(await checkRateLimit(clientIp, 'login', 10, 5 * 60 * 1000, supabaseStore))) {
        return json(429, { error: 'Çox sayda giriş cəhdi. 5 dəqiqə sonra yenidən cəhd edin.' });
      }
      const loginBody = body as { email?: string; password?: string };
      const email = String(loginBody.email || '').toLowerCase().trim();
      const password = String(loginBody.password || '');
      const teams = await readTeams();
      const matches: StoredTeam[] = [];

      for (const entry of teams) {
        if (entry.email !== email) {
          continue;
        }

        if (password) {
          const isValid = await verifyHash(password, entry.password_hash);
          if (isValid) {
            matches.push(entry);
          }
        }
      }

      if (matches.length === 0) {
        return json(401, { error: 'Email və ya şifrə yanlışdır.' });
      }

      const team = matches.sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))[0];

      return json(200, stripSensitiveFields(team));
    }

    // POST /api/teams/forgot-password
    if (method === 'POST' && pathname === '/api/teams/forgot-password') {
      if (!(await checkRateLimit(clientIp, 'forgot-password', 3, 15 * 60 * 1000, supabaseStore))) {
        return json(429, { error: 'Çox sayda sorğu. 15 dəqiqə sonra yenidən cəhd edin.' });
      }
      const { email } = body as { email?: string };
      if (!email?.trim()) {
        return json(400, { error: 'Email tələb olunur.' });
      }

      const teams = await readTeams();
      const team = teams.find((t) => t.email.toLowerCase() === email.trim().toLowerCase());

      if (team) {
        const token = randomBytes(32).toString('hex');
        const expiry = Date.now() + 60 * 60 * 1000; // 1 saat
        if (supabaseStore) {
          try {
            await supabaseStore.updateTeam(team.id, { reset_token: `${token}:${expiry}` });
          } catch {
            // Ignore error for security
          }
        } else {
          const index = teams.findIndex((t) => t.id === team.id);
          if (index !== -1) {
            teams[index].reset_token = `${token}:${expiry}`;
            await writeTeams(teams);
          }
        }

        const siteUrl = 'https://aevic-landing.netlify.app';
        const resetLink = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(team.email)}`;

        try {
          await sendResetEmail(team.email, resetLink);
          console.log('[reset] Email göndərildi:', team.email);
        } catch (err) {
          console.error('[reset] Email göndərilmədi:', err);
          console.log('[DEV] Reset link:', resetLink);
        }
      }

      return json(200, { ok: true, message: 'Email göndərildi (hesab mövcuddursa).' });
    }

    // POST /api/teams/reset-password
    if (method === 'POST' && pathname === '/api/teams/reset-password') {
      const { email, token, newPassword } = body as { email?: string; token?: string; newPassword?: string };

      if (!email || !token || !newPassword || newPassword.length < 6) {
        return json(400, { error: 'Bütün sahələr tələb olunur. Şifrə ən azı 6 simvol olmalıdır.' });
      }

      const teams = await readTeams();
      const team = teams.find((t) => t.email.toLowerCase() === email.trim().toLowerCase());

      if (!team || !team.reset_token) {
        return json(400, { error: 'Token etibarsızdır.' });
      }

      const [storedToken, expiryStr] = (team.reset_token as string).split(':');
      const expiry = parseInt(expiryStr ?? '0', 10);

      if (storedToken !== token || Date.now() > expiry) {
        return json(400, { error: 'Token etibarsızdır və ya müddəti bitib.' });
      }

      const newHash = await hashPassword(newPassword);
      if (supabaseStore) {
        try {
          await supabaseStore.updateTeam(team.id, { password_hash: newHash, reset_token: null });
        } catch {
          return json(400, { error: 'Şifrə dəyişdirilmədi.' });
        }
      } else {
        const index = teams.findIndex((t) => t.id === team.id);
        if (index !== -1) {
          teams[index].password_hash = newHash;
          teams[index].reset_token = null;
          await writeTeams(teams);
        }
      }

      return json(200, { ok: true });
    }

    if (method === 'POST' && pathname === '/api/teams') {
      if (!(await checkRateLimit(clientIp, 'register', 5, 10 * 60 * 1000, supabaseStore))) {
        return json(429, { error: 'Çox sayda cəhd. 10 dəqiqə sonra yenidən cəhd edin.' });
      }
      const registerBody = body as RegisterBody & { otpCode?: string };
      const email = String(registerBody.email || '').toLowerCase().trim();

      // ── MƏRHƏLƒ 2: OTP doğrulama + komanda yaratma ──────────────────
      if (registerBody.otpCode) {
        const result = await verifyAndConsumeOtp(dataDir, email, registerBody.otpCode);

        if (result.ok === false) {
          return json(400, { error: result.error });
        }

        // Saxlanmış form datasından komanda yarat
        const savedBody = result.registrationData as RegisterBody;
        const password = String(savedBody.password || savedBody.passwordHash || '');

        // Logo artıq birinci mərhələdə persist edilib (savedBody.logoUrl artıq /api/media/... URL-dir)
        const logoUrl = String(savedBody.logoUrl || '');
        const teamName = String(savedBody.teamName || '').trim();

        // Komanda adı təkrarlanma yoxlaması (case-insensitive)
        const teams = await readTeams();
        const nameExists = teams.some(
          (t) => t.team_name.toLowerCase() === teamName.toLowerCase()
        );
        if (nameExists) {
          return json(409, { error: 'Bu komanda adı artıq istifadə olunur.' });
        }

        if (supabaseStore) {
          try {
            const team = await supabaseStore.insertTeam({
              team_name: teamName,
              captain_name: String(savedBody.captainName || '').trim(),
              captain_contact: String(savedBody.captainContact || '').trim(),
              email,
              password_hash: await hashPassword(password),
              player1_ign: String(savedBody.player1 || '').trim(),
              player2_ign: String(savedBody.player2 || '').trim(),
              player3_ign: String(savedBody.player3 || '').trim(),
              player4_ign: String(savedBody.player4 || '').trim(),
              player5_ign: savedBody.player5?.trim() || null,
              logo_url: logoUrl,
              player1_photo_url: savedBody.player1PhotoUrl || null,
              player2_photo_url: savedBody.player2PhotoUrl || null,
              player3_photo_url: savedBody.player3PhotoUrl || null,
              player4_photo_url: savedBody.player4PhotoUrl || null,
              player5_photo_url: savedBody.player5PhotoUrl || null,
              status: 'pending',
              room_id: null,
              room_password: null,
              match_results: [],
              created_at: new Date().toISOString(),
            });

            sendRegistrationEmail(email, team.team_name).catch(console.error);
            return json(201, { team_name: team.team_name, team: pickPublicTeam(team) });
          } catch (error) {
            return json(400, {
              error: error instanceof Error ? error.message : 'Qeydiyyat tamamlanmadı.',
            });
          }
        }

        const team: StoredTeam = {
          id: randomUUID(),
          team_name: teamName,
          captain_name: String(savedBody.captainName || '').trim(),
          captain_contact: String(savedBody.captainContact || '').trim(),
          email,
          password_hash: await hashPassword(password),
          player1_ign: String(savedBody.player1 || '').trim(),
          player2_ign: String(savedBody.player2 || '').trim(),
          player3_ign: String(savedBody.player3 || '').trim(),
          player4_ign: String(savedBody.player4 || '').trim(),
          player5_ign: savedBody.player5?.trim() || null,
          logo_url: logoUrl,
          player1_photo_url: savedBody.player1PhotoUrl || null,
          player2_photo_url: savedBody.player2PhotoUrl || null,
          player3_photo_url: savedBody.player3PhotoUrl || null,
          player4_photo_url: savedBody.player4PhotoUrl || null,
          player5_photo_url: savedBody.player5PhotoUrl || null,
          status: 'pending',
          room_id: null,
          room_password: null,
          match_results: [],
          created_at: new Date().toISOString(),
        };

        const teamsList = await readTeams();
        teamsList.push(team);
        await writeTeams(teamsList);
        sendRegistrationEmail(email, team.team_name).catch(console.error);
        return json(201, { team_name: team.team_name, team: pickPublicTeam(team) });
      }

      // ── MƏRHƏLƏ 1: Validasiya + OTP göndər ──────────────────────────
      const teams = await readTeams();
      const existingByEmail = teams.filter((entry) => entry.email === email);

      if (existingByEmail.length >= 3) {
        return json(400, { error: 'Bu email ilə çox sayda qeydiyyat var. Admin ilə əlaqə saxlayın.' });
      }

      // Logo-nu persist et (base64 → /api/media/...)
      let logoUrl = String(registerBody.logoUrl || '');
      if (logoUrl.startsWith('data:')) {
        if (!logoUrl.startsWith('data:image/png')) {
          return json(400, { error: 'Logo yalnız PNG formatında olmalıdır.' });
        }
        const base64Data = logoUrl.split(',')[1] ?? '';
        const approxBytes = Math.ceil((base64Data.length * 3) / 4);
        if (approxBytes > 2 * 1024 * 1024) {
          return json(400, { error: 'Logo faylı ən çox 2 MB ola bilər.' });
        }
        try {
          const logoId = await persistImageUpload(logoUrl);
          logoUrl = `/api/media/${logoId}`;
        } catch {
          return json(400, { error: 'Loqo şəkli yüklənmədi.' });
        }
      }

      // OTP generasiya et və saxla
      const otpCode = String(Math.floor(100000 + Math.random() * 900000)); // 6 rəqəm
      await saveOtp(dataDir, email, otpCode, { ...registerBody, logoUrl }); // logoUrl artıq URL-dir

      // OTP emaili göndər
      let emailSent = false;
      try {
        await sendOtpEmail(email, otpCode);
        emailSent = true;
      } catch (err) {
        console.error('[register otp] email göndərilmədi:', err);
      }

      // Production-da email uğursuz olduqda OTP leak etmə
      if (process.env.NODE_ENV === 'production' && !emailSent) {
        return json(500, { error: 'Email göndərilmədi, bir az sonra yenidən cəhd edin və ya admin ilə əlaqə saxlayın.' });
      }

      // Dev mühitində email uğursuz olduqda OTP-ni göstər
      const responsePayload: Record<string, unknown> = {
        step: 'verify_email',
        message: emailSent ? `${email} ünvanına kod göndərildi.` : `${email} ünvanına kod göndərilmədi (SMTP konfiqurasiya edilməyib).`,
      };
      if (!emailSent && process.env.NODE_ENV !== 'production') {
        responsePayload.devOtpCode = otpCode;
        console.log(`[DEV] OTP kodu (email gəlmədi): ${otpCode}`);
      }

      return json(200, responsePayload);
    }

    // POST /api/teams/resend-otp
    if (method === 'POST' && pathname === '/api/teams/resend-otp') {
      if (!(await checkRateLimit(clientIp, 'resend-otp', 3, 10 * 60 * 1000, supabaseStore))) {
        return json(429, { error: 'Çox sayda OTP sorğusu. 10 dəqiqə sonra yenidən cəhd edin.' });
      }
      const { email } = body as { email?: string };
      if (!email?.trim()) {
        return json(400, { error: 'Email tələb olunur.' });
      }
      const normalizedEmail = email.toLowerCase().trim();

      // Check if there's an existing OTP for this email
      const otpData = await getOtpData(dataDir, normalizedEmail);
      if (!otpData.ok) {
        return json(400, { error: 'Bu email üçün aktiv OTP yoxdur. Qeydiyyatı yenidən başlayın.' });
      }

      // Generate new OTP
      const newOtpCode = String(Math.floor(100000 + Math.random() * 900000));
      await saveOtp(dataDir, normalizedEmail, newOtpCode, otpData.registrationData || {});

      let emailSent = false;
      try {
        await sendOtpEmail(normalizedEmail, newOtpCode);
        emailSent = true;
      } catch (err) {
        console.error('[resend otp] email göndərilmədi:', err);
      }

      // Production-da email uğursuz olduqda OTP leak etmə
      if (process.env.NODE_ENV === 'production' && !emailSent) {
        return json(500, { error: 'Email göndərilmədi, bir az sonra yenidən cəhd edin və ya admin ilə əlaqə saxlayın.' });
      }

      // Dev mühitində email uğursuz olduqda OTP-ni göstər
      const responsePayload: Record<string, unknown> = {
        message: emailSent ? `${normalizedEmail} ünvanına yeni kod göndərildi.` : `${normalizedEmail} ünvanına kod göndərilmədi (SMTP konfiqurasiya edilməyib).`,
      };
      if (!emailSent && process.env.NODE_ENV !== 'production') {
        responsePayload.devOtpCode = newOtpCode;
        console.log(`[DEV] Yeni OTP kodu (email gəlmədi): ${newOtpCode}`);
      }

      return json(200, responsePayload);
    }

    if (method === 'DELETE' && pathname.startsWith('/api/teams/')) {
      if (!(await isAdminRequest(apiReq))) return json(403, { error: 'İcazə yoxdur.' });

      const teamId = pathname.replace('/api/teams/', '');

      if (supabaseStore) {
        const teams = await readTeams();
        const exists = teams.some((entry) => entry.id === teamId || String(entry.id) === teamId);

        if (!exists) {
          return json(404, { error: 'Komanda tapılmadı.' });
        }

        await supabaseStore.deleteTeam(teamId);
        return json(200, { ok: true });
      }

      const teams = await readTeams();
      const nextTeams = teams.filter((entry) => entry.id !== teamId);

      if (nextTeams.length === teams.length) {
        return json(404, { error: 'Komanda tapılmadı.' });
      }

      await writeTeams(nextTeams);
      return json(200, { ok: true });
    }

    if (method === 'PATCH' && pathname.startsWith('/api/teams/')) {
      const teamId = pathname.replace('/api/teams/', '');

      // Team self-update endpoint (/api/teams/self)
      if (teamId === 'self') {
        const authHeader = apiReq.headers?.['authorization'] ?? '';
        const sessionMatch = authHeader.match(/^Bearer (.+)$/);
        if (!sessionMatch) {
          return json(401, { error: 'İcazə yoxdur.' });
        }

        const sessionToken = sessionMatch[1];
        const teams = await readTeams();
        const teamIndex = teams.findIndex((t) => {
          const teamSession = Buffer.from(`${t.id}:${t.password_hash}`).toString('base64');
          return teamSession === sessionToken;
        });

        if (teamIndex === -1) {
          return json(401, { error: 'İcazə yoxdur.' });
        }

        const team = teams[teamIndex];
        const patchBody = body as {
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

        // Update allowed fields
        if (patchBody.teamName?.trim()) {
          team.team_name = patchBody.teamName.trim();
        }
        if (patchBody.captainName?.trim()) {
          team.captain_name = patchBody.captainName.trim();
        }
        if (patchBody.captainContact?.trim()) {
          team.captain_contact = patchBody.captainContact.trim();
        }
        if (patchBody.player1?.trim()) {
          team.player1_ign = patchBody.player1.trim();
        }
        if (patchBody.player2?.trim()) {
          team.player2_ign = patchBody.player2.trim();
        }
        if (patchBody.player3?.trim()) {
          team.player3_ign = patchBody.player3.trim();
        }
        if (patchBody.player4?.trim()) {
          team.player4_ign = patchBody.player4.trim();
        }
        if (patchBody.player5 !== undefined) {
          team.player5_ign = patchBody.player5?.trim() || null;
        }
        if (patchBody.logoUrl?.startsWith('data:')) {
          if (!patchBody.logoUrl.startsWith('data:image/png')) {
            return json(400, { error: 'Logo yalnız PNG formatında olmalıdır.' });
          }
          const base64Data = patchBody.logoUrl.split(',')[1] ?? '';
          const approxBytes = Math.ceil((base64Data.length * 3) / 4);
          if (approxBytes > 2 * 1024 * 1024) {
            return json(400, { error: 'Logo faylı ən çox 2 MB ola bilər.' });
          }
          try {
            const logoId = await persistImageUpload(patchBody.logoUrl);
            team.logo_url = `/api/media/${logoId}`;
          } catch {
            return json(400, { error: 'Loqo şəkli yüklənmədi.' });
          }
        }

        await writeTeams(teams);
        return json(200, stripSensitiveFields(team));
      }

      // Admin-only update endpoint
      if (!(await isAdminRequest(apiReq))) return json(403, { error: 'İcazə yoxdur.' });

      const patchBody = body as {
        newPassword?: string | null;
        status?: string | null;
        roomId?: string | null;
        roomPassword?: string | null;
        adminNote?: string | null;
      };

      if (supabaseStore) {
        try {
          const updated = await supabaseStore.updateTeam(teamId, {
            ...(patchBody.status !== undefined ? { status: patchBody.status ?? 'pending' } : {}),
            ...(patchBody.roomId !== undefined ? { room_id: patchBody.roomId } : {}),
            ...(patchBody.roomPassword !== undefined ? { room_password: patchBody.roomPassword } : {}),
            ...(patchBody.newPassword ? { password_hash: await hashPassword(String(patchBody.newPassword)) } : {}),
            ...(patchBody.adminNote !== undefined ? { admin_note: patchBody.adminNote } : {}),
          });

          return json(200, stripSensitiveFields(updated));
        } catch {
          return json(404, { error: 'Komanda tapılmadı.' });
        }
      }

      const teams = await readTeams();
      const index = teams.findIndex((entry) => entry.id === teamId);

      if (index === -1) {
        return json(404, { error: 'Komanda tapılmadı.' });
      }

      const existingTeam = teams[index];

      if (patchBody.status !== undefined) {
        teams[index].status = patchBody.status ?? 'pending';
      }

      if (patchBody.roomId !== undefined) {
        teams[index].room_id = patchBody.roomId;
      }

      if (patchBody.roomPassword !== undefined) {
        teams[index].room_password = patchBody.roomPassword;
      }

      if (patchBody.newPassword) {
        teams[index].password_hash = await hashPassword(String(patchBody.newPassword));
      }

      if (patchBody.adminNote !== undefined) {
        teams[index].admin_note = patchBody.adminNote;
      }

      await writeTeams(teams);

      // Status dəyişibsə email göndər
      if (patchBody.status && patchBody.status !== existingTeam.status) {
        sendStatusChangeEmail(existingTeam.email, existingTeam.team_name, patchBody.status as string).catch(console.error);
      }

      // Room kodu yeniləndikdə yalnız seçilmiş komandaya email göndər
      if (patchBody.roomId && patchBody.roomId !== existingTeam.room_id) {
        sendRoomCodeEmail(
          existingTeam.email,
          existingTeam.team_name,
          patchBody.roomId as string,
          (patchBody.roomPassword as string) ?? '',
          'Turnir',
        ).catch(console.error);
      }

      return json(200, stripSensitiveFields(teams[index]));
    }

    return json(404, { error: 'Endpoint tapılmadı.' });
  };

  const handleTournament = async (apiReq: TeamsApiRequest): Promise<TeamsApiResponse> => {
    const { method, pathname, body } = apiReq;

    if (method === 'GET' && pathname === '/api/tournament') {
      return json(200, hydrateTournamentForClient(await readTournament()));
    }

    if (['POST', 'PATCH', 'DELETE'].includes(method) && !(await isAdminRequest(apiReq))) {
      return json(403, { error: 'İcazə yoxdur.' });
    }

    if (method === 'PATCH' && pathname === '/api/tournament/meta') {
      const metaBody = body as Partial<TournamentState>;
      const current = await readTournament();
      const next: TournamentState = {
        ...current,
        week_label: metaBody.week_label ?? current.week_label,
        league_title: metaBody.league_title ?? current.league_title,
        global_room_id: metaBody.global_room_id ?? current.global_room_id,
        global_room_password: metaBody.global_room_password ?? current.global_room_password,
        sharecard_background_id: metaBody.sharecard_background_id ?? current.sharecard_background_id,
        active_day_index: metaBody.active_day_index ?? current.active_day_index,
        active_match_index: metaBody.active_match_index ?? current.active_match_index,
        days: current.days,
      };
      await writeTournament(next);
      return json(200, hydrateTournamentForClient(next));
    }

    if (method === 'POST' && pathname === '/api/tournament/room') {
      const roomBody = body as { roomId?: string; roomPassword?: string };
      const roomId = String(roomBody.roomId || '').trim();
      const roomPassword = String(roomBody.roomPassword || '').trim();
      const tournament = await readTournament();
      const slot = parseSlot(body, tournament);
      const match = getMatchSlot(tournament, slot);

      if (!match) {
        return json(404, { error: 'Oyun slotu tapılmadı.' });
      }

      match.room_id = roomId || null;
      match.room_password = roomPassword || null;
      tournament.global_room_id = roomId || null;
      tournament.global_room_password = roomPassword || null;
      tournament.active_day_index = slot.day_index;
      tournament.active_match_index = slot.match_index;
      await writeTournament(tournament);

      const teams = await readTeams();
      const approvedTeams = teams.filter((team) => team.status === 'approved');

      return json(200, {
        updated: approvedTeams.length,
        tournament: hydrateTournamentForClient(tournament),
        slot,
      });
    }

    if (method === 'POST' && pathname === '/api/tournament/entry-slots/draft') {
      const draftBody = body as { rows?: EntrySlotRow[] };
      const tournament = await readTournament();
      const dayIndex = parseDayIndex(body, tournament);
      const day = getTournamentDay(tournament, dayIndex);
      const teams = await readTeams();
      const approvedIds = new Set(teams.filter((team) => team.status === 'approved').map((team) => team.id));
      const rows = (Array.isArray(draftBody.rows) ? draftBody.rows : []).map((row, index) => ({
        slot: index + 1,
        team_id: String(row.team_id || ''),
        team_name: String(
          row.team_name || teams.find((team) => team.id === row.team_id)?.team_name || '',
        ).trim(),
      }));
      const validationError = rows.length ? validateEntrySlotRows(rows, approvedIds) : null;

      if (validationError) {
        return json(400, { error: validationError });
      }

      day.entry_slots_draft = {
        rows,
        published_at: '',
      };
      tournament.active_day_index = dayIndex;
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'POST' && pathname === '/api/tournament/checkin') {
      const checkinBody = body as { teamId?: string; dayIndex?: number; matchIndex?: number };
      const teamId = String(checkinBody.teamId || '').trim();
      const dayIndex = Number(checkinBody.dayIndex ?? 1);
      const matchIndex = Number(checkinBody.matchIndex ?? 0);
      
      if (!teamId) {
        return json(400, { error: 'Team ID tələb olunur.' });
      }
      
      const tournament = await readTournament();
      const day = getTournamentDay(tournament, dayIndex);
      
      if (!day) {
        return json(404, { error: 'Gün tapılmadı.' });
      }
      
      const match = day.matches[matchIndex];
      if (!match) {
        return json(404, { error: 'Oyun tapılmadı.' });
      }
      
      // Initialize checked_in_teams array if not exists
      if (!match.checked_in_teams) {
        match.checked_in_teams = [];
      }
      
      // Check if team already checked in
      if (match.checked_in_teams.includes(teamId)) {
        return json(200, { alreadyCheckedIn: true });
      }
      
      // Add team to checked_in_teams
      match.checked_in_teams.push(teamId);
      
      await writeTournament(tournament);
      
      return json(200, { checkedIn: true, tournament: hydrateTournamentForClient(tournament) });
    }

    if (method === 'POST' && pathname === '/api/tournament/entry-slots/publish') {
      const tournament = await readTournament();
      const dayIndex = parseDayIndex(body, tournament);
      const day = getTournamentDay(tournament, dayIndex);
      const draft = day.entry_slots_draft;
      const teams = await readTeams();
      const approvedIds = new Set(teams.filter((team) => team.status === 'approved').map((team) => team.id));
      const rows = draft?.rows ?? [];
      const validationError = validateEntrySlotRows(rows, approvedIds);

      if (validationError) {
        return json(400, { error: validationError });
      }

      const publishedAt = new Date().toISOString();
      day.entry_slots_published = {
        rows,
        published_at: publishedAt,
      };
      day.entry_slots_draft = day.entry_slots_published;
      tournament.active_day_index = dayIndex;
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'POST' && pathname === '/api/tournament/standings/image') {
      const imageDataUrl = String((body as { imageDataUrl?: string }).imageDataUrl || '').trim();
      const tournament = await readTournament();
      const slot = parseSlot(body, tournament);
      const match = getMatchSlot(tournament, slot);

      if (!match) {
        return json(404, { error: 'Oyun slotu tapılmadı.' });
      }

      try {
        await removeMediaById(match.standings_image_id);
        match.standings_image_id = await persistImageUpload(imageDataUrl);
      } catch (error) {
        return json(400, { error: error instanceof Error ? error.message : 'Şəkil yüklənmədi.' });
      }

      tournament.active_day_index = slot.day_index;
      tournament.active_match_index = slot.match_index;
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'POST' && pathname === '/api/tournament/sharecard/background') {
      const imageDataUrl = String((body as { imageDataUrl?: string }).imageDataUrl || '').trim();
      const tournament = await readTournament();

      try {
        await removeMediaById(tournament.sharecard_background_id);
        tournament.sharecard_background_id = await persistImageUpload(imageDataUrl);
      } catch (error) {
        return json(400, { error: error instanceof Error ? error.message : 'Şəkil yüklənmədi.' });
      }

      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'POST' && pathname === '/api/tournament/standings/draft') {
      const draftBody = body as {
        rows?: StandingsRow[];
        week_label?: string;
        league_title?: string;
        day_index?: number;
        match_index?: number;
      };
      const tournament = await readTournament();
      const slot = parseSlot(body, tournament);
      const match = getMatchSlot(tournament, slot);

      if (!match) {
        return json(404, { error: 'Oyun slotu tapılmadı.' });
      }

      const meta = buildSnapshotMeta(
        tournament,
        slot,
        String(draftBody.week_label || tournament.week_label),
        String(draftBody.league_title || tournament.league_title),
      );

      tournament.week_label = meta.week_label;
      tournament.league_title = meta.league_title;
      match.standings_draft = {
        rows: Array.isArray(draftBody.rows) ? draftBody.rows : [],
        ...meta,
        published_at: '',
      };
      tournament.active_day_index = slot.day_index;
      tournament.active_match_index = slot.match_index;

      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'DELETE' && pathname === '/api/tournament/standings/slot') {
      const tournament = await readTournament();
      const slot = parseSlot(body, tournament);
      const match = getMatchSlot(tournament, slot);

      if (!match) {
        return json(404, { error: 'Oyun slotu tapılmadı.' });
      }

      await removeMediaById(match.standings_image_id);
      match.standings_draft = null;
      match.standings_published = null;
      match.standings_image_id = null;
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'DELETE' && pathname === '/api/tournament/standings') {
      const current = await readTournament();
      const tournament = createDefaultTournamentState();
      tournament.global_room_id = current.global_room_id;
      tournament.global_room_password = current.global_room_password;
      tournament.sharecard_background_id = current.sharecard_background_id;
      tournament.week_label = current.week_label;
      tournament.league_title = current.league_title;
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'POST' && pathname === '/api/tournament/confirm-day') {
      const { teamId, dayIndex, confirmed } = body as {
        teamId?: string;
        dayIndex?: number;
        confirmed?: boolean;
      };
      if (!teamId || dayIndex === undefined) return json(400, { error: 'teamId və dayIndex tələb olunur.' });

      const tournament = await readTournament();
      const confirmations = (tournament.team_confirmations as Record<string, string[]>) ?? {};
      const teamDays = confirmations[String(teamId)] ?? [];

      confirmations[String(teamId)] = confirmed
        ? teamDays.includes(String(dayIndex)) ? teamDays : [...teamDays, String(dayIndex)]
        : teamDays.filter((d) => d !== String(dayIndex));

      await writeTournament({ ...tournament, team_confirmations: confirmations });
      return json(200, { ok: true });
    }

    if (method === 'POST' && pathname === '/api/tournament/standings/update') {
      const updateBody = body as {
        rows?: StandingsRow[];
        week_label?: string;
        league_title?: string;
        day_index?: number;
        match_index?: number;
      };
      const tournament = await readTournament();
      const slot = parseSlot(body, tournament);
      const match = getMatchSlot(tournament, slot);

      if (!match) {
        return json(404, { error: 'Oyun slotu tapılmadı.' });
      }

      const meta = buildSnapshotMeta(
        tournament,
        slot,
        String(updateBody.week_label || tournament.week_label),
        String(updateBody.league_title || tournament.league_title),
      );

      const snapshot: StandingsSnapshot = {
        rows: Array.isArray(updateBody.rows) ? updateBody.rows : [],
        ...meta,
        published_at: match.standings_published?.published_at || new Date().toISOString(),
      };

      tournament.week_label = meta.week_label;
      tournament.league_title = meta.league_title;
      match.standings_draft = snapshot;
      match.standings_published = snapshot;
      tournament.active_day_index = slot.day_index;
      tournament.active_match_index = slot.match_index;

      const teams = await readTeams();
      syncTeamStatsFromStandings(teams, snapshot.rows);
      await writeTeams(teams);
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    if (method === 'POST' && pathname === '/api/tournament/standings/publish') {
      const tournament = await readTournament();
      const slot = parseSlot(body, tournament);
      const match = getMatchSlot(tournament, slot);

      if (!match) {
        return json(404, { error: 'Oyun slotu tapılmadı.' });
      }

      const hasImage = Boolean(match.standings_image_id);
      const hasRows = Boolean(match.standings_draft?.rows.length);

      if (!hasImage && !hasRows) {
        return json(400, { error: 'Nəticə şəkli və ya cədvəl tələb olunur.' });
      }

      const publishedAt = new Date().toISOString();
      const meta = buildSnapshotMeta(tournament, slot, tournament.week_label, tournament.league_title);

      if (hasRows) {
        match.standings_published = {
          ...match.standings_draft!,
          published_at: publishedAt,
        };
        match.standings_draft = match.standings_published;

        const teams = await readTeams();
        syncTeamStatsFromStandings(teams, match.standings_published.rows);
        await writeTeams(teams);
      } else {
        match.standings_published = {
          rows: [],
          ...meta,
          published_at: publishedAt,
        };
        match.standings_draft = match.standings_published;
      }

      tournament.active_day_index = slot.day_index;
      tournament.active_match_index = slot.match_index;
      await writeTournament(tournament);
      return json(200, hydrateTournamentForClient(tournament));
    }

    return json(404, { error: 'Endpoint tapılmadı.' });
  };

  const handleMedia = async (apiReq: TeamsApiRequest): Promise<TeamsApiResponse> => {
    const { method, pathname, body } = apiReq;

    if (method === 'GET' && pathname.startsWith('/api/media/')) {
      const id = pathname.replace('/api/media/', '').trim();

      if (!id) {
        return json(404, { error: 'Şəkil tapılmadı.' });
      }

      const media = await loadMediaById(id);

      if (!media) {
        return json(404, { error: 'Şəkil tapılmadı.' });
      }

      return {
        status: 200,
        rawBody: media.buffer,
        headers: {
          'Content-Type': media.mime,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      };
    }

    if (method === 'POST' && pathname === '/api/media') {
      const imageDataUrl = String((body as { imageDataUrl?: string }).imageDataUrl || '').trim();

      try {
        const id = await persistImageUpload(imageDataUrl);
        return json(201, { id, url: `/api/media/${id}` });
      } catch (error) {
        return json(400, { error: error instanceof Error ? error.message : 'Şəkil yüklənmədi.' });
      }
    }

    return json(404, { error: 'Endpoint tapılmadı.' });
  };

  return async (apiReq: TeamsApiRequest): Promise<TeamsApiResponse> => {
    try {
      if (apiReq.pathname === '/api/health' && apiReq.method === 'GET') {
        return json(200, {
          ok: true,
          storage: supabaseStore ? 'supabase' : 'local',
          smtpConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
          adminKeyConfigured: Boolean(process.env.ADMIN_SERVER_KEY),
        });
      }


      if (apiReq.pathname.startsWith('/api/media')) {
        return await handleMedia(apiReq);
      }

      if (apiReq.pathname.startsWith('/api/tournament')) {
        return await handleTournament(apiReq);
      }

      if (apiReq.pathname.startsWith('/api/teams')) {
        return await handleTeams(apiReq);
      }

      return json(404, { error: 'Endpoint tapılmadı.' });
    } catch (error) {
      return json(500, {
        error: error instanceof Error ? error.message : 'Server xətası.',
      });
    }
  };
};
