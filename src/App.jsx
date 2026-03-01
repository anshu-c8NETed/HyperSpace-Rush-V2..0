import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine.js';
import LoadingScreen from './components/LoadingScreen.jsx';
import InstructionsScreen from './components/InstructionsScreen.jsx';
import StartScreen from './components/StartScreen.jsx';
import HUD from './components/HUD.jsx';
import GameOver from './components/GameOver.jsx';
import PauseScreen from './components/PauseScreen.jsx';
import MobileControls from './components/MobileControls.jsx';

// Screens: loading | instructions | start | playing | paused | gameover
const SCREEN = {
  LOADING: 'loading',
  INSTRUCTIONS: 'instructions',
  START: 'start',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover',
};

export default function App() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const hudUpdateTimer = useRef(null);

  const [screen, setScreen] = useState(SCREEN.LOADING);
  const [loadProgress, setLoadProgress] = useState(0);

  // HUD state
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [health, setHealth] = useState(3);
  const [boostCharge, setBoostCharge] = useState(100);
  const [boostActive, setBoostActive] = useState(false);
  const [popups, setPopups] = useState([]);

  // Game over state
  const [goData, setGoData] = useState({ score: 0, highScore: 0, level: 1, isNewHighScore: false });

  // Persistent
  const [highScore, setHighScore] = useState(() => parseInt(localStorage.getItem('hyperspace_highscore')) || 0);
  const [bestLevel, setBestLevel] = useState(() => parseInt(localStorage.getItem('hyperspace_bestlevel')) || 1);

  // Damage flash
  const [damageFlash, setDamageFlash] = useState(false);
  // Level announce
  const [levelAnnounce, setLevelAnnounce] = useState(null);

  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

  // ===== ENGINE INIT =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onHUDUpdate: ({ score, level, boostCharge, boostActive }) => {
        setScore(score);
        setLevel(level);
        setBoostCharge(boostCharge);
        setBoostActive(boostActive);
      },
      onHealthChange: (h) => setHealth(h),
      onDamage: () => {
        setDamageFlash(true);
        setTimeout(() => setDamageFlash(false), 600);
        addPopup(0, false);
      },
      onCollect: (val) => {
        addPopup(val, true);
      },
      onLevelUp: (lvl) => {
        setLevelAnnounce(`LEVEL ${lvl}`);
        setTimeout(() => setLevelAnnounce(null), 1300);
      },
      onPause: (paused) => {
        setScreen(paused ? SCREEN.PAUSED : SCREEN.PLAYING);
      },
      onGameOver: (data) => {
        setGoData(data);
        setHighScore(data.highScore);
        if (data.level > bestLevel) setBestLevel(data.level);
        setScreen(SCREEN.GAMEOVER);
      },
    });

    engineRef.current = engine;
    engine.animate();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // ===== LOADING =====
  useEffect(() => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 18 + 8;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setScreen(SCREEN.INSTRUCTIONS), 400);
      }
      setLoadProgress(progress);
    }, 130);
    return () => clearInterval(interval);
  }, []);

  // ===== POPUP HELPER =====
  let popupId = useRef(0);
  const addPopup = useCallback((value, isPositive) => {
    const id = ++popupId.current;
    const x = window.innerWidth / 2;
    const y = window.innerHeight / 2 - 80 + (Math.random() - 0.5) * 60;
    setPopups(p => [...p, { id, value, isPositive, x, y }]);
    setTimeout(() => setPopups(p => p.filter(pp => pp.id !== id)), 1050);
  }, []);

  // ===== ACTIONS =====
  const handleStartGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.startGame();
    setScore(0);
    setLevel(1);
    setHealth(3);
    setBoostCharge(100);
    setBoostActive(false);
    setPopups([]);
    setScreen(SCREEN.PLAYING);
  }, []);

  const handleRestart = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  const handleMenu = useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.cleanup();
    setScreen(SCREEN.START);
  }, []);

  const handleShowInstructions = useCallback(() => {
    setScreen(SCREEN.INSTRUCTIONS);
  }, []);

  const handleStartFromInstructions = useCallback(() => {
    handleStartGame();
  }, [handleStartGame]);

  // Joystick callbacks
  const handleJoystick = useCallback((dx, dy) => {
    engineRef.current?.setJoystick(dx, dy);
  }, []);

  const handleJoystickEnd = useCallback(() => {
    engineRef.current?.clearJoystick();
  }, []);

  const handleBoost = useCallback(() => {
    engineRef.current?.setBoost(true);
  }, []);

  const handleBoostEnd = useCallback(() => {
    engineRef.current?.setBoost(false);
  }, []);

  const isPlaying = screen === SCREEN.PLAYING;

  return (
    <>
      {/* Three.js canvas - always rendered */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Scanline overlay */}
      <div className="scanlines" />

      {/* Screens */}
      <LoadingScreen
        progress={loadProgress}
        visible={screen === SCREEN.LOADING}
      />

      <InstructionsScreen
        visible={screen === SCREEN.INSTRUCTIONS}
        onStart={handleStartFromInstructions}
      />

      <StartScreen
        visible={screen === SCREEN.START}
        highScore={highScore}
        bestLevel={bestLevel}
        onStart={handleStartGame}
        onInstructions={handleShowInstructions}
      />

      <HUD
        active={isPlaying || screen === SCREEN.PAUSED}
        score={score}
        level={level}
        health={health}
        boostCharge={boostCharge}
        boostActive={boostActive}
        popups={popups}
      />

      <PauseScreen visible={screen === SCREEN.PAUSED} />

      <GameOver
        visible={screen === SCREEN.GAMEOVER}
        score={goData.score}
        highScore={goData.highScore}
        level={goData.level}
        isNewHighScore={goData.isNewHighScore}
        onRestart={handleRestart}
        onMenu={handleMenu}
      />

      {/* Damage flash */}
      {damageFlash && <div className="damage-flash" />}

      {/* Level announce */}
      {levelAnnounce && (
        <div className="level-announce">{levelAnnounce}</div>
      )}

      {/* Mobile controls */}
      <MobileControls
        visible={isMobile && isPlaying}
        onJoystick={handleJoystick}
        onJoystickEnd={handleJoystickEnd}
        onBoost={handleBoost}
        onBoostEnd={handleBoostEnd}
      />

      {/* Watermark */}
      <div className="watermark"><span>Made by A.R · v2.0</span></div>
    </>
  );
}