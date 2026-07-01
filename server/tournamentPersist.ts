import { mediaPublicPath } from './mediaStore';
import type { TournamentMatchSlot, TournamentState } from '../src/types/tournament';

const stripMatchForPersist = (match: TournamentMatchSlot): TournamentMatchSlot => ({
  ...match,
  standings_image_url: undefined,
});

export const stripTournamentForPersist = (state: TournamentState): TournamentState => ({
  ...state,
  sharecard_background_url: undefined,
  standings_image_url: undefined,
  standings_draft: undefined,
  standings_published: undefined,
  days: state.days.map((day) => ({
    ...day,
    matches: day.matches.map(stripMatchForPersist),
  })),
});

export const hydrateTournamentForClient = (state: TournamentState): TournamentState => ({
  ...state,
  sharecard_background_url: state.sharecard_background_id
    ? mediaPublicPath(state.sharecard_background_id)
    : state.sharecard_background_url?.startsWith('data:')
      ? null
      : (state.sharecard_background_url ?? null),
  days: state.days.map((day) => ({
    ...day,
    matches: day.matches.map((match) => ({
      ...match,
      standings_image_url: match.standings_image_id
        ? mediaPublicPath(match.standings_image_id)
        : match.standings_image_url?.startsWith('data:')
          ? null
          : (match.standings_image_url ?? null),
    })),
  })),
});
