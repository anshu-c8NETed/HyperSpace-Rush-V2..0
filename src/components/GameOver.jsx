export default function GameOver({ visible, score = 0, highScore = 0, level = 1, isNewHighScore = false, onRestart, onMenu }) {
    return (
      <div className={`screen gameover-screen ${!visible ? 'hidden' : ''}`}>
        <div className="gameover-bg-lines" />
        <div className="gameover-content">
          <h1 className="gameover-title">GAME OVER</h1>
          <div className="gameover-divider" />
          {isNewHighScore && (
            <div className="go-new-record">★ NEW HIGH SCORE ★</div>
          )}
          <div className="go-stats">
            <div className="go-stat main">
              <div className="go-stat-label">SCORE</div>
              <div className="go-stat-value">{(score || 0).toLocaleString()}</div>
            </div>
            <div className="go-stat">
              <div className="go-stat-label">HIGH SCORE</div>
              <div className="go-stat-value">{(highScore || 0).toLocaleString()}</div>
            </div>
            <div className="go-stat">
              <div className="go-stat-label">LEVEL</div>
              <div className="go-stat-value">{level || 1}</div>
            </div>
          </div>
          <div className="go-actions">
            <button className="go-btn go-btn-primary" onClick={onRestart}>
              PLAY AGAIN
            </button>
            <button className="go-btn go-btn-secondary" onClick={onMenu}>
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    );
  }