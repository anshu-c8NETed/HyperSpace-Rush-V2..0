import { useState, useRef, useEffect } from 'react';

export function ScorePopup({ id, value, isPositive, x, y }) {
  return (
    <div
      className={`score-popup ${isPositive ? 'positive' : 'negative'}`}
      style={{ left: x, top: y }}
    >
      {isPositive ? `+${value}` : '-1 HP'}
    </div>
  );
}

export default function HUD({ active, score, level, health, boostCharge, boostActive, popups }) {
  const prevScore = useRef(score);
  const [scorePop, setScorePop] = useState(false);

  useEffect(() => {
    if (score !== prevScore.current) {
      setScorePop(true);
      setTimeout(() => setScorePop(false), 300);
      prevScore.current = score;
    }
  }, [score]);

  return (
    <div className={`hud ${active ? 'active' : ''}`}>
      <div className="hud-top">
        {/* Score */}
        <div className="hud-panel">
          <div className="hud-label">SCORE</div>
          <div className={`hud-value ${scorePop ? 'pop' : ''}`}>
            {score.toLocaleString()}
          </div>
        </div>

        {/* Level */}
        <div className="level-badge">
          <div className="hud-label">LEVEL</div>
          <div className="level-num">{level}</div>
        </div>

        {/* Health */}
        <div className="hud-panel">
          <div className="hud-label">SHIELDS</div>
          <div className="health-pips">
            {[0, 1, 2].map(i => (
              <div key={i} className={`health-pip ${i < health ? 'active' : ''}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Boost */}
      <div className="hud-bottom">
        <div className="boost-panel">
          <div className="boost-label">BOOST CHARGE</div>
          <div className="boost-track">
            <div
              className={`boost-fill ${boostActive ? 'boosting' : ''}`}
              style={{ width: `${boostCharge}%` }}
            />
          </div>
        </div>
      </div>

      {/* Score popups */}
      <div className="score-popup-container">
        {popups.map(p => (
          <ScorePopup key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}