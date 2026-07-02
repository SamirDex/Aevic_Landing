import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';
import { Link } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';
import { useVideoScroll } from '../hooks/useVideoScroll';
import { MapHUD } from './MapHUD';
import {
  MAP_ASSETS,
  MODEL_ASSETS,
  VIDEO_ASSETS,
} from './journeyAssets';
import {
  PRELOAD_LEAD,
  TIMELINE,
  clamp01,
  crossfadeOpacity,
  easeInOutCubic,
  easeInOutSine,
  easeOutExpo,
  lerp,
  pulseWithin,
  stageProgress,
} from './mapJourneyTimeline';
import { ResponsiveJourneyImage } from './ResponsiveJourneyImage';
import './MapJourney.css';

type CountdownSegment = {
  value: string;
  label: string;
};

type MapJourneyProps = {
  progress: number;
  countdown: CountdownSegment[];
  countdownPending?: boolean;
};

type CameraPose = {
  position: [number, number, number];
  target: [number, number, number];
};

type ModelCanvasProps = {
  modelUrl: string;
  pose: CameraPose;
};

type ThumbnailBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type PlaneDimensions = {
  width: number;
  depth: number;
};

type NormalizedPoint = {
  u: number;
  v: number;
};

type ImageTransform = {
  scale: number;
  x: number;
  y: number;
};

type TransitionPortalProps = {
  progress: number;
  start: number;
  end: number;
};

type VideoLayerProps = {
  active: boolean;
  className?: string;
  fallbackDuration: number;
  opacity: number;
  preloadReady: boolean;
  revealStart: number;
  revealEnd: number;
  src: string;
  videoProgress: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
};

const mapLayerStyle = (
  opacity: number,
  scale: number,
  translateX = 0,
  translateY = 0,
): CSSProperties => ({
  opacity,
  transform: `translate3d(${translateX}%, ${translateY}%, 0) scale(${scale})`,
});

const mixImageTransform = (
  start: ImageTransform,
  end: ImageTransform,
  progress: number,
): ImageTransform => ({
  scale: lerp(start.scale, end.scale, progress),
  x: lerp(start.x, end.x, progress),
  y: lerp(start.y, end.y, progress),
});

const registeredMapFrameStyle = (
  opacity: number,
  fullscreenProgress: number,
  bounds: ThumbnailBounds,
  options: {
    blurProgress?: number;
    fullscreenScale?: number;
  } = {},
): CSSProperties => {
  const { blurProgress = 0, fullscreenScale = 0.72 } = options;

  return {
    opacity,
    left: `${lerp(bounds.left, 0, fullscreenProgress)}vw`,
    top: `${lerp(bounds.top, 0, fullscreenProgress)}vh`,
    right: 'auto',
    bottom: 'auto',
    width: `${lerp(bounds.width, 100, fullscreenProgress)}vw`,
    height: `${lerp(bounds.height, 100, fullscreenProgress)}vh`,
    transform: `scale(${lerp(1, fullscreenScale, fullscreenProgress)})`,
    filter: `blur(${lerp(0, 3, blurProgress)}px)`,
    transformOrigin: 'center',
  };
};

const videoLayerStyle = (
  opacity: number,
  revealProgress: number,
): CSSProperties => ({
  opacity,
  clipPath: `circle(${lerp(9, 82, revealProgress)}% at 50% 50%)`,
  transform: `scale(${lerp(1.08, 1, revealProgress)})`,
});

const mixVector = (
  start: [number, number, number],
  end: [number, number, number],
  progress: number,
): [number, number, number] => [
  lerp(start[0], end[0], progress),
  lerp(start[1], end[1], progress),
  lerp(start[2], end[2], progress),
];

const mixPose = (
  start: CameraPose,
  end: CameraPose,
  progress: number,
): CameraPose => ({
  position: mixVector(start.position, end.position, progress),
  target: mixVector(start.target, end.target, progress),
});

const getVideoProgress = (
  progress: number,
  start: number,
  end: number,
) => {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return stageProgress(start, end, progress, easeInOutCubic);
};

const planePoint = (
  point: NormalizedPoint,
  dimensions: PlaneDimensions,
): [number, number] => [
  (point.u - 0.5) * dimensions.width,
  (point.v - 0.5) * dimensions.depth,
];

const makeCloseUpPose = (
  point: NormalizedPoint,
  dimensions: PlaneDimensions,
  height: number,
): CameraPose => ({
  position: [planePoint(point, dimensions)[0], height, planePoint(point, dimensions)[1]],
  target: [planePoint(point, dimensions)[0], 0, planePoint(point, dimensions)[1]],
});

const makeImageFocus = (
  point: NormalizedPoint,
  scale: number,
  options: {
    xFactor?: number;
    yFactor?: number;
  } = {},
): ImageTransform => {
  const { xFactor = 0.86, yFactor = 0.68 } = options;

  return {
    scale,
    x: (0.5 - point.u) * scale * 100 * xFactor,
    y: (0.5 - point.v) * scale * 100 * yFactor,
  };
};

const OVERVIEW_TRANSFORM: ImageTransform = {
  scale: 1,
  x: 0,
  y: 0,
};

const ERANGEL_DIMENSIONS: PlaneDimensions = {
  width: 620,
  depth: 383,
};

const ERANGEL_POCHINKI_POINT: NormalizedPoint = {
  u: 0.438,
  v: 0.543,
};

const ERANGEL_MILITARY_POINT: NormalizedPoint = {
  u: 0.577,
  v: 0.854,
};

const ERANGEL_STALBER_POINT: NormalizedPoint = {
  u: 0.807,
  v: 0.186,
};

const ERANGEL_GEORGOPOL_POINT: NormalizedPoint = {
  u: 0.170,
  v: 0.305,
};

const ERANGEL_OVERVIEW: CameraPose = {
  position: [0, 600, 0],
  target: [0, 0, 0],
};

const ERANGEL_POCHINKI = makeCloseUpPose(
  ERANGEL_POCHINKI_POINT,
  ERANGEL_DIMENSIONS,
  94,
);
const ERANGEL_MILITARY = makeCloseUpPose(
  ERANGEL_MILITARY_POINT,
  ERANGEL_DIMENSIONS,
  86,
);
const ERANGEL_GEORGOPOL = makeCloseUpPose(
  ERANGEL_GEORGOPOL_POINT,
  ERANGEL_DIMENSIONS,
  90,
);
const ERANGEL_STALBER = makeCloseUpPose(
  ERANGEL_STALBER_POINT,
  ERANGEL_DIMENSIONS,
  90,
);

const ERANGEL_POCHINKI_TRANSFORM = makeImageFocus(
  ERANGEL_POCHINKI_POINT,
  2.72,
);
const ERANGEL_MILITARY_TRANSFORM = makeImageFocus(
  ERANGEL_MILITARY_POINT,
  3.05,
  { xFactor: 0.82, yFactor: 0.62 },
);
const ERANGEL_GEORGOPOL_TRANSFORM = makeImageFocus(
  ERANGEL_GEORGOPOL_POINT,
  2.85,
  { xFactor: 0.82, yFactor: 0.64 },
);
const ERANGEL_STALBER_TRANSFORM = makeImageFocus(
  ERANGEL_STALBER_POINT,
  2.85,
  { xFactor: 0.8, yFactor: 0.6 },
);
const ERANGEL_THUMBNAIL: ThumbnailBounds = {
  left: 70,
  top: 10,
  width: 24,
  height: 34,
};

function MapModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const fittedModel = useMemo(() => {
    const model = scene.clone(true);
    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const largestHorizontalSide = Math.max(size.x, size.z, 1);
    const scale = 620 / largestHorizontalSide;

    return {
      model,
      scale,
      position: [-center.x, -bounds.min.y, -center.z] as [
        number,
        number,
        number,
      ],
    };
  }, [scene]);

  return (
    <group scale={fittedModel.scale}>
      <primitive
        object={fittedModel.model}
        position={fittedModel.position}
        dispose={null}
      />
    </group>
  );
}

function ScrollCamera({ position, target }: CameraPose) {
  const camera = useThree((state) => state.camera);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, invalidate, position, target]);

  return null;
}

function ModelCanvas({ modelUrl, pose }: ModelCanvasProps) {
  return (
    <Canvas
      className="map-journey__canvas"
      camera={{ fov: 45, near: 0.1, far: 3000, position: [0, 800, 0] }}
      dpr={[1, 1]}
      frameloop="demand"
      gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.58} />
      <directionalLight intensity={1.1} position={[400, 700, 300]} />
      <ScrollCamera {...pose} />
      <Suspense fallback={null}>
        <MapModel url={modelUrl} />
      </Suspense>
    </Canvas>
  );
}

function TransitionPortal({
  progress,
  start,
  end,
}: TransitionPortalProps) {
  const local =
    progress < start || progress > end
      ? 0
      : stageProgress(start, end, progress, easeOutExpo);
  const visible = local > 0.001;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="map-journey__transition-portal"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: local, scale: lerp(0.98, 1.03, local) }}
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <motion.span
            className="map-journey__transition-sweep"
            style={{
              opacity: local,
              transform: `translate3d(${lerp(-6, 6, local)}%, ${lerp(16, -10, local)}%, 0) scale(${lerp(0.94, 1.08, local)})`,
            }}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function VideoLayer({
  active,
  fallbackDuration,
  opacity,
  preloadReady,
  revealStart,
  revealEnd,
  src,
  videoProgress,
  videoRef,
}: VideoLayerProps) {
  useVideoScroll(videoRef, videoProgress, fallbackDuration, {
    enabled: active && preloadReady,
    lerpFactor: 0.09,
  });

  return (
    <motion.video
      ref={videoRef}
      className="map-journey__media"
      src={preloadReady ? src : undefined}
      preload={preloadReady ? 'auto' : 'none'}
      muted
      playsInline
      loop={false}
      disablePictureInPicture
      disableRemotePlayback
      style={videoLayerStyle(
        opacity,
        stageProgress(revealStart, revealEnd, videoProgress, easeOutExpo),
      )}
    />
  );
}

function StaticDeadline({
  countdown,
  countdownPending,
}: {
  countdown: CountdownSegment[];
  countdownPending: boolean;
}) {
  return (
    <div className="map-journey map-journey--static">
      <div className="map-journey__sticky">
        <div className="map-journey__static-backdrop" aria-hidden="true">
          <ResponsiveJourneyImage
            asset={MAP_ASSETS.erangel}
            className="map-journey__media map-journey__media--static"
            draggable={false}
          />
        </div>
        <div className="map-journey__vignette" aria-hidden="true" />
        <div className="map-journey__deadline map-journey__deadline--static">
          <span className="map-journey__deadline-kicker">
            QEYDIYYAT BAGLANIR
          </span>
          <div
            className="map-journey__countdown"
            aria-label="Qeydiyyatın bağlanmasına qalan vaxt"
          >
            {countdown.map((segment) => (
              <span
                className="map-journey__countdown-segment"
                key={segment.label}
              >
                <strong>{segment.value}</strong>
                <small>{segment.label}</small>
              </span>
            ))}
          </div>
          {countdownPending ? (
            <span className="map-journey__deadline-note">
              Tarix tezlikle elan olunacaq
            </span>
          ) : null}
          <Link className="map-journey__deadline-cta" to="/qeydiyyat">
            KOMANDANI QEYDIYYATDAN KECIR
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MapJourney({
  progress,
  countdown,
  countdownPending = false,
}: MapJourneyProps) {
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768,
  );
  const [loadedVideos, setLoadedVideos] = useState({
    loc1: false,
    loc2: false,
    loc3: false,
    loc4: false,
  });
  const [loadedModels, setLoadedModels] = useState({
    erangel: false,
  });

  const loc1Ref = useRef<HTMLVideoElement>(null);
  const loc2Ref = useRef<HTMLVideoElement>(null);
  const loc3Ref = useRef<HTMLVideoElement>(null);
  const loc4Ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rawProgress = clamp01(progress);
  const p = rawProgress;

  useEffect(() => {
    if (rawProgress >= TIMELINE.erangel.loc1Video.start - PRELOAD_LEAD) {
      setLoadedVideos((current) =>
        current.loc1 ? current : { ...current, loc1: true },
      );
    }
    if (rawProgress >= TIMELINE.erangel.loc2Video.start - PRELOAD_LEAD) {
      setLoadedVideos((current) =>
        current.loc2 ? current : { ...current, loc2: true },
      );
    }
    if (rawProgress >= TIMELINE.erangel.loc3Video.start - PRELOAD_LEAD) {
      setLoadedVideos((current) =>
        current.loc3 ? current : { ...current, loc3: true },
      );
    }
    if (rawProgress >= TIMELINE.erangel.loc4Video.start - PRELOAD_LEAD) {
      setLoadedVideos((current) =>
        current.loc4 ? current : { ...current, loc4: true },
      );
    }
  }, [rawProgress]);

  useEffect(() => {
    if (isMobile || reducedMotion) return;

    if (
      rawProgress >= TIMELINE.erangel.pngToGlb.start - PRELOAD_LEAD &&
      !loadedModels.erangel
    ) {
      useGLTF.preload(MODEL_ASSETS.erangel);
      setLoadedModels((current) =>
        current.erangel ? current : { ...current, erangel: true },
      );
    }
  }, [isMobile, loadedModels.erangel, rawProgress, reducedMotion]);

  if (reducedMotion) {
    return (
      <StaticDeadline
        countdown={countdown}
        countdownPending={countdownPending}
      />
    );
  }

  const journeyReveal = stageProgress(
    TIMELINE.reveal.start,
    TIMELINE.reveal.end,
    p,
    easeOutExpo,
  );
  const deadlineProgress = stageProgress(
    TIMELINE.deadline.start,
    TIMELINE.deadline.end,
    p,
    easeOutExpo,
  );

  const loc1Opacity = crossfadeOpacity(p, TIMELINE.erangel.loc1Video);
  const loc2Opacity = crossfadeOpacity(p, TIMELINE.erangel.loc2Video);
  const loc3Opacity = crossfadeOpacity(p, TIMELINE.erangel.loc3Video);
  const loc4Opacity = crossfadeOpacity(p, TIMELINE.erangel.loc4Video);

  const erangelVideoCover = Math.max(loc1Opacity, loc2Opacity, loc3Opacity, loc4Opacity);

  const erangelEntryProgress = stageProgress(
    TIMELINE.erangel.entry.start,
    TIMELINE.erangel.entry.end,
    p,
    easeOutExpo,
  );
  const erangelExitProgress = stageProgress(
    TIMELINE.deadline.start,
    TIMELINE.deadline.end,
    p,
    easeInOutCubic,
  );
  const erangelFullscreenProgress =
    p < TIMELINE.deadline.start
      ? erangelEntryProgress
      : clamp01(1 - erangelExitProgress);
  const erangelMorphProgress = stageProgress(
    TIMELINE.erangel.pngToGlb.start,
    TIMELINE.erangel.pngToGlb.end,
    p,
    easeInOutCubic,
  );
  const erangelBaseOpacity =
    journeyReveal *
    (1 - stageProgress(TIMELINE.deadline.start, TIMELINE.deadline.end, p));
  const erangelIntroPngOpacity = journeyReveal * (1 - erangelMorphProgress);
  const erangelExitPngOpacity =
    stageProgress(
      TIMELINE.erangel.loc2Out.start,
      TIMELINE.deadline.start,
      p,
      easeInOutCubic,
    ) *
    (1 -
      stageProgress(
        TIMELINE.deadline.end,
        TIMELINE.deadline.end + 0.02,
        p,
        easeInOutCubic,
      ));
  const erangelImageOpacity = isMobile
    ? erangelBaseOpacity * (1 - erangelVideoCover)
    : Math.max(erangelIntroPngOpacity, erangelExitPngOpacity);
  const erangelModelOpacity =
    erangelMorphProgress *
    (1 -
      stageProgress(
        TIMELINE.deadline.start - 0.02,
        TIMELINE.deadline.start,
        p,
        easeInOutCubic,
      )) *
    (1 - erangelVideoCover);


  const mapMorphProgress = pulseWithin(
    p,
    TIMELINE.erangel.pngToGlb.start,
    TIMELINE.erangel.pngToGlb.end,
  );

  const loc1Progress = getVideoProgress(
    p,
    TIMELINE.erangel.loc1Video.start,
    TIMELINE.erangel.loc1Video.fadeOutStart,
  );
  const loc2Progress = getVideoProgress(
    p,
    TIMELINE.erangel.loc2Video.start,
    TIMELINE.erangel.loc2Video.fadeOutStart,
  );
  const loc3Progress = getVideoProgress(
    p,
    TIMELINE.erangel.loc3Video.start,
    TIMELINE.erangel.loc3Video.fadeOutStart,
  );
  const loc4Progress = getVideoProgress(
    p,
    TIMELINE.erangel.loc4Video.start,
    TIMELINE.erangel.loc4Video.fadeOutStart,
  );

  const erangelPose =
    p < TIMELINE.erangel.pngToGlb.end
      ? ERANGEL_OVERVIEW
      : p < TIMELINE.erangel.loc1Zoom.start
        ? ERANGEL_OVERVIEW
        : p < TIMELINE.erangel.loc1Zoom.end
          ? mixPose(
            ERANGEL_OVERVIEW,
            ERANGEL_POCHINKI,
            stageProgress(
              TIMELINE.erangel.loc1Zoom.start,
              TIMELINE.erangel.loc1Zoom.end,
              p,
              easeInOutSine,
            ),
          )
        : p < TIMELINE.erangel.loc1Out.start
          ? ERANGEL_POCHINKI
          : p < TIMELINE.erangel.loc1Out.end
            ? mixPose(
                ERANGEL_POCHINKI,
                ERANGEL_OVERVIEW,
                stageProgress(
                  TIMELINE.erangel.loc1Out.start,
                  TIMELINE.erangel.loc1Out.end,
                  p,
                  easeInOutCubic,
                ),
              )
            : p < TIMELINE.erangel.loc2Zoom.start
              ? ERANGEL_OVERVIEW
              : p < TIMELINE.erangel.loc2Zoom.end
                ? mixPose(
                    ERANGEL_OVERVIEW,
                    ERANGEL_MILITARY,
                    stageProgress(
                      TIMELINE.erangel.loc2Zoom.start,
                      TIMELINE.erangel.loc2Zoom.end,
                      p,
                      easeInOutSine,
                    ),
                  )
              : p < TIMELINE.erangel.loc2Out.start
                ? ERANGEL_MILITARY
              : p < TIMELINE.erangel.loc2Out.end
                  ? mixPose(
                      ERANGEL_MILITARY,
                      ERANGEL_OVERVIEW,
                      stageProgress(
                        TIMELINE.erangel.loc2Out.start,
                        TIMELINE.erangel.loc2Out.end,
                        p,
                        easeInOutCubic,
                      ),
                    )
                  : p < TIMELINE.erangel.loc3Zoom.start
                    ? ERANGEL_OVERVIEW
                    : p < TIMELINE.erangel.loc3Zoom.end
                      ? mixPose(
                          ERANGEL_OVERVIEW,
                          ERANGEL_GEORGOPOL,
                          stageProgress(
                            TIMELINE.erangel.loc3Zoom.start,
                            TIMELINE.erangel.loc3Zoom.end,
                            p,
                            easeInOutSine,
                          ),
                        )
                      : p < TIMELINE.erangel.loc3Out.start
                        ? ERANGEL_GEORGOPOL
                        : p < TIMELINE.erangel.loc3Out.end
                          ? mixPose(
                              ERANGEL_GEORGOPOL,
                              ERANGEL_OVERVIEW,
                              stageProgress(
                                TIMELINE.erangel.loc3Out.start,
                                TIMELINE.erangel.loc3Out.end,
                                p,
                                easeInOutCubic,
                              ),
                            )
                          : p < TIMELINE.erangel.loc4Zoom.start
                            ? ERANGEL_OVERVIEW
                            : p < TIMELINE.erangel.loc4Zoom.end
                              ? mixPose(
                                  ERANGEL_OVERVIEW,
                                  ERANGEL_STALBER,
                                  stageProgress(
                                    TIMELINE.erangel.loc4Zoom.start,
                                    TIMELINE.erangel.loc4Zoom.end,
                                    p,
                                    easeInOutSine,
                                  ),
                                )
                              : p < TIMELINE.deadline.start
                                ? ERANGEL_STALBER
                                : ERANGEL_OVERVIEW;

  const erangelMobileTransform =
    p < TIMELINE.erangel.loc1Zoom.start
      ? OVERVIEW_TRANSFORM
      : p < TIMELINE.erangel.loc1Zoom.end
        ? mixImageTransform(
            OVERVIEW_TRANSFORM,
            ERANGEL_POCHINKI_TRANSFORM,
            stageProgress(
              TIMELINE.erangel.loc1Zoom.start,
              TIMELINE.erangel.loc1Zoom.end,
              p,
              easeInOutCubic,
            ),
          )
        : p < TIMELINE.erangel.loc1Out.start
          ? ERANGEL_POCHINKI_TRANSFORM
          : p < TIMELINE.erangel.loc1Out.end
            ? mixImageTransform(
                ERANGEL_POCHINKI_TRANSFORM,
                OVERVIEW_TRANSFORM,
                stageProgress(
                  TIMELINE.erangel.loc1Out.start,
                  TIMELINE.erangel.loc1Out.end,
                  p,
                  easeInOutCubic,
                ),
              )
            : p < TIMELINE.erangel.loc2Zoom.start
              ? OVERVIEW_TRANSFORM
              : p < TIMELINE.erangel.loc2Zoom.end
                ? mixImageTransform(
                    OVERVIEW_TRANSFORM,
                    ERANGEL_MILITARY_TRANSFORM,
                    stageProgress(
                      TIMELINE.erangel.loc2Zoom.start,
                      TIMELINE.erangel.loc2Zoom.end,
                      p,
                      easeInOutCubic,
                    ),
                  )
                : p < TIMELINE.erangel.loc2Out.start
                  ? ERANGEL_MILITARY_TRANSFORM
                : p < TIMELINE.erangel.loc2Out.end
                    ? mixImageTransform(
                        ERANGEL_MILITARY_TRANSFORM,
                        OVERVIEW_TRANSFORM,
                        stageProgress(
                          TIMELINE.erangel.loc2Out.start,
                          TIMELINE.erangel.loc2Out.end,
                          p,
                          easeInOutCubic,
                        ),
                      )
                    : p < TIMELINE.erangel.loc3Zoom.start
                      ? OVERVIEW_TRANSFORM
                      : p < TIMELINE.erangel.loc3Zoom.end
                        ? mixImageTransform(
                            OVERVIEW_TRANSFORM,
                            ERANGEL_GEORGOPOL_TRANSFORM,
                            stageProgress(
                              TIMELINE.erangel.loc3Zoom.start,
                              TIMELINE.erangel.loc3Zoom.end,
                              p,
                              easeInOutCubic,
                            ),
                          )
                        : p < TIMELINE.erangel.loc3Out.start
                          ? ERANGEL_GEORGOPOL_TRANSFORM
                          : p < TIMELINE.erangel.loc3Out.end
                            ? mixImageTransform(
                                ERANGEL_GEORGOPOL_TRANSFORM,
                                OVERVIEW_TRANSFORM,
                                stageProgress(
                                  TIMELINE.erangel.loc3Out.start,
                                  TIMELINE.erangel.loc3Out.end,
                                  p,
                                  easeInOutCubic,
                                ),
                              )
                            : p < TIMELINE.erangel.loc4Zoom.start
                              ? OVERVIEW_TRANSFORM
                              : p < TIMELINE.erangel.loc4Zoom.end
                                ? mixImageTransform(
                                    OVERVIEW_TRANSFORM,
                                    ERANGEL_STALBER_TRANSFORM,
                                    stageProgress(
                                      TIMELINE.erangel.loc4Zoom.start,
                                      TIMELINE.erangel.loc4Zoom.end,
                                      p,
                                      easeInOutCubic,
                                    ),
                                  )
                                : p < TIMELINE.deadline.start
                                  ? ERANGEL_STALBER_TRANSFORM
                                  : OVERVIEW_TRANSFORM;

  const deadlineOffset = lerp(104, 0, deadlineProgress);
  const shouldShowErangelModel =
    !isMobile &&
    loadedModels.erangel &&
    erangelModelOpacity > 0.01 &&
    p >= TIMELINE.erangel.pngToGlb.start &&
    p < TIMELINE.deadline.start;

  return (
    <motion.div
      className="map-journey"
      aria-label="Tournament map journey"
      initial={false}
      style={{ opacity: journeyReveal }}
    >
      <div className="map-journey__sticky">
        <div className="map-journey__vignette" aria-hidden="true" />

        <motion.div
          className="map-journey__morph-sheen"
          aria-hidden="true"
          style={{
            opacity: mapMorphProgress,
            transform: `scale(${lerp(0.84, 1.16, mapMorphProgress)})`,
          }}
        />

        <TransitionPortal
          progress={p}
          start={TIMELINE.erangel.loc1Video.start - 0.006}
          end={TIMELINE.erangel.loc1Video.fadeInEnd + 0.006}
        />
        <TransitionPortal
          progress={p}
          start={TIMELINE.erangel.loc2Video.start - 0.006}
          end={TIMELINE.erangel.loc2Video.fadeInEnd + 0.006}
        />
        <TransitionPortal
          progress={p}
          start={TIMELINE.erangel.loc3Video.start - 0.006}
          end={TIMELINE.erangel.loc3Video.fadeInEnd + 0.006}
        />
        <TransitionPortal
          progress={p}
          start={TIMELINE.erangel.loc4Video.start - 0.006}
          end={TIMELINE.erangel.loc4Video.fadeInEnd + 0.006}
        />

        <motion.div
          className="map-journey__media-frame map-journey__media-frame--registered"
          style={
            isMobile
              ? mapLayerStyle(
                  erangelImageOpacity,
                  erangelMobileTransform.scale,
                  erangelMobileTransform.x,
                  erangelMobileTransform.y,
                )
              : registeredMapFrameStyle(
                  erangelImageOpacity,
                  erangelFullscreenProgress,
                  ERANGEL_THUMBNAIL,
                  { blurProgress: erangelMorphProgress },
                )
          }
        >
          <ResponsiveJourneyImage
            asset={MAP_ASSETS.erangel}
            alt=""
            className="map-journey__media map-journey__media--registered"
            draggable={false}
          />
        </motion.div>

        {shouldShowErangelModel ? (
          <motion.div
            className="map-journey__model"
            style={{
              opacity: erangelModelOpacity,
              transform: `scale(${lerp(0.985, 1, erangelMorphProgress)})`,
            }}
            aria-hidden="true"
          >
            <ModelCanvas modelUrl={MODEL_ASSETS.erangel} pose={erangelPose} />
          </motion.div>
        ) : null}

        <VideoLayer
          active={loc1Opacity > 0.01}
          fallbackDuration={10}
          opacity={loc1Opacity}
          preloadReady={loadedVideos.loc1}
          revealStart={0}
          revealEnd={1}
          src={VIDEO_ASSETS.pochinki}
          videoProgress={loc1Progress}
          videoRef={loc1Ref}
        />
        <VideoLayer
          active={loc2Opacity > 0.01}
          fallbackDuration={10}
          opacity={loc2Opacity}
          preloadReady={loadedVideos.loc2}
          revealStart={0}
          revealEnd={1}
          src={VIDEO_ASSETS.military}
          videoProgress={loc2Progress}
          videoRef={loc2Ref}
        />
        <VideoLayer
          active={loc3Opacity > 0.01}
          fallbackDuration={10}
          opacity={loc3Opacity}
          preloadReady={loadedVideos.loc3}
          revealStart={0}
          revealEnd={1}
          src={VIDEO_ASSETS.georgopol}
          videoProgress={loc3Progress}
          videoRef={loc3Ref}
        />
        <VideoLayer
          active={loc4Opacity > 0.01}
          fallbackDuration={10}
          opacity={loc4Opacity}
          preloadReady={loadedVideos.loc4}
          revealStart={0}
          revealEnd={1}
          src={VIDEO_ASSETS.stalber}
          videoProgress={loc4Progress}
          videoRef={loc4Ref}
        />

        <motion.div
          className="map-journey__deadline"
          initial={false}
          style={{
            opacity: deadlineProgress,
            visibility: deadlineProgress > 0 ? 'visible' : 'hidden',
            transform: `translate3d(0, ${deadlineOffset}%, 0)`,
            pointerEvents: deadlineProgress > 0.86 ? 'auto' : 'none',
          }}
        >
          <span className="map-journey__deadline-kicker">
            QEYDIYYAT BAGLANIR
          </span>
          <div
            className="map-journey__countdown"
            aria-label="Qeydiyyatın bağlanmasına qalan vaxt"
          >
            {countdown.map((segment) => (
              <span
                className="map-journey__countdown-segment"
                key={segment.label}
              >
                <strong>{segment.value}</strong>
                <small>{segment.label}</small>
              </span>
            ))}
          </div>
          {countdownPending ? (
            <span className="map-journey__deadline-note">
              Tarix tezlikle elan olunacaq
            </span>
          ) : null}
          <Link
            className="map-journey__deadline-cta"
            to="/qeydiyyat"
            tabIndex={deadlineProgress > 0.86 ? 0 : -1}
          >
            KOMANDANI QEYDIYYATDAN KECIR
          </Link>
        </motion.div>
      </div>

      <MapHUD progress={p} visible={journeyReveal > 0.98 && p < 1} />
    </motion.div>
  );
}
