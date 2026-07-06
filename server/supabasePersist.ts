import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createDefaultTournamentState, normalizeTournamentState } from './tournamentSchedule';
import { stripTournamentForPersist } from './tournamentPersist';
import type { TournamentState } from '../src/types/tournament';

const TOURNAMENT_ROW_ID = 'default';
const MEDIA_BUCKET = 'aevic-media';

export type PersistedTeam = {
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
  status: string;
  room_id: string | null;
  room_password: string | null;
  match_results: unknown[];
  created_at: string;
  reset_token?: string | null;
  rejection_reason?: string | null;
};

type TeamRow = {
  id: number | string;
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
  logo_url: string | null;
  status: string;
  room_id: string | null;
  room_password: string | null;
  match_results: unknown[] | null;
  created_at: string;
  reset_token?: string | null;
  rejection_reason?: string | null;
};

export const getSupabaseUrl = () =>
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

export const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabasePersistEnabled = () => Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey());

export const getSupabaseAdmin = (): SupabaseClient | null => {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};

const mapTeamRow = (row: TeamRow): PersistedTeam => ({
  id: String(row.id),
  team_name: row.team_name,
  captain_name: row.captain_name,
  captain_contact: row.captain_contact,
  email: row.email,
  password_hash: row.password_hash,
  player1_ign: row.player1_ign,
  player2_ign: row.player2_ign,
  player3_ign: row.player3_ign,
  player4_ign: row.player4_ign,
  player5_ign: row.player5_ign,
  logo_url: row.logo_url || '',
  status: row.status,
  room_id: row.room_id,
  room_password: row.room_password,
  match_results: row.match_results ?? [],
  created_at: row.created_at,
  reset_token: row.reset_token,
  rejection_reason: row.rejection_reason,
});

