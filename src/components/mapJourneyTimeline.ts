export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const lerp = (start: number, end: number, progress: number) =>
  start + (end - start) * progress;

export const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

export const easeInOutCubic = (value: number) =>
  value < 0.5
    ? 4 * value * value * value
    : 1 - ((-2 * value + 2) ** 3) / 2;

export const easeOutExpo = (value: number) =>
  value === 1 ? 1 : 1 - 2 ** (-10 * value);

export const easeInOutSine = (value: number) =>
  -(Math.cos(Math.PI * value) - 1) / 2;

export const easeOutBack = (value: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
};

export const stageProgress = (
  start: number,
  end: number,
  progress: number,
  easing?: (value: number) => number,
) => {
  const normalized = clamp01((progress - start) / (end - start));
  return easing ? easing(normalized) : normalized;
};

export type CrossfadeWindow = {
  start: number;
  fadeInEnd: number;
  fadeOutStart: number;
  end: number;
};

export const crossfadeOpacity = (
  progress: number,
  { start, fadeInEnd, fadeOutStart, end }: CrossfadeWindow,
) => {
  if (progress < start || progress > end) return 0;
  if (progress < fadeInEnd) {
    return stageProgress(start, fadeInEnd, progress, easeOutCubic);
  }
  if (progress <= fadeOutStart) return 1;
  return 1 - stageProgress(fadeOutStart, end, progress, easeInOutCubic);
};

export const pulseWithin = (
  progress: number,
  start: number,
  end: number,
  easing: (value: number) => number = easeOutExpo,
) => {
  const local = stageProgress(start, end, progress, easing);
  return Math.sin(Math.PI * local);
};

export const PRELOAD_LEAD = 0.065;

export const TIMELINE = {
  reveal: { start: 0.008, end: 0.052 },
  deadline: { start: 0.96, end: 1 },
  erangel: {
    entry: { start: 0.008, end: 0.062 },
    pngToGlb: { start: 0.056, end: 0.116 },
    loc1Zoom: { start: 0.14, end: 0.19 },
    loc1Video: {
      start: 0.2,
      fadeInEnd: 0.22,
      fadeOutStart: 0.3,
      end: 0.32,
    } satisfies CrossfadeWindow,
    loc1Out: { start: 0.32, end: 0.35 },
    loc2Zoom: { start: 0.36, end: 0.41 },
    loc2Video: {
      start: 0.42,
      fadeInEnd: 0.44,
      fadeOutStart: 0.52,
      end: 0.54,
    } satisfies CrossfadeWindow,
    loc2Out: { start: 0.54, end: 0.57 },
    loc3Zoom: { start: 0.58, end: 0.63 },
    loc3Video: {
      start: 0.64,
      fadeInEnd: 0.66,
      fadeOutStart: 0.74,
      end: 0.76,
    } satisfies CrossfadeWindow,
    loc3Out: { start: 0.76, end: 0.79 },
    loc4Zoom: { start: 0.8, end: 0.85 },
    loc4Video: {
      start: 0.86,
      fadeInEnd: 0.88,
      fadeOutStart: 0.94,
      end: 0.96,
    } satisfies CrossfadeWindow,
  },
} as const;

export const LOCATION_STAGES = [
  {
    name: 'POCHINKI',
    start: TIMELINE.erangel.loc1Video.fadeInEnd,
    shown: 0.234,
    hiding: 0.29,
    end: 0.318,
  },
  {
    name: 'MILITARY BASE',
    start: TIMELINE.erangel.loc2Video.fadeInEnd,
    shown: 0.454,
    hiding: 0.51,
    end: 0.538,
  },
  {
    name: 'GEORGOPOL',
    start: TIMELINE.erangel.loc3Video.fadeInEnd,
    shown: 0.674,
    hiding: 0.73,
    end: 0.758,
  },
  {
    name: 'STALBER',
    start: TIMELINE.erangel.loc4Video.fadeInEnd,
    shown: 0.894,
    hiding: 0.93,
    end: 0.958,
  },
] as const;

export const getMapName = (_progress: number) => 'ERANGEL';
