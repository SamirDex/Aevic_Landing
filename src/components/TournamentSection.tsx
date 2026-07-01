import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { fetchTournament } from '../lib/tournamentApi';
import { createDefaultTournamentState, normalizeTournamentState } from '../lib/tournamentSchedule';
import type { TournamentState } from '../types/tournament';

export function TournamentSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const [tournament, setTournament] = useState<TournamentState>(() =>
    normalizeTournamentState(createDefaultTournamentState()),
  );

  useEffect(() => {
    let mounted = true;
    fetchTournament()
      .then((data) => {
        if (mounted) {
          setTournament(normalizeTournamentState(data));
        }
      })
      .catch(() => {
        if (mounted) {
          setTournament(normalizeTournamentState(createDefaultTournamentState()));
        }
      });
    return () => { mounted = false; };
  }, []);

  // Section activation based on scroll
  const sectionActivation = useSpring(useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 1]), {
    stiffness: 50,
    damping: 20,
  });

  // Progressive animation for tournament elements
  const standingsActivation = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const scheduleActivation = useTransform(scrollYProgress, [0.4, 0.7], [0, 1]);
  const prizeActivation = useTransform(scrollYProgress, [0.5, 0.8], [0, 1]);

  const schedule = tournament.schedule || [];
  const prizePool = '10,000 AZN'; // Default prize pool

  return (
    <section ref={sectionRef} className="tournament-section" id="tournament">
      <div className="section-frame">
        <motion.div
          className="tournament-header"
          style={{ opacity: sectionActivation }}
        >
          <span className="section-kicker">Tournament</span>
          <h2>Command Center</h2>
          <p>Track the competition in real-time</p>
        </motion.div>

        <div className="tournament-grid">
          {/* Prize Pool */}
          <motion.div
            className="tournament-card tournament-card--prize"
            style={{ opacity: prizeActivation }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="tournament-card-icon">💰</div>
            <h3>Prize Pool</h3>
            <motion.div
              className="prize-amount"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              {prizePool}
            </motion.div>
            <p>Total rewards for champions</p>
          </motion.div>

          {/* Schedule */}
          <motion.div
            className="tournament-card tournament-card--schedule"
            style={{ opacity: scheduleActivation }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="tournament-card-icon">📅</div>
            <h3>Match Schedule</h3>
            <div className="schedule-list">
              {schedule.slice(0, 3).map((day, index) => (
                <motion.div
                  key={day.day_index}
                  className="schedule-item"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <span className="schedule-day">{day.label}</span>
                  <span className="schedule-time">{day.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Standings Preview */}
          <motion.div
            className="tournament-card tournament-card--standings"
            style={{ opacity: standingsActivation }}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="tournament-card-icon">🏆</div>
            <h3>Live Standings</h3>
            <div className="standings-preview">
              {tournament.days.slice(0, 3).map((day, index) => (
                <motion.div
                  key={day.day_index}
                  className="standings-row"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <span className="standings-rank">#{index + 1}</span>
                  <span className="standings-name">Team {index + 1}</span>
                  <span className="standings-points">{day.matches.length * 10}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
