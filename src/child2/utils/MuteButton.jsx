import { useState } from 'react';
import { toggleMute, isMuted } from './bgm';

export default function MuteButton() {
  const [mute, setMute] = useState(isMuted());

  function handleToggle() {
    const newMute = toggleMute();
    setMute(newMute);
  }

  return (
    <button onClick={handleToggle} style={{
      position: 'fixed',
      top: 'min(2vh, 16px)',
      right: 'min(2vw, 16px)',
      width: 'min(7vw, 52px)',
      height: 'min(7vw, 52px)',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: mute ? '#FFCDD2' : '#C8E6C9',
      fontSize: 'min(4vw, 28px)',
      cursor: 'pointer',
      zIndex: 50,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {mute ? '🔇' : '🔊'}
    </button>
  );
}
