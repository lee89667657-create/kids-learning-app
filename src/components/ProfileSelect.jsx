import { useState, useRef } from 'react';
import ImageWithEdit from './ImageWithEdit';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#FFF9F0',
    padding: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#5D4E37',
    marginBottom: 48,
  },
  buttonRow: {
    display: 'flex',
    gap: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 32,
    border: '4px solid transparent',
    fontSize: 32,
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: 'transparent',
  },
  child1Btn: {
    backgroundColor: '#B5D8F7',
    color: '#2C5F8A',
  },
  child2Btn: {
    backgroundColor: '#F7D5E0',
    color: '#8A2C5F',
  },
};

export default function ProfileSelect({ onSelect }) {
  const [hovered, setHovered] = useState(null);
  const [, forceUpdate] = useState(0);
  const pressStartTime = useRef({});

  function btnStyle(base, isHovered) {
    return {
      ...styles.button,
      ...base,
      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
      boxShadow: isHovered
        ? '0 8px 24px rgba(0,0,0,0.15)'
        : '0 4px 12px rgba(0,0,0,0.08)',
    };
  }

  function handlePointerDown(profileId) {
    pressStartTime.current[profileId] = Date.now();
  }

  function handleClick(profileId) {
    // Only navigate if it wasn't a long press (< 3 seconds)
    const start = pressStartTime.current[profileId];
    if (start && Date.now() - start >= 3000) {
      // Long press happened — don't navigate
      return;
    }
    onSelect(profileId);
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>누구야?</div>
      <div style={styles.buttonRow}>
        <button
          style={btnStyle(styles.child1Btn, hovered === 'child1')}
          onMouseEnter={() => setHovered('child1')}
          onMouseLeave={() => setHovered(null)}
          onPointerDown={() => handlePointerDown('child1')}
          onClick={() => handleClick('child1')}
        >
          <ImageWithEdit
            imageKey="profile_child1"
            fallbackEmoji="👦"
            size={100}
            shape="circle"
            label="형"
            onImageChange={() => forceUpdate((n) => n + 1)}
            style={{
              border: '3px solid rgba(255,255,255,0.6)',
              backgroundColor: 'rgba(255,255,255,0.3)',
            }}
          />
          <span>형</span>
        </button>
        <button
          style={btnStyle(styles.child2Btn, hovered === 'child2')}
          onMouseEnter={() => setHovered('child2')}
          onMouseLeave={() => setHovered(null)}
          onPointerDown={() => handlePointerDown('child2')}
          onClick={() => handleClick('child2')}
        >
          <ImageWithEdit
            imageKey="profile_child2"
            fallbackEmoji="👧"
            size={100}
            shape="circle"
            label="동생"
            onImageChange={() => forceUpdate((n) => n + 1)}
            style={{
              border: '3px solid rgba(255,255,255,0.6)',
              backgroundColor: 'rgba(255,255,255,0.3)',
            }}
          />
          <span>동생</span>
        </button>
      </div>
    </div>
  );
}
