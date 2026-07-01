import { useEffect, useRef, type RefObject } from 'react';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

type VideoScrollOptions = {
  enabled?: boolean;
  lerpFactor?: number;
};

export function useVideoScroll(
  videoRef: RefObject<HTMLVideoElement | null>,
  progress: number,
  fallbackDuration: number,
  options: VideoScrollOptions = {},
) {
  const { enabled = true, lerpFactor = 0.08 } = options;
  const targetTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const duration =
      video && Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : fallbackDuration;

    targetTimeRef.current = (enabled ? clamp(progress) : 0) * duration;
  }, [enabled, fallbackDuration, progress, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    let frameId = 0;

    const syncCurrentTime = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : fallbackDuration;
      const boundedTarget = Math.min(duration, targetTimeRef.current);
      const delta = boundedTarget - video.currentTime;

      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        frameId = requestAnimationFrame(syncCurrentTime);
        return;
      }

      if (Math.abs(delta) > 0.001) {
        if (Math.abs(delta) > 0.18) {
          if (typeof video.fastSeek === 'function') {
            video.fastSeek(boundedTarget);
          } else {
            video.currentTime = boundedTarget;
          }
        } else {
          const nextTime = video.currentTime + delta * lerpFactor;
          if (Math.abs(nextTime - video.currentTime) > 0.0005) {
            video.currentTime = nextTime;
          }
        }
      }

      frameId = requestAnimationFrame(syncCurrentTime);
    };

    const primeVideo = () => {
      const duration =
        Number.isFinite(video.duration) && video.duration > 0
          ? video.duration
          : fallbackDuration;

      targetTimeRef.current = clamp(progress) * duration;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(syncCurrentTime);
    };

    primeVideo();
    video.addEventListener('loadedmetadata', primeVideo);
    video.addEventListener('loadeddata', primeVideo);
    video.addEventListener('canplay', primeVideo);

    return () => {
      video.removeEventListener('loadedmetadata', primeVideo);
      video.removeEventListener('loadeddata', primeVideo);
      video.removeEventListener('canplay', primeVideo);
      cancelAnimationFrame(frameId);
    };
  }, [enabled, fallbackDuration, lerpFactor, progress, videoRef]);
}
