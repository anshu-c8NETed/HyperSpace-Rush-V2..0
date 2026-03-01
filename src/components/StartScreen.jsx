export default function StartScreen({ visible, highScore, bestLevel, onStart, onInstructions }) {
    return (
      <div className={`screen start-screen ${!visible ? 'hidden' : ''}`}>
        <div className="start-bg" />
        <div className="start-grid" />
  
        <div className="start-content">
          <h1 className="game-title">
            <span className="game-title-main title-glitch" data-text="HYPERSPACE">HYPERSPACE</span>
            <span className="game-title-sub">RUSH</span>
          </h1>
  
          <div className="stats-panel">
            <div className="stat-box">
              <div className="stat-num">{Math.floor(highScore).toLocaleString()}</div>
              <div className="stat-label">HIGH SCORE</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">{bestLevel}</div>
              <div className="stat-label">BEST LEVEL</div>
            </div>
          </div>
  
          <button className="btn-primary" onClick={onStart}>
            START GAME
          </button>
  
          <button className="btn-secondary" onClick={onInstructions}>
            HOW TO PLAY
          </button>
  
          <div className="controls-hint">
            <span><kbd>WASD</kbd> / <kbd>↑←↓→</kbd> Move</span>
            <span><kbd>SPACE</kbd> Boost</span>
            <span><kbd>ESC</kbd> Pause</span>
          </div>
        </div>
      </div>
    );
  }