import { useRef, useState } from 'react';

export default function MobileControls({ visible, onJoystick, onJoystickEnd, onBoost, onBoostEnd }) {
  const areaRef = useRef(null);
  const [dotActive, setDotActive] = useState(false);
  const [dotPos, setDotPos] = useState({ left: '50%', top: '50%' });
  const originRef = useRef({ x: 0, y: 0 });

  const handleStart = (e) => {
    setDotActive(true);
    const touch = e.touches ? e.touches[0] : e;
    originRef.current = { x: touch.clientX, y: touch.clientY };
    const rect = areaRef.current.getBoundingClientRect();
    setDotPos({ left: touch.clientX - rect.left + 'px', top: touch.clientY - rect.top + 'px' });
  };

  const handleMove = (e) => {
    if (!dotActive) return;
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const dx = touch.clientX - originRef.current.x;
    const dy = touch.clientY - originRef.current.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const max = 50;
    const clamped = Math.min(dist, max);
    const angle = Math.atan2(dy, dx);
    const finalX = originRef.current.x + Math.cos(angle) * clamped;
    const finalY = originRef.current.y + Math.sin(angle) * clamped;
    const rect = areaRef.current.getBoundingClientRect();
    setDotPos({ left: finalX - rect.left + 'px', top: finalY - rect.top + 'px' });
    onJoystick?.(dx, dy);
  };

  const handleEnd = () => {
    setDotActive(false);
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect) setDotPos({ left: rect.width/2 + 'px', top: rect.height/2 + 'px' });
    onJoystickEnd?.();
  };

  return (
    <div className={`mobile-controls ${visible ? 'visible' : ''}`} style={{ pointerEvents: 'none' }}>
      <div
        ref={areaRef}
        className="joystick-zone"
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        style={{ pointerEvents: 'all' }}
      >
        <div
          className={`joystick-dot ${dotActive ? 'active' : ''}`}
          style={{ left: dotPos.left, top: dotPos.top, transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <button
        className="boost-mobile-btn"
        onTouchStart={(e) => { e.preventDefault(); onBoost?.(); }}
        onTouchEnd={(e) => { e.preventDefault(); onBoostEnd?.(); }}
        onTouchCancel={(e) => { e.preventDefault(); onBoostEnd?.(); }}
        onMouseDown={onBoost}
        onMouseUp={onBoostEnd}
        onMouseLeave={onBoostEnd}
        style={{ pointerEvents: 'all' }}
      >
        BOOST
      </button>
    </div>
  );
}