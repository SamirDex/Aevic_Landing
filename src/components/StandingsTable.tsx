import { useEffect, useState, type FocusEvent } from 'react';
import type { StandingsRow } from '../types/tournament';
import type { TeamRecord } from '../lib/teamAuth';

type StandingsTableProps = {
  rows: StandingsRow[];
  teams?: TeamRecord[];
  highlightTeamId?: string;
  editable?: boolean;
  onRowCommit?: (index: number, row: StandingsRow) => void;
};

type EditableRowProps = {
  row: StandingsRow;
  index: number;
  teams: TeamRecord[];
  onCommit: (index: number, row: StandingsRow) => void;
};

const numberToInput = (value: number) => (value === 0 ? '' : String(value));

const parseNumberInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
};

function EditableStandingsRow({ row, index, teams, onCommit }: EditableRowProps) {
  const [local, setLocal] = useState(row);

  useEffect(() => {
    setLocal(row);
  }, [row.rank, row.team_id, row.placement_points, row.finish_points, row.total_points, row.chicken_dinners]);

  const commit = () => {
    onCommit(index, local);
  };

  const handleBlur = (event: FocusEvent) => {
    const nextTarget = event.relatedTarget as HTMLElement | null;
    if (nextTarget?.closest('tr') === event.currentTarget.closest('tr')) {
      return;
    }

    commit();
  };

  const matched = teams.find((team) => String(team.id) === local.team_id);

  return (
    <tr className="standings-table__editable-row" onBlur={handleBlur}>
      <td>{String(local.rank).padStart(2, '0')}</td>
      <td>
        <input
          className="standings-table__input standings-table__input--text"
          value={local.team_name}
          onChange={(event) => setLocal((current) => ({ ...current, team_name: event.target.value }))}
        />
      </td>
      <td>
        <input
          className="standings-table__input"
          inputMode="numeric"
          placeholder="—"
          value={local.chicken_dinners === null ? '' : String(local.chicken_dinners)}
          onChange={(event) =>
            setLocal((current) => ({
              ...current,
              chicken_dinners: event.target.value.trim() ? Number(event.target.value) : null,
            }))
          }
        />
      </td>
      <td>
        <input
          className="standings-table__input"
          inputMode="numeric"
          placeholder="0"
          value={numberToInput(local.placement_points)}
          onChange={(event) =>
            setLocal((current) => ({
              ...current,
              placement_points: parseNumberInput(event.target.value),
            }))
          }
        />
      </td>
      <td>
        <input
          className="standings-table__input"
          inputMode="numeric"
          placeholder="0"
          value={numberToInput(local.finish_points)}
          onChange={(event) =>
            setLocal((current) => ({
              ...current,
              finish_points: parseNumberInput(event.target.value),
            }))
          }
        />
      </td>
      <td>
        <input
          className="standings-table__input"
          inputMode="numeric"
          placeholder="0"
          value={numberToInput(local.total_points)}
          onChange={(event) =>
            setLocal((current) => ({
              ...current,
              total_points: parseNumberInput(event.target.value),
            }))
          }
        />
      </td>
      <td>
        <span className={matched ? 'standings-table__match-ok' : 'standings-table__match-miss'}>
          {matched ? matched.team_name : 'Uyğunluq yoxdur'}
        </span>
      </td>
    </tr>
  );
}

export function StandingsTable({
  rows,
  teams = [],
  highlightTeamId,
  editable = false,
  onRowCommit,
}: StandingsTableProps) {
  return (
    <div className="standings-table-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Komanda</th>
            <th>CD</th>
            <th>PP</th>
            <th>FP</th>
            <th>TP</th>
            {editable ? <th>Uyğunluq</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            if (editable && onRowCommit) {
              return <EditableStandingsRow key={`row-${index}`} row={row} index={index} teams={teams} onCommit={onRowCommit} />;
            }

            const matched = teams.find((team) => String(team.id) === row.team_id);
            const isHighlight = highlightTeamId && row.team_id === highlightTeamId;

            return (
              <tr key={`row-${index}`} className={isHighlight ? 'is-highlight' : ''}>
                <td>{String(row.rank).padStart(2, '0')}</td>
                <td>
                  <div className="standings-table__team">
                    {matched?.logo_url ? (
                      <img src={matched.logo_url} alt="" className="standings-table__logo" />
                    ) : null}
                    <span>{row.team_name}</span>
                  </div>
                </td>
                <td>{row.chicken_dinners ?? '—'}</td>
                <td>{row.placement_points}</td>
                <td>{row.finish_points}</td>
                <td>{row.total_points}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
