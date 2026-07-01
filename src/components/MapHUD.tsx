import { motion } from 'framer-motion';
import './MapHUD.css';
import {
  LOCATION_STAGES,
  getMapName,
  stageProgress,
} from './mapJourneyTimeline';

type MapHUDProps = {
  progress: number;
  visible?: boolean;
};

const getLocationStatus = (progress: number) => {
  const activeStage = LOCATION_STAGES.find(
    ({ start, end }) => progress >= start && progress <= end,
  );

  if (!activeStage) return { name: '', opacity: 0 };

  const fadeIn = stageProgress(activeStage.start, activeStage.shown, progress);
  const fadeOut =
    1 - stageProgress(activeStage.hiding, activeStage.end, progress);

  return {
    name: activeStage.name,
    opacity: Math.min(fadeIn, fadeOut),
  };
};

export function MapHUD({ progress, visible = true }: MapHUDProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const location = getLocationStatus(clampedProgress);

  return (
    <aside
      className="map-hud"
      style={{ opacity: visible ? 1 : 0 }}
      aria-label="Map journey status"
      aria-hidden={!visible}
    >
      <div className="map-hud__topline">
        <span className="map-hud__map">{getMapName(clampedProgress)}</span>
        <motion.span
          className="map-hud__location"
          initial={false}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          style={{
            opacity: location.opacity,
            transform: `translate3d(0, ${(1 - location.opacity) * 0.45}rem, 0)`,
          }}
        >
          {location.name}
        </motion.span>
      </div>
      <div className="map-hud__track" aria-hidden="true">
        <span
          className="map-hud__progress"
          style={{ transform: `scaleX(${clampedProgress})` }}
        />
      </div>
    </aside>
  );
}
