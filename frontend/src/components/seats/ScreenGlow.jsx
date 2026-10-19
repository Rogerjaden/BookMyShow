import React from 'react';
import './seats.css';

/** The curved cinema screen. It "switches on" once when it first appears. */
const ScreenGlow = ({ label = 'Screen', width = '78%' }) => (
  <div className="cinema-screen" style={{ width }}>
    <svg className="cinema-screen__curve" viewBox="0 0 600 60" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="bms-screen-stroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#90caf9" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="#e8f4ff" stopOpacity="1" />
          <stop offset="1" stopColor="#90caf9" stopOpacity="0.1" />
        </linearGradient>
        <filter id="bms-screen-blur" x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <path d="M8 52 Q300 2 592 52" fill="none" stroke="url(#bms-screen-stroke)" strokeWidth="12" filter="url(#bms-screen-blur)" opacity="0.8" />
      <path d="M8 52 Q300 2 592 52" fill="none" stroke="url(#bms-screen-stroke)" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <span className="cinema-screen__label">{label}</span>
  </div>
);

export default ScreenGlow;
