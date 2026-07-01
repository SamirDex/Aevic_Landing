import { useEffect, useState, type RefObject } from 'react';

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

export function useScrollProgress<T extends HTMLElement>(
  elementRef: RefObject<T | null>,
) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;

    const updateProgress = () => {
      const element = elementRef.current;

      if (!element) return;

      const { top, height } = element.getBoundingClientRect();
      const scrollableDistance = Math.max(1, height - window.innerHeight);
      const nextProgress = clamp(-top / scrollableDistance);

      setProgress((currentProgress) =>
        Math.abs(currentProgress - nextProgress) < 0.0001
          ? currentProgress
          : nextProgress,
      );
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [elementRef]);

  return progress;
}
