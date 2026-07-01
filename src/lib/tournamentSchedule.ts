import {
  DEFAULT_TOURNAMENT,
  type StandingsSnapshot,
  type TournamentDaySlot,
  type TournamentMatchSlot,
  type TournamentSlotRef,
  type TournamentState,
} from '../types/tournament';

export const MATCH_SCHEDULE = [
  { map: 'erangel' as const, map_label: 'Erangel' },
  { map: 'miramar' as const, map_label: 'Miramar' },
  { map: 'rondo' as const, map_label: 'Rondo' },
  { map: 'erangel' as const, map_label: 'Erangel' },
];

export const TOURNAMENT_DAY_COUNT = 3;

const createEmptyMatch = (matchIndex: number): TournamentMatchSlot => ({
  match_index: matchIndex,
  map: MATCH_SCHEDULE[matchIndex].map,
  map_label: MATCH_SCHEDULE[matchIndex].map_label,
  room_id: null,
  room_password: null,
  standings_image_id: null,
  standings_draft: null,
  standings_published: null,
});

export const createDefaultDays = (): TournamentDaySlot[] =>
  Array.from({ length: TOURNAMENT_DAY_COUNT }, (_, index) => {
    const dayIndex = index + 1;

    return {
      day_index: dayIndex,
      day_label: `Gün ${String(dayIndex).padStart(2, '0')}`,
      entry_slots_draft: null,
      entry_slots_published: null,
      matches: MATCH_SCHEDULE.map((_, matchIndex) => createEmptyMatch(matchIndex)),
    };
  });

export const createDefaultTournamentState = (): TournamentState => ({
  ...DEFAULT_TOURNAMENT,
  days: createDefaultDays(),
});

export const normalizeTournamentState = (raw: Partial<TournamentState> | null | undefined): TournamentState => {
  const base = createDefaultTournamentState();
  const merged: TournamentState = {
    ...base,
    ...raw,
    days: raw?.days?.length === TOURNAMENT_DAY_COUNT ? raw.days : base.days,
  };

  if (!raw?.days?.length) {
    const legacySnapshot = raw?.standings_published ?? raw?.standings_draft ?? null;
    const legacyImageId = raw?.days?.[0]?.matches?.[0]?.standings_image_id ?? null;

    if (legacySnapshot || legacyImageId) {
      merged.days[0].matches[0] = {
        ...merged.days[0].matches[0],
        standings_image_id: legacyImageId,
        standings_draft: raw?.standings_draft ?? legacySnapshot,
        standings_published: raw?.standings_published ?? legacySnapshot,
      };
    }
  }

  if (typeof raw?.active_day_index === 'number') {
    merged.active_day_index = Math.min(TOURNAMENT_DAY_COUNT, Math.max(1, raw.active_day_index));
  }

  if (typeof raw?.active_match_index === 'number') {
    merged.active_match_index = Math.min(MATCH_SCHEDULE.length - 1, Math.max(0, raw.active_match_index));
  }

  merged.days = merged.days.map((day) => ({
    ...day,
    entry_slots_draft: day.entry_slots_draft ?? null,
    entry_slots_published: day.entry_slots_published ?? null,
    matches: (day.matches ?? []).map((match, matchIndex) => ({
      ...createEmptyMatch(matchIndex),
      ...match,
      room_id: match.room_id ?? null,
      room_password: match.room_password ?? null,
    })),
  }));

  return merged;
};

export const getTournamentDay = (tournament: TournamentState, dayIndex: number) =>
  tournament.days.find((day) => day.day_index === dayIndex) ?? tournament.days[dayIndex - 1];

export const getMatchSlot = (tournament: TournamentState, slot: TournamentSlotRef) => {
  const day = getTournamentDay(tournament, slot.day_index);
  return day?.matches[slot.match_index] ?? day?.matches[0];
};

export const slotLabel = (slot: TournamentSlotRef, tournament: TournamentState) => {
  const day = getTournamentDay(tournament, slot.day_index);
  const match = day?.matches[slot.match_index];
  return `${day?.day_label ?? `Gün ${slot.day_index}`} • ${match?.map_label ?? 'Oyun'}`;
};

export const isSlotPublished = (match: TournamentMatchSlot | undefined) =>
  Boolean(match?.standings_published?.published_at || match?.standings_image_id || match?.standings_image_url);

export const buildSnapshotMeta = (
  tournament: TournamentState,
  slot: TournamentSlotRef,
  weekLabel: string,
  leagueTitle: string,
): Pick<StandingsSnapshot, 'week_label' | 'day_label' | 'league_title' | 'map_label'> => {
  const day = getTournamentDay(tournament, slot.day_index);
  const match = day?.matches[slot.match_index];

  return {
    week_label: weekLabel,
    day_label: day?.day_label ?? `Gün ${slot.day_index}`,
    league_title: leagueTitle,
    map_label: match?.map_label,
  };
};
