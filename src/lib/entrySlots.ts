import type { EntrySlotRow } from '../types/tournament';
import type { TeamRecord } from './teamAuth';

export const buildEntrySlotsFromApprovedTeams = (teams: TeamRecord[]): EntrySlotRow[] =>
  teams
    .filter((team) => team.status === 'approved')
    .sort((left, right) => left.team_name.localeCompare(right.team_name, 'az'))
    .map((team, index) => ({
      slot: index + 1,
      team_id: String(team.id),
      team_name: team.team_name,
    }));

export const normalizeEntrySlotRows = (rows: EntrySlotRow[]): EntrySlotRow[] =>
  rows.map((row, index) => ({
    ...row,
    slot: index + 1,
  }));

export const moveEntrySlotRow = (rows: EntrySlotRow[], fromIndex: number, direction: -1 | 1): EntrySlotRow[] => {
  const nextIndex = fromIndex + direction;

  if (nextIndex < 0 || nextIndex >= rows.length) {
    return rows;
  }

  const nextRows = [...rows];
  const [moved] = nextRows.splice(fromIndex, 1);
  nextRows.splice(nextIndex, 0, moved);
  return normalizeEntrySlotRows(nextRows);
};
