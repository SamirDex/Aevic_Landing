import type { TeamRecord } from './teamAuth';
import type { StandingsRow } from '../types/tournament';

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

export const matchTeamId = (ocrName: string, teams: TeamRecord[]): string | null => {
  const normalizedOcr = normalizeName(ocrName);

  if (!normalizedOcr) {
    return null;
  }

  const exact = teams.find((team) => normalizeName(team.team_name) === normalizedOcr);

  if (exact?.id) {
    return String(exact.id);
  }

  const partial = teams
    .map((team) => ({
      team,
      normalized: normalizeName(team.team_name),
    }))
    .filter(({ normalized }) => normalized.includes(normalizedOcr) || normalizedOcr.includes(normalized))
    .sort((a, b) => b.normalized.length - a.normalized.length)[0];

  return partial?.team.id ? String(partial.team.id) : null;
};

export const attachTeamIds = (rows: StandingsRow[], teams: TeamRecord[]): StandingsRow[] =>
  rows.map((row) => ({
    ...row,
    team_id: matchTeamId(row.team_name, teams),
  }));

const isHeaderLine = (line: string) =>
  /^(#|rank|team|logo|cd|pp|fp|fq|tp|week|day|league|pubg|mobile|presents|battleg|krafton|india|bdu|thik|esport|aevic)/i.test(
    line,
  ) || (/^[A-Z\s–—-]{14,}$/.test(line) && !/\d\s+\d/.test(line));

/** Sütunlar: # | Komanda | CD | PP | FP (kill) | TP */
export const parseStandingsLine = (line: string): StandingsRow | null => {
  const cleaned = line
    .replace(/[|]/g, ' ')
    .replace(/[—–]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned.length < 5 || isHeaderLine(cleaned)) {
    return null;
  }

  const rankMatch = cleaned.match(/^[\s.#]*(\d{1,2})\b/);

  if (!rankMatch) {
    return null;
  }

  const rank = Number(rankMatch[1]);

  if (rank < 1 || rank > 99) {
    return null;
  }

  const numberTokens = [...cleaned.matchAll(/\b(\d+)\b/g)].map((match) => ({
    value: Number(match[1]),
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
  }));

  const statTokens = numberTokens.filter((token) => token.start >= rankMatch[0].length);

  if (statTokens.length < 3) {
    return null;
  }

  const total_points = statTokens[statTokens.length - 1].value;
  const finish_points = statTokens[statTokens.length - 2].value;
  const placement_points = statTokens[statTokens.length - 3].value;
  const chicken_dinners = statTokens.length >= 4 ? statTokens[statTokens.length - 4].value : null;

  const firstStatStart =
    statTokens.length >= 4 ? statTokens[statTokens.length - 4].start : statTokens[statTokens.length - 3].start;

  let teamSegment = cleaned.slice(rankMatch[0].length, firstStatStart).trim();

  if (teamSegment.endsWith('-') || teamSegment.endsWith('—')) {
    teamSegment = teamSegment.slice(0, -1).trim();
  }

  const team_name = teamSegment.replace(/\s+/g, ' ').trim();

  if (!team_name || team_name.length < 2) {
    return null;
  }

  return {
    rank,
    team_name,
    team_id: null,
    chicken_dinners,
    placement_points,
    finish_points,
    total_points,
  };
};

export const parseStandingsText = (text: string): StandingsRow[] => {
  const rowMap = new Map<number, StandingsRow>();

  const tryAdd = (row: StandingsRow | null) => {
    if (!row) {
      return;
    }

    const existing = rowMap.get(row.rank);

    if (!existing || row.team_name.length >= existing.team_name.length) {
      rowMap.set(row.rank, row);
    }
  };

  for (const rawLine of text.split(/\n+/)) {
    tryAdd(parseStandingsLine(rawLine.trim()));
  }

  const rowPattern =
    /(\d{1,2})\s+([A-Za-z][A-Za-z0-9][A-Za-z0-9\s.\-]{1,32}?)\s+(?:(\d{1,2})\s+)?(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})/g;

  for (const match of text.matchAll(rowPattern)) {
    tryAdd({
      rank: Number(match[1]),
      team_name: match[2].trim(),
      team_id: null,
      chicken_dinners: match[3] ? Number(match[3]) : null,
      placement_points: Number(match[4]),
      finish_points: Number(match[5]),
      total_points: Number(match[6]),
    });
  }

  return [...rowMap.values()].sort((a, b) => a.rank - b.rank);
};

const loadImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Şəkil oxunmadı.'));
    };

    image.src = url;
  });

const enhanceCanvas = (source: HTMLCanvasElement) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(3200, Math.round(source.width * 1.8));
  canvas.height = Math.min(4000, Math.round(source.height * 1.8));
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return source;
  }

  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrast = Math.min(255, Math.max(0, (luminance - 128) * 1.45 + 128));
    data[index] = contrast;
    data[index + 1] = contrast;
    data[index + 2] = contrast;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

const cropToCanvas = (image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number) => {
  const canvas = document.createElement('canvas');
  const scale = Math.min(2.2, 2800 / Math.max(sw, 1));
  canvas.width = Math.max(1, Math.round(sw * scale));
  canvas.height = Math.max(1, Math.round(sh * scale));
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas yaradılmadı.');
  }

  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return enhanceCanvas(canvas);
};

const recognizeCanvas = async (canvas: HTMLCanvasElement, mode: 'sparse' | 'column' = 'sparse') => {
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng');

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: mode === 'column' ? PSM.SINGLE_COLUMN : PSM.SPARSE_TEXT,
    });
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
};

export const extractStandingsFromImage = async (file: File): Promise<StandingsRow[]> => {
  const image = await loadImageFromFile(file);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const midX = Math.floor(width / 2);
  const top = Math.floor(height * 0.14);
  const bottom = Math.floor(height * 0.9);
  const tableHeight = bottom - top;

  const regions = [
    cropToCanvas(image, 0, top, midX - 8, tableHeight),
    cropToCanvas(image, midX + 8, top, width - midX - 8, tableHeight),
    cropToCanvas(image, 0, top, width, tableHeight),
    cropToCanvas(image, 0, 0, width, height),
  ];

  const texts = await Promise.all(
    regions.map((canvas, index) => recognizeCanvas(canvas, index < 2 ? 'column' : 'sparse')),
  );

  const merged = parseStandingsText(texts.join('\n'));

  if (merged.length >= 10) {
    return merged;
  }

  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng');

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });
    const fullCanvas = cropToCanvas(image, 0, 0, width, height);
    const { data } = await worker.recognize(fullCanvas);
    return parseStandingsText([...texts, data.text].join('\n'));
  } finally {
    await worker.terminate();
  }
};
