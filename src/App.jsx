import { useState } from 'react';
import ProfileSelect from './components/ProfileSelect';
import Child1Home from './child1/Child1Home';
import NumberGame from './child1/NumberGame';
import SoundPattern from './child1/SoundPattern';
import WordMatch from './child1/WordMatch';
import StrokeWriter from './child1/StrokeWriter';
import WordManager from './child1/WordManager';
import HandPointGame from './child1/HandPointGame';
import Child2Home from './child2/Child2Home';
import CompareGame from './child2/CompareGame';
import ShadowMatch from './child2/ShadowMatch';
import PathGame from './child2/PathGame';
import BagGame from './child2/BagGame';

function unlockAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  ctx.resume().then(() => ctx.close());
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

export default function App() {
  const [screen, setScreen] = useState('start');

  function handleProfileSelect(profile) {
    if (profile === 'child1') setScreen('child1Home');
    if (profile === 'child2') setScreen('child2Home');
  }

  function handleNavigate1(activity) {
    const map = { number: 'number', sound: 'sound', word: 'word', stroke: 'stroke', wordManager: 'wordManager', handPoint: 'handPoint' };
    setScreen(map[activity] || 'child1Home');
  }

  function handleNavigate2(activity) {
    const map = { compare: 'compare', shadow: 'shadow', path: 'path', pack: 'pack' };
    setScreen(map[activity] || 'child2Home');
  }

  function handleStart() {
    unlockAudio();
    setScreen('profile');
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#FFF9F0' }}>
      {screen === 'start' && (
        <div style={{
          height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF9F0', gap: '4vh',
        }}>
          <div style={{ fontSize: '6vw', fontWeight: 'bold', color: '#5D4E37' }}>
            같이 놀자!
          </div>
          <button onClick={handleStart} style={{
            width: '50vw', height: '18vh', borderRadius: '3vw', border: 'none',
            backgroundColor: '#FFE082', fontSize: '5vw', fontWeight: 'bold',
            color: '#5D4E37', cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2vw',
          }}>
            🌟 시작하기
          </button>
        </div>
      )}
      {screen === 'profile' && <ProfileSelect onSelect={handleProfileSelect} />}

      {/* Child 1 screens */}
      {screen === 'child1Home' && <Child1Home onNavigate={handleNavigate1} onBack={() => setScreen('profile')} />}
      {screen === 'number' && <NumberGame onBack={() => setScreen('child1Home')} />}
      {screen === 'sound' && <SoundPattern onBack={() => setScreen('child1Home')} />}
      {screen === 'word' && <WordMatch onBack={() => setScreen('child1Home')} />}
      {screen === 'stroke' && <StrokeWriter onBack={() => setScreen('child1Home')} />}
      {screen === 'wordManager' && <WordManager onBack={() => setScreen('child1Home')} />}
      {screen === 'handPoint' && <HandPointGame onBack={() => setScreen('child1Home')} />}

      {/* Child 2 screens */}
      {screen === 'child2Home' && <Child2Home onNavigate={handleNavigate2} onBack={() => setScreen('profile')} />}
      {screen === 'compare' && <CompareGame onBack={() => setScreen('child2Home')} />}
      {screen === 'shadow' && <ShadowMatch onBack={() => setScreen('child2Home')} />}
      {screen === 'path' && <PathGame onBack={() => setScreen('child2Home')} />}
      {screen === 'pack' && <BagGame onBack={() => setScreen('child2Home')} />}
    </div>
  );
}
