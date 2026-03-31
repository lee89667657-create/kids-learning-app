import { useState } from 'react';
import ProfileSelect from './components/ProfileSelect';
import Child1Home from './child1/Child1Home';
import NumberGame from './child1/NumberGame';
import SoundPattern from './child1/SoundPattern';
import WordMatch from './child1/WordMatch';
import StrokeWriter from './child1/StrokeWriter';
import WordManager from './child1/WordManager';

export default function App() {
  const [screen, setScreen] = useState('profile');

  function handleProfileSelect(profile) {
    if (profile === 'child1') {
      setScreen('child1Home');
    }
  }

  function handleNavigate(activity) {
    const map = {
      number: 'number',
      sound: 'sound',
      word: 'word',
      stroke: 'stroke',
      wordManager: 'wordManager',
    };
    setScreen(map[activity] || 'child1Home');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF9F0' }}>
      {screen === 'profile' && <ProfileSelect onSelect={handleProfileSelect} />}
      {screen === 'child1Home' && (
        <Child1Home
          onNavigate={handleNavigate}
          onBack={() => setScreen('profile')}
        />
      )}
      {screen === 'number' && (
        <NumberGame onBack={() => setScreen('child1Home')} />
      )}
      {screen === 'sound' && (
        <SoundPattern onBack={() => setScreen('child1Home')} />
      )}
      {screen === 'word' && (
        <WordMatch onBack={() => setScreen('child1Home')} />
      )}
      {screen === 'stroke' && (
        <StrokeWriter onBack={() => setScreen('child1Home')} />
      )}
      {screen === 'wordManager' && (
        <WordManager onBack={() => setScreen('child1Home')} />
      )}
    </div>
  );
}
