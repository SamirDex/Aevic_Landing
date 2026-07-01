export type StandingsRow = {
  rank: number;
  team_name: string;
  team_id: string | null;
  chicken_dinners: number | null;
  placement_points: number;
  finish_points: number;
  total_points: number;
};

export type EntrySlotRow = {
  slot: number;
  team_id: string;
  team_name: string;
};

export type EntrySlotsSnapshot = {
  rows: EntrySlotRow[];
  published_at: string;
};

export type StandingsSnapshot = {
  rows: StandingsRow[];
  week_label: string;
  day_label: string;
  league_title: string;
  map_label?: string;
  published_at: string;
};

export type MatchMap = 'erangel' | 'miramar' | 'rondo';

export type TournamentDaySchedule = {
  day_index: number;
  date: string;
  time: string;
  label: string;
};

export type TournamentMatchSlot = {
  match_index: number;
  map: MatchMap;
  map_label: string;
  room_id: string | null;
  room_password: string | null;
  /** UUID — fayl /api/media/{id} ünvanında saxlanır */
  standings_image_id: string | null;
  /** API cavabında server doldurur; diskdə saxlanmır */
  standings_image_url?: string | null;
  standings_draft: StandingsSnapshot | null;
  standings_published: StandingsSnapshot | null;
};

export type TournamentDaySlot = {
  day_index: number;
  day_label: string;
  entry_slots_draft: EntrySlotsSnapshot | null;
  entry_slots_published: EntrySlotsSnapshot | null;
  matches: TournamentMatchSlot[];
};

export type TournamentState = {
  global_room_id: string | null;
  global_room_password: string | null;
  week_label: string;
  league_title: string;
  sharecard_background_id: string | null;
  /** API cavabında server doldurur */
  sharecard_background_url?: string | null;
  active_day_index: number;
  active_match_index: number;
  days: TournamentDaySlot[];
  /** Turnir tarix cədvəli */
  schedule?: TournamentDaySchedule[];
  /** Komanda təsdiqləri: team_id -> confirmed_day_indices[] */
  team_confirmations?: Record<string, string[]>;
  /** Admin mesajı - komanda panelində görünür */
  admin_message?: string;
  /** @deprecated Köhnə format — migrate olunur */
  day_label?: string;
  standings_image_url?: string | null;
  standings_draft?: StandingsSnapshot | null;
  standings_published?: StandingsSnapshot | null;
};

export type TournamentSlotRef = {
  day_index: number;
  match_index: number;
};

export const DEFAULT_TOURNAMENT: TournamentState = {
  global_room_id: null,
  global_room_password: null,
  week_label: 'Week 01',
  league_title: 'AEVIC ESPORTS LEAGUE – PUBG MOBILE',
  sharecard_background_id: null,
  active_day_index: 1,
  active_match_index: 0,
  days: [],
};
