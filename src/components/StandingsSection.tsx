import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

export function StandingsSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Section activation based on scroll
  const sectionActivation = useSpring(useTransform(scrollYProgress, [0.2, 0.5, 0.8], [0, 1, 1]), {
    stiffness: 50,
    damping: 20,
  });

  // Progressive row animations
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const unsubscribe = sectionActivation.on('change', (latest) => {
      const rowCount = Math.floor(latest * 10);
      setVisibleRows(rowCount);
    });
    return () => unsubscribe();
  }, [sectionActivation]);

  // Mock standings data
  const standings = [
    { rank: 1, team: 'Phoenix Rising', points: 285, wins: 12, losses: 3 },
    { rank: 2, team: 'Dragon Force', points: 270, wins: 11, losses: 4 },
    { rank: 3, team: 'Thunder Strike', points: 255, wins: 10, losses: 5 },
    { rank: 4, team: 'Shadow Elite', points: 240, wins: 9, losses: 6 },
    { rank: 5, team: 'Crystal Storm', points: 225, wins: 8, losses: 7 },
    { rank: 6, team: 'Iron Legion', points: 210, wins: 7, losses: 8 },
    { rank: 7, team: 'Frost Bite', points: 195, wins: 6, losses: 9 },
    { rank: 8, team: 'Blaze Squad', points: 180, wins: 5, losses: 10 },
  ];

  return (
    <section ref={sectionRef} className="standings-section" id="standings">
      <div className="section-frame">
        <motion.div
          className="standings-header"
          style={{ opacity: sectionActivation }}
        >
          <span className="section-kicker">Standings</span>
          <h2>Leaderboard</h2>
          <p>Current tournament rankings and team performance</p>
        </motion.div>

        <motion.div
          className="standings-table"
          style={{ opacity: sectionActivation }}
        >
          <div className="standings-table-header">
            <span>Rank</span>
            <span>Team</span>
            <span>Points</span>
            <span>W-L</span>
          </div>

          <div className="standings-table-body">
            <AnimatePresence>
              {standings.slice(0, visibleRows).map((team, index) => (
                <motion.div
                  key={team.rank}
                  className="standings-row"
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 50, opacity: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  style={{
                    background: index < 3 
                      ? `linear-gradient(90deg, rgba(243, 196, 80, ${0.1 - index * 0.02}), transparent)` 
                      : 'transparent',
                  }}
                >
                  <motion.span
                    className="standings-rank"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    style={{ 
                      color: index === 0 ? '#F3C450' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#F0EAD6',
                    }}
                  >
                    #{team.rank}
                  </motion.span>
                  <span className="standings-team">{team.team}</span>
                  <motion.span
                    className="standings-points"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.5, delay: index * 0.05 + 0.1 }}
                  >
                    {team.points}
                  </motion.span>
                  <span className="standings-record">{team.wins}-{team.losses}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        <motion.div
          className="standings-footer"
          style={{ opacity: sectionActivation }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Link to="/liderlik" className="button button--primary">
            View Full Standings
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