export const createSupabasePersist = () => {
  const client = getSupabaseAdmin();

  if (!client) {
    throw new Error('Supabase service role konfiqurasiya olunmayıb.');
  }

  const readTeams = async (): Promise<PersistedTeam[]> => {
    // Try to select with rejection_reason column first (defensive for migration delays)
    let selectQuery = 'id,team_name,captain_name,captain_contact,email,password_hash,player1_ign,player2_ign,player3_ign,player4_ign,player5_ign,logo_url,status,room_id,room_password,match_results,created_at,reset_token';
    
    try {
      const { data, error } = await client
        .from('teams')
        .select(selectQuery + ',rejection_reason')
        .order('team_name');

      if (error) {
        // If rejection_reason column doesn't exist, fall back to query without it
        if (error.message.includes('rejection_reason') || error.code === '42703') {
          console.warn('[supabase] rejection_reason column not found, using fallback query');
          const { data: fallbackData, error: fallbackError } = await client
            .from('teams')
            .select(selectQuery)
            .order('team_name');
          
          if (fallbackError) {
            throw new Error(fallbackError.message);
          }
          
          return (fallbackData as unknown as TeamRow[]).map((row) => ({
            ...mapTeamRow(row),
            rejection_reason: null,
          }));
        }
        throw new Error(error.message);
      }

      return (data as unknown as TeamRow[]).map(mapTeamRow);
    } catch (err) {
      // Final fallback - try without rejection_reason
      console.error('[supabase] readTeams error, trying fallback:', err);
      const { data, error } = await client
        .from('teams')
        .select(selectQuery)
        .order('team_name');
      
      if (error) {
        throw new Error(error.message);
      }
      
      return (data as unknown as TeamRow[]).map((row) => ({
        ...mapTeamRow(row),
        rejection_reason: null,
      }));
    }
  };

  const writeTeams = async (teams: PersistedTeam[]) => {
    await Promise.all(
      teams.map((team) =>
        client
          .from('teams')
          .update({
            match_results: team.match_results,
            status: team.status,
            room_id: team.room_id,
            room_password: team.room_password,
          })
          .eq('id', Number.isFinite(Number(team.id)) ? Number(team.id) : team.id),
      ),
    );
  };

  const insertTeam = async (team: Omit<PersistedTeam, 'id'> & { id?: string }) => {
    const { data, error } = await client
      .from('teams')
      .insert({
        team_name: team.team_name,
        captain_name: team.captain_name,
        captain_contact: team.captain_contact,
        email: team.email,
        password_hash: team.password_hash,
        player1_ign: team.player1_ign,
        player2_ign: team.player2_ign,
        player3_ign: team.player3_ign,
        player4_ign: team.player4_ign,
        player5_ign: team.player5_ign,
        logo_url: team.logo_url,
        status: team.status,
        room_id: team.room_id,
        room_password: team.room_password,
        match_results: team.match_results,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapTeamRow(data as TeamRow);
  };

  const updateTeam = async (teamId: string, patch: Partial<PersistedTeam>) => {
    const numericId = Number(teamId);
    const filter = Number.isFinite(numericId) ? numericId : teamId;

    // Filter out 'password' field if it exists - use 'password_hash' instead
    const safePatch = { ...patch };
    if ('password' in safePatch) {
      delete (safePatch as any).password;
    }

    // Only allow known columns to avoid PGRST204 errors
    const ALLOWED_UPDATE_FIELDS = new Set([
      'team_name',
      'captain_name',
      'captain_contact',
      'email',
      'password_hash',
      'player1_ign',
      'player2_ign',
      'player3_ign',
      'player4_ign',
      'player5_ign',
      'logo_url',
      'status',
      'room_id',
      'room_password',
      'match_results',
      'reset_token',
      'rejection_reason',
    ]);

    const safeUpdates = Object.fromEntries(
      Object.entries(safePatch).filter(([key]) => ALLOWED_UPDATE_FIELDS.has(key)),
    );

    const { data, error } = await client
      .from('teams')
      .update(safeUpdates)
      .eq('id', filter)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return mapTeamRow(data as TeamRow);
  };

  const deleteTeam = async (teamId: string) => {
    const numericId = Number(teamId);
    const filter = Number.isFinite(numericId) ? numericId : teamId;
    const { error } = await client.from('teams').delete().eq('id', filter);

    if (error) {
      throw error;
    }
  };

  const readTournament = async (): Promise<TournamentState> => {
    const { data, error } = await client
      .from('tournament_state')
      .select('state')
      .eq('id', TOURNAMENT_ROW_ID)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data?.state) {
      const initial = createDefaultTournamentState();
      await writeTournament(initial);
      return initial;
    }

    return normalizeTournamentState(data.state as Partial<TournamentState>);
  };

  const writeTournament = async (state: TournamentState) => {
    const payload = stripTournamentForPersist(state);
    const { error } = await client.from('tournament_state').upsert({
      id: TOURNAMENT_ROW_ID,
      state: payload,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const uploadMedia = async (id: string, buffer: Buffer, mime: string) => {
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const path = `${id}.${ext}`;
    const { error } = await client.storage.from(MEDIA_BUCKET).upload(path, buffer, {
      contentType: mime,
      upsert: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    return id;
  };

  const downloadMedia = async (id: string) => {
    for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
      const path = `${id}.${ext}`;
      const { data, error } = await client.storage.from(MEDIA_BUCKET).download(path);

      if (error || !data) {
        continue;
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      const mime =
        ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      return { id, mime, buffer };
    }

    return null;
  };

  const removeMedia = async (id: string) => {
    const paths = ['png', 'jpg', 'jpeg', 'webp'].map((ext) => `${id}.${ext}`);
    await client.storage.from(MEDIA_BUCKET).remove(paths);
  };

  // Rate-limit functions for serverless environment
  const checkRateLimit = async (ip: string, endpoint: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> => {
    const now = Date.now();
    const resetAt = now + windowMs;

    // Try to find existing rate limit entry
    const { data: existing, error: selectError } = await client
      .from('rate_limits')
      .select('*')
      .eq('ip', ip)
      .eq('endpoint', endpoint)
      .gt('reset_at', now)
      .maybeSingle();

    if (selectError) {
      // On error, allow request (fail open)
      console.error('[rate-limit] Select error:', selectError);
      return { allowed: true, remaining: maxRequests };
    }

    if (existing) {
      const count = (existing.count as number) + 1;
      if (count > maxRequests) {
        return { allowed: false, remaining: 0 };
      }

      // Update count
      const { error: updateError } = await client
        .from('rate_limits')
        .update({ count })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[rate-limit] Update error:', updateError);
        return { allowed: true, remaining: maxRequests - count + 1 };
      }

      return { allowed: true, remaining: maxRequests - count };
    }

    // Create new entry
    const { error: insertError } = await client
      .from('rate_limits')
      .insert({
        ip,
        endpoint,
        count: 1,
        reset_at: resetAt,
      });

    if (insertError) {
      console.error('[rate-limit] Insert error:', insertError);
      return { allowed: true, remaining: maxRequests - 1 };
    }

    return { allowed: true, remaining: maxRequests - 1 };
  };

  const cleanupRateLimits = async () => {
    const now = Date.now();
    const { error } = await client
      .from('rate_limits')
      .delete()
      .lt('reset_at', now);

    if (error) {
      console.error('[rate-limit] Cleanup error:', error);
    }
  };

  return {
    readTeams,
    writeTeams,
    insertTeam,
    updateTeam,
    deleteTeam,
    readTournament,
    writeTournament,
    uploadMedia,
    downloadMedia,
    removeMedia,
    checkRateLimit,
    cleanupRateLimits,
  };
};
