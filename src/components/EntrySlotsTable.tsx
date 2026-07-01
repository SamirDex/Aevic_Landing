import type { EntrySlotRow } from '../types/tournament';
import type { TeamRecord } from '../lib/teamAuth';
import './EntrySlotsTable.css';

type EntrySlotsTableProps = {
  rows: EntrySlotRow[];
  teams?: TeamRecord[];
  highlightTeamId?: string;
  editable?: boolean;
  onMove?: (index: number, direction: -1 | 1) => void;
  onTeamChange?: (index: number, teamId: string) => void;
};

export function EntrySlotsTable({
  rows,
  teams = [],
  highlightTeamId,
  editable = false,
  onMove,
  onTeamChange,
}: EntrySlotsTableProps) {
  const approvedTeams = teams.filter((team) => team.status === 'approved');

  if (!rows.length) {
    return <p className="entry-slots-table__empty">Slot siyahısı hələ paylaşılmayıb.</p>;
  }

  return (
    <div className="entry-slots-table-wrap">
      <table className="entry-slots-table">
        <thead>
          <tr>
            <th>Slot</th>
            <th>Komanda</th>
            {editable ? <th aria-label="Sıra dəyiş" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const isHighlighted = highlightTeamId && row.team_id === highlightTeamId;

            return (
              <tr key={`${row.team_id}-${row.slot}`} className={isHighlighted ? 'is-highlighted' : undefined}>
                <td>{String(row.slot).padStart(2, '0')}</td>
                <td>
                  {editable ? (
                    <select
                      className="entry-slots-table__select"
                      value={row.team_id}
                      onChange={(event) => onTeamChange?.(index, event.target.value)}
                    >
                      {approvedTeams.map((team) => (
                        <option key={String(team.id)} value={String(team.id)}>
                          {team.team_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    row.team_name
                  )}
                </td>
                {editable ? (
                  <td className="entry-slots-table__actions">
                    <button type="button" className="entry-slots-table__move" onClick={() => onMove?.(index, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button
                      type="button"
                      className="entry-slots-table__move"
                      onClick={() => onMove?.(index, 1)}
                      disabled={index === rows.length - 1}
                    >
                      ↓
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
