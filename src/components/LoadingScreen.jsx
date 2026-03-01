import { useEffect, useRef } from 'react';

export default function LoadingScreen({ progress, visible }) {
  return (
    <div className={`screen loading-screen ${!visible ? 'hidden' : ''}`}>
      <div className="loading-bg" />
      <div className="loading-hex-grid" />

      <div className="loading-inner">
        <h1 className="loading-logo">
          <span className="logo-text">HYPERSPACE</span>
          <span className="logo-text">RUSH</span>
          <span className="logo-sub">ULTIMATE RACING EXPERIENCE</span>
        </h1>

        <div className="loading-bar-wrap">
          <div
            className="loading-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="loading-percent">
          {Math.floor(progress).toString().padStart(3, '0')}%
        </div>
      </div>
    </div>
  );
}