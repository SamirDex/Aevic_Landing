import type { TeamRecord } from './teamAuth';
import type { StandingsRow, StandingsSnapshot } from '../types/tournament';

const POSTER_SIZE = 1200;
const DEFAULT_SHARECARD_BG = '/aevic-sharecard-bg.webp';

const BRAND = {
  gold: '#E8B84A',
  copy: '#FFFFFF',
  muted: '#9A94A8',
  cardDark: 'rgba(8, 4, 14, 0.72)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Şəkil yüklənmədi.'));
    image.src = src;
  });

const canvasToBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Poster yaradılmadı.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });

type StatVariant = 'purple' | 'dark' | 'gold';

const drawStatCard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: string,
  variant: StatVariant,
) => {
  const radius = 22;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);

  if (variant === 'purple') {
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, 'rgba(123, 63, 228, 0.92)');
    gradient.addColorStop(1, 'rgba(61, 24, 120, 0.92)');
    ctx.fillStyle = gradient;
    ctx.fill();
  } else if (variant === 'gold') {
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, 'rgba(243, 196, 80, 0.95)');
    gradient.addColorStop(1, 'rgba(232, 148, 58, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fill();
  } else {
    ctx.fillStyle = BRAND.cardDark;
    ctx.fill();
    ctx.strokeStyle = BRAND.cardBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.clip();

  const labelColor = variant === 'gold' ? '#1A1208' : BRAND.gold;
  const valueColor = variant === 'gold' ? '#1A1208' : BRAND.copy;

  ctx.textAlign = 'center';
  ctx.fillStyle = labelColor;
  ctx.font = '700 22px Orbitron, sans-serif';
  ctx.fillText(label, x + width / 2, y + 44);

  ctx.fillStyle = valueColor;
  ctx.font = '800 64px Orbitron, sans-serif';
  ctx.fillText(value, x + width / 2, y + 118);

  ctx.restore();
};

const drawPosterBackground = async (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundUrl: string,
) => {
  const radius = 36;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, radius);
  ctx.clip();

  // Tam qara background
  ctx.fillStyle = '#050308';
  ctx.fillRect(0, 0, width, height);

  // Phoenix şəklini SAĞ tərəfə yerləşdir
  try {
    const background = await loadImage(backgroundUrl);
    const scale = height / background.height;
    const drawWidth = background.width * scale;
    const drawHeight = height;
    const offsetX = width - drawWidth;
    ctx.drawImage(background, offsetX, 0, drawWidth, drawHeight);
  } catch {
    const gradient = ctx.createRadialGradient(width * 0.85, height * 0.35, 50, width * 0.8, height * 0.5, 500);
    gradient.addColorStop(0, 'rgba(255, 160, 30, 0.5)');
    gradient.addColorStop(0.4, 'rgba(138, 43, 226, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Sol→Sağ gradient overlay
  const shade = ctx.createLinearGradient(0, 0, width, 0);
  shade.addColorStop(0, 'rgba(5, 3, 10, 1.0)');
  shade.addColorStop(0.42, 'rgba(5, 3, 10, 0.92)');
  shade.addColorStop(0.58, 'rgba(5, 3, 10, 0.55)');
  shade.addColorStop(0.75, 'rgba(5, 3, 10, 0.15)');
  shade.addColorStop(1, 'rgba(5, 3, 10, 0.0)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();

  ctx.strokeStyle = 'rgba(243, 196, 80, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(1, 1, width - 2, height - 2, radius);
  ctx.stroke();
};

const LOGO_SIZE = 96;

const drawTeamLogo = async (ctx: CanvasRenderingContext2D, x: number, y: number, logoUrl: string) => {
  const size = LOGO_SIZE;
  const logo = await loadImage(logoUrl);

  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(8, 4, 14, 0.9)';
  ctx.fill();
  ctx.strokeStyle = BRAND.gold;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.clip();

  const side = Math.min(logo.width, logo.height);
  const sx = (logo.width - side) / 2;
  const sy = (logo.height - side) / 2;
  ctx.drawImage(logo, sx, sy, side, side, x + 6, y + 6, size - 12, size - 12);
  ctx.restore();
};

export type TeamPosterOptions = {
  team: TeamRecord;
  statusLabel: string;
  snapshot?: StandingsSnapshot | null;
  sharecardBackgroundUrl?: string | null;
};

export const renderTeamPosterSharecard = async ({
  team,
  statusLabel,
  snapshot,
  sharecardBackgroundUrl,
}: TeamPosterOptions) => {
  const teamRow = snapshot?.rows.find((row) => row.team_id === String(team.id)) ?? null;
  const results = Array.isArray(team.match_results) ? team.match_results : [];

  const cdLabel =
    teamRow?.chicken_dinners === null || teamRow?.chicken_dinners === undefined ? '—' : String(teamRow.chicken_dinners);
  const ppLabel = teamRow?.placement_points === undefined ? '—' : String(teamRow.placement_points);
  const fpLabel =
    teamRow?.finish_points === undefined
      ? results.length
        ? String(results.reduce((sum, r) => sum + (typeof r.kills === 'number' ? r.kills : 0), 0))
        : '—'
      : String(teamRow.finish_points);
  const tpLabel =
    teamRow?.total_points === undefined
      ? results.length
        ? String(results.reduce((sum, r) => sum + (typeof r.total_points === 'number' ? r.total_points : 0), 0))
        : '—'
      : String(teamRow.total_points);

  const canvas = document.createElement('canvas');
  canvas.width = POSTER_SIZE;
  canvas.height = POSTER_SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas yaradılmadı.');
  }

  const backgroundUrl = sharecardBackgroundUrl || DEFAULT_SHARECARD_BG;
  await drawPosterBackground(ctx, POSTER_SIZE, POSTER_SIZE, backgroundUrl);

  const padX = 80;
  let cursorY = 88;

  ctx.fillStyle = BRAND.gold;
  ctx.font = '700 24px Orbitron, sans-serif';
  ctx.fillText('RESULT SHARE CARD', padX, cursorY);
  cursorY += 56;

  const headerRowY = cursorY;
  let teamNameX = padX;
  let headerBottom = headerRowY + 78;

  if (team.logo_url) {
    try {
      await drawTeamLogo(ctx, padX, headerRowY, team.logo_url);
      teamNameX = padX + LOGO_SIZE + 28;
      headerBottom = headerRowY + LOGO_SIZE;
    } catch {
      teamNameX = padX;
    }
  }

  ctx.fillStyle = BRAND.copy;
  ctx.font = '800 80px Orbitron, sans-serif';
  const teamTitle = team.team_name.length > 14 ? `${team.team_name.slice(0, 14)}…` : team.team_name;
  const teamNameBaseline = team.logo_url ? headerRowY + LOGO_SIZE * 0.68 : headerRowY + 64;
  ctx.fillText(teamTitle, teamNameX, teamNameBaseline);
  headerBottom = Math.max(headerBottom, teamNameBaseline + 12);

  const weekDay = snapshot ? `${snapshot.week_label} • ${snapshot.day_label}` : 'Nəticə gözlənilir';
  const rankLine = teamRow ? `Sıra #${String(teamRow.rank).padStart(2, '0')} • ` : '';
  const metaY = headerBottom + 28;
  ctx.fillStyle = BRAND.muted;
  ctx.font = '500 28px Raleway, sans-serif';
  ctx.fillText(`${rankLine}${statusLabel} / ${weekDay}`, padX, metaY);
  cursorY = metaY + 56;

  const cardGap = 24;
  const cardHeight = 196;
  const cardWidth = (600 - padX - cardGap) / 2;
  const cardY = cursorY;

  drawStatCard(ctx, padX, cardY, cardWidth, cardHeight, 'TOTAL POINTS', tpLabel, 'purple');
  drawStatCard(ctx, padX + cardWidth + cardGap, cardY, cardWidth, cardHeight, 'TOTAL KILLS', fpLabel, 'dark');
  drawStatCard(ctx, padX, cardY + cardHeight + cardGap, cardWidth, cardHeight, 'PLACEMENT PTS', ppLabel, 'dark');
  drawStatCard(ctx, padX + cardWidth + cardGap, cardY + cardHeight + cardGap, cardWidth, cardHeight, 'CHICKEN DINNER', cdLabel, 'gold');

  const playersY = cardY + cardHeight * 2 + cardGap + 56;
  ctx.fillStyle = BRAND.gold;
  ctx.font = '700 24px Orbitron, sans-serif';
  ctx.fillText('PLAYERS', padX, playersY);

  ctx.fillStyle = BRAND.copy;
  ctx.font = '500 32px Raleway, sans-serif';
  const roster = [team.player1_ign, team.player2_ign, team.player3_ign, team.player4_ign, team.player5_ign]
    .filter(Boolean)
    .join('  •  ');
  ctx.fillText(roster.length > 52 ? `${roster.slice(0, 52)}…` : roster, padX, playersY + 48);

  ctx.fillStyle = BRAND.muted;
  ctx.font = '500 20px Raleway, sans-serif';
  ctx.fillText('Aevic Esports', padX, POSTER_SIZE - 56);
  ctx.fillStyle = BRAND.gold;
  ctx.font = '700 18px Orbitron, sans-serif';
  ctx.fillText('AD AETERNUM VICTORIAM', padX, POSTER_SIZE - 28);

  return canvasToBlob(canvas);
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
