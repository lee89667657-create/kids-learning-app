import { useState } from 'react';
import ProfileSelect from './components/ProfileSelect';
import Child1Home from './child1/Child1Home';
import NumberGame from './child1/NumberGame';
import SoundPattern from './child1/SoundPattern';
import WordMatch from './child1/WordMatch';
import StrokeWriter from './child1/StrokeWriter';
import WordManager from './child1/WordManager';
import Child2Home from './child2/Child2Home';
import CompareGame from './child2/CompareGame';

export default function App() {
  const [screen, setScreen] = useState('profile');

  function handleProfileSelect(profile) {
    if (profile === 'child1') setScreen('child1Home');
    if (profile === 'child2') setScreen('child2Home');
  }

  function handleNavigate1(activity) {
    const map = { number: 'number', sound: 'sound', word: 'word', stroke: 'stroke', wordManager: 'wordManager' };
    setScreen(map[activity] || 'child1Home');
  }

  function handleNavigate2(activity) {
    const map = { compare: 'compare', shadow: 'shadow', path: 'path', pack: 'pack' };
    setScreen(map[activity] || 'child2Home');
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: '#FFF9F0' }}>
      {screen === 'profile' && <ProfileSelect onSelect={handleProfileSelect} />}

      {/* Child 1 screens */}
      {screen === 'child1Home' && <Child1Home onNavigate={handleNavigate1} onBack={() => setScreen('profile')} />}
      {screen === 'number' && <NumberGame onBack={() => setScreen('child1Home')} />}
      {screen === 'sound' && <SoundPattern onBack={() => setScreen('child1Home')} />}
      {screen === 'word' && <WordMatch onBack={() => setScreen('child1Home')} />}
      {screen === 'stroke' && <StrokeWriter onBack={() => setScreen('child1Home')} />}
      {screen === 'wordManager' && <WordManager onBack={() => setScreen('child1Home')} />}

      {/* Child 2 screens */}
      {screen === 'child2Home' && <Child2Home onNavigate={handleNavigate2} onBack={() => setScreen('profile')} />}
      {screen === 'compare' && <CompareGame onBack={() => setScreen('child2Home')} />}
    </div>
  );
}
