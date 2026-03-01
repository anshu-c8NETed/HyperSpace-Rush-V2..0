import { useState } from 'react';

const TABS = ['CONTROLS', 'OBJECTIVE', 'PICKUPS', 'TIPS'];

export default function InstructionsScreen({ visible, onStart }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className={`screen inst2-screen ${!visible ? 'hidden' : ''}`}>
      {/* Animated bg */}
      <div className="inst2-bg">
        <div className="inst2-orb inst2-orb--a" />
        <div className="inst2-orb inst2-orb--b" />
        <div className="inst2-orb inst2-orb--c" />
        <div className="inst2-grid" />
        <div className="inst2-scanline" />
      </div>

      <div className="inst2-wrap">

        {/* Header */}
        <div className="inst2-header">
          <div className="inst2-badge">MISSION BRIEFING</div>
          <h1 className="inst2-title">
            <span className="inst2-title-line">HOW TO</span>
            <span className="inst2-title-line inst2-title-accent">PLAY</span>
          </h1>
          <p className="inst2-sub">Pilot your craft through the hyperspace tunnel. Don't die.</p>
        </div>

        {/* Tab bar */}
        <div className="inst2-tabs">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              className={`inst2-tab ${activeTab === i ? 'inst2-tab--active' : ''}`}
              onClick={() => setActiveTab(i)}
            >
              <span className="inst2-tab-num">0{i + 1}</span>
              <span className="inst2-tab-label">{tab}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="inst2-panel">

          {activeTab === 0 && (
            <div className="inst2-content inst2-controls">
              <div className="inst2-ctrl-group">
                <div className="inst2-ctrl-tag">DESKTOP</div>
                <div className="inst2-wasd">
                  <div className="inst2-wasd-row">
                    <div className="inst2-key inst2-key--inactive" />
                    <div className="inst2-key">W</div>
                    <div className="inst2-key inst2-key--inactive" />
                  </div>
                  <div className="inst2-wasd-row">
                    <div className="inst2-key">A</div>
                    <div className="inst2-key">S</div>
                    <div className="inst2-key">D</div>
                  </div>
                  <div className="inst2-ctrl-or">also works with <span>↑ ← ↓ →</span> Arrow Keys</div>
                </div>
                <div className="inst2-spacebar-row">
                  <div className="inst2-key inst2-key--space">SPACE</div>
                  <div className="inst2-key-desc">
                    <span className="inst2-key-action">TURBO BOOST</span>
                    <span className="inst2-key-sub">Hold to accelerate. Drains boost bar.</span>
                  </div>
                </div>
                <div className="inst2-spacebar-row" style={{marginTop: 10}}>
                  <div className="inst2-key inst2-key--esc">ESC</div>
                  <div className="inst2-key-desc">
                    <span className="inst2-key-action">PAUSE</span>
                    <span className="inst2-key-sub">Toggle pause at any time</span>
                  </div>
                </div>
              </div>

              <div className="inst2-ctrl-divider" />

              <div className="inst2-ctrl-group">
                <div className="inst2-ctrl-tag">MOBILE</div>
                <div className="inst2-mobile-layout">
                  <div className="inst2-mobile-item">
                    <div className="inst2-joystick-demo">
                      <div className="inst2-joystick-ring" />
                      <div className="inst2-joystick-dot" />
                    </div>
                    <div className="inst2-mobile-desc">
                      <span className="inst2-key-action">JOYSTICK</span>
                      <span className="inst2-key-sub">Drag to steer your ship</span>
                    </div>
                  </div>
                  <div className="inst2-mobile-item">
                    <div className="inst2-boost-demo">BOOST</div>
                    <div className="inst2-mobile-desc">
                      <span className="inst2-key-action">BOOST BTN</span>
                      <span className="inst2-key-sub">Tap for turbo speed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="inst2-content inst2-objective">
              <div className="inst2-mission-header">
                <div className="inst2-mission-icon"><i className="ri-rocket-2-line" /></div>
                <div>
                  <div className="inst2-mission-title">PRIMARY OBJECTIVE</div>
                  <div className="inst2-mission-sub">Survive the hyperspace tunnel as long as possible</div>
                </div>
              </div>

              <div className="inst2-steps">
                {[
                  { num: '01', icon: 'ri-arrow-right-circle-line', color: 'var(--cyan)', title: 'Race Through the Tunnel', desc: 'Navigate the infinite curved tunnel at increasing speeds.' },
                  { num: '02', icon: 'ri-shield-line', color: 'var(--green)', title: 'Survive as Long as Possible', desc: 'You have 3 shields. Lose them all and it\'s game over.' },
                  { num: '03', icon: 'ri-level-up-line', color: 'var(--yellow)', title: 'Level Up', desc: 'Every 150 points, the speed increases and more obstacles spawn.' },
                  { num: '04', icon: 'ri-trophy-line', color: 'var(--magenta)', title: 'Beat Your High Score', desc: 'Your record is saved. Come back and break it.' },
                ].map((step) => (
                  <div key={step.num} className="inst2-step">
                    <div className="inst2-step-num" style={{ color: step.color, borderColor: step.color }}>{step.num}</div>
                    <div className="inst2-step-icon" style={{ color: step.color }}><i className={step.icon} /></div>
                    <div className="inst2-step-body">
                      <div className="inst2-step-title" style={{ color: step.color }}>{step.title}</div>
                      <div className="inst2-step-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="inst2-content inst2-pickups">
              <div className="inst2-pickup-card inst2-pickup--good">
                <div className="inst2-pickup-orb inst2-pickup-orb--green">
                  <div className="inst2-pickup-core inst2-pickup-core--green" />
                  <div className="inst2-pickup-ring" />
                </div>
                <div className="inst2-pickup-info">
                  <div className="inst2-pickup-name" style={{color:'var(--green)'}}>GREEN GEM</div>
                  <div className="inst2-pickup-desc">Fly through to collect. Each gem rewards bonus points instantly.</div>
                  <div className="inst2-pickup-reward">
                    <span className="inst2-reward-badge inst2-reward-badge--green">+50 PTS</span>
                  </div>
                </div>
                <div className="inst2-pickup-label inst2-pickup-label--green">COLLECT</div>
              </div>

              <div className="inst2-pickup-card inst2-pickup--bad">
                <div className="inst2-pickup-orb inst2-pickup-orb--red">
                  <div className="inst2-pickup-core inst2-pickup-core--red" />
                  <div className="inst2-pickup-spike" />
                </div>
                <div className="inst2-pickup-info">
                  <div className="inst2-pickup-name" style={{color:'var(--red)'}}>RED OBSTACLE</div>
                  <div className="inst2-pickup-desc">Spinning hazard blocks. Hit one and you lose a shield. Hit all three — game over.</div>
                  <div className="inst2-pickup-reward">
                    <span className="inst2-reward-badge inst2-reward-badge--red">-1 SHIELD</span>
                  </div>
                </div>
                <div className="inst2-pickup-label inst2-pickup-label--red">AVOID</div>
              </div>

              <div className="inst2-pickup-card inst2-pickup--boost">
                <div className="inst2-pickup-orb inst2-pickup-orb--orange">
                  <div className="inst2-pickup-bolt"><i className="ri-flashlight-line" /></div>
                </div>
                <div className="inst2-pickup-info">
                  <div className="inst2-pickup-name" style={{color:'var(--orange)'}}>BOOST METER</div>
                  <div className="inst2-pickup-desc">Recharges automatically over time. Activate with SPACE for 2× speed burst.</div>
                  <div className="inst2-pickup-reward">
                    <span className="inst2-reward-badge inst2-reward-badge--orange">2× SPEED</span>
                  </div>
                </div>
                <div className="inst2-pickup-label inst2-pickup-label--orange">USE IT</div>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="inst2-content inst2-tips">
              <div className="inst2-tips-grid">
                {[
                  { icon: 'ri-route-line', color: 'var(--cyan)', tip: 'Hug the center of the tunnel for more reaction time.' },
                  { icon: 'ri-speed-line', color: 'var(--orange)', tip: 'Save boost for tight obstacle clusters, not open stretches.' },
                  { icon: 'ri-eye-line', color: 'var(--green)', tip: 'Look ahead, not at your ship — obstacles spawn further along.' },
                  { icon: 'ri-refresh-line', color: 'var(--magenta)', tip: 'After a hit, you\'re briefly invincible. Use that window to dodge the next.' },
                  { icon: 'ri-bar-chart-line', color: 'var(--yellow)', tip: 'Each level adds more obstacles. Memorize the early pattern.' },
                  { icon: 'ri-heart-pulse-line', color: 'var(--red)', tip: 'With 1 shield left, slow down. Surviving > scoring.' },
                ].map((item, i) => (
                  <div key={i} className="inst2-tip-card">
                    <div className="inst2-tip-icon" style={{ color: item.color, borderColor: item.color }}>
                      <i className={item.icon} />
                    </div>
                    <p className="inst2-tip-text">{item.tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="inst2-footer">
          <div className="inst2-tab-dots">
            {TABS.map((_, i) => (
              <button
                key={i}
                className={`inst2-dot ${activeTab === i ? 'inst2-dot--active' : ''}`}
                onClick={() => setActiveTab(i)}
              />
            ))}
          </div>
          <button className="inst2-start-btn" onClick={onStart}>
            <span className="inst2-btn-icon"><i className="ri-rocket-2-line" /></span>
            <span>LAUNCH GAME</span>
            <div className="inst2-btn-glow" />
          </button>
        </div>

      </div>
    </div>
  );
}