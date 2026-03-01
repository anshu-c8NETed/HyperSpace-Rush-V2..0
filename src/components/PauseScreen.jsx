export default function PauseScreen({ visible }) {
    return (
      <div className={`screen pause-screen ${!visible ? 'hidden' : ''}`}>
        <h1 className="pause-title">PAUSED</h1>
        <p className="pause-hint">Press <strong style={{color:'var(--cyan)'}}>ESC</strong> to resume</p>
      </div>
    );
  }