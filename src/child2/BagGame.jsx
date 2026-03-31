import { useState, useEffect, useCallback } from 'react';
import { addScore } from '../utils/storage';
import { speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { playFanfare, playMegaFanfare } from './utils/celebration';
import useDragDrop from '../hooks/useDragDrop';
import { startBGM, stopBGM } from './utils/bgm';
import MuteButton from './utils/MuteButton';

const BAG_SCENARIOS = [
  {
    title: '🏫 학교 갈 때', bag: '🎒',
    correct: [
      { name: '책', emoji: '📖' }, { name: '연필', emoji: '✏️' },
      { name: '지우개', emoji: '🧽' }, { name: '실내화', emoji: '👟' }, { name: '물통', emoji: '🥤' },
    ],
    wrong: [
      { name: '장난감', emoji: '🧸' }, { name: '과자', emoji: '🍪' },
      { name: '베개', emoji: '🛏️' }, { name: '이불', emoji: '🛌' },
    ],
  },
  {
    title: '🏖️ 바다 갈 때', bag: '👜',
    correct: [
      { name: '수영복', emoji: '👙' }, { name: '선크림', emoji: '🧴' },
      { name: '수건', emoji: '🧻' }, { name: '선글라스', emoji: '🕶️' }, { name: '물', emoji: '💧' },
    ],
    wrong: [
      { name: '책', emoji: '📖' }, { name: '연필', emoji: '✏️' },
      { name: '이불', emoji: '🛌' }, { name: '우산', emoji: '☂️' },
    ],
  },
  {
    title: '⛺ 캠핑 갈 때', bag: '🧳',
    correct: [
      { name: '텐트', emoji: '⛺' }, { name: '랜턴', emoji: '🔦' },
      { name: '담요', emoji: '🧣' }, { name: '음식', emoji: '🍙' }, { name: '물', emoji: '💧' },
    ],
    wrong: [
      { name: '연필', emoji: '✏️' }, { name: '책', emoji: '📖' },
      { name: '장난감', emoji: '🧸' }, { name: '쿠션', emoji: '🛋️' },
    ],
  },
  {
    title: '🏥 병원 갈 때', bag: '👝',
    correct: [
      { name: '약', emoji: '💊' }, { name: '보험증', emoji: '💳' },
      { name: '마스크', emoji: '😷' }, { name: '물', emoji: '💧' }, { name: '수건', emoji: '🧻' },
    ],
    wrong: [
      { name: '장난감', emoji: '🧸' }, { name: '과자', emoji: '🍪' },
      { name: '축구공', emoji: '⚽' }, { name: '베개', emoji: '🛏️' },
    ],
  },
  {
    title: '🌧️ 비오는 날', bag: '🎒',
    correct: [
      { name: '우산', emoji: '☂️' }, { name: '장화', emoji: '🥾' },
      { name: '우비', emoji: '🧥' }, { name: '수건', emoji: '🧻' }, { name: '여벌옷', emoji: '👕' },
    ],
    wrong: [
      { name: '선글라스', emoji: '🕶️' }, { name: '부채', emoji: '🪭' },
      { name: '수영복', emoji: '👙' }, { name: '선크림', emoji: '🧴' },
    ],
  },
  {
    title: '🎂 생일 파티 갈 때', bag: '🛍️',
    correct: [
      { name: '선물', emoji: '🎁' }, { name: '풍선', emoji: '🎈' },
      { name: '케이크', emoji: '🎂' }, { name: '편지', emoji: '💌' }, { name: '사탕', emoji: '🍬' },
    ],
    wrong: [
      { name: '책', emoji: '📖' }, { name: '연필', emoji: '✏️' },
      { name: '약', emoji: '💊' }, { name: '마스크', emoji: '😷' },
    ],
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function pickRound(excludeIdx) {
  const pool = BAG_SCENARIOS.filter((_, i) => i !== excludeIdx);
  const scenario = pool[Math.floor(Math.random() * pool.length)];
  const idx = BAG_SCENARIOS.indexOf(scenario);
  const correctPick = shuffle(scenario.correct).slice(0, 3 + Math.floor(Math.random() * 3)); // 3~5개
  const wrongPick = shuffle(scenario.wrong).slice(0, 3 + Math.floor(Math.random() * 2)); // 3~4개
  const allItems = shuffle([
    ...correctPick.map((i) => ({ ...i, needed: true })),
    ...wrongPick.map((i) => ({ ...i, needed: false })),
  ]);
  return { idx, scenario, correctPick, allItems };
}

export default function BagGame({ onBack }) {
  const [round, setRound] = useState(() => pickRound(-1));
  const [packed, setPacked] = useState([]);
  const [wrongItem, setWrongItem] = useState(null);
  const [complete, setComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [celebMode, setCelebMode] = useState(null);

  const { scenario, correctPick, allItems } = round;
  const neededCount = correctPick.length;

  useEffect(() => { startBGM(); return () => stopBGM(); }, []);
  useEffect(() => { speak(scenario.title); }, [scenario.title]);

  const nextRound = useCallback(() => {
    const r = pickRound(round.idx);
    setRound(r);
    setPacked([]);
    setWrongItem(null);
    setComplete(false);
    setFeedback('');
  }, [round.idx]);

  const { makeDragProps, makeDropProps, dragging, ghostStyle, containerProps, nearZone } = useDragDrop({
    onDrop: (itemName, zoneId) => {
      if (complete || packed.includes(itemName) || wrongItem) return 'ignore';
      const item = allItems.find((i) => i.name === itemName);
      if (!item) return 'ignore';

      if (item.needed) {
        const newPacked = [...packed, item.name];
        setPacked(newPacked);
        addScore('child2', 'bag', 1);
        playFanfare(); speak(item.name);
        setCelebMode('big');
        setTimeout(() => setCelebMode(null), 2200);

        if (newPacked.length === neededCount) {
          setComplete(true); setFeedback('준비 완료!');
          setTimeout(() => { setCelebMode('mega'); playMegaFanfare(); }, 2300);
          setTimeout(() => { setCelebMode(null); setTimeout(nextRound, 1000); }, 5500);
        }
        return 'correct';
      } else {
        setWrongItem(item.name);
        setFeedback(`${item.name}은 안 가져가요~`);
        setTimeout(() => { setWrongItem(null); setFeedback(''); }, 1500);
        return 'wrong';
      }
    },
  });

  const bagDrop = makeDropProps('bag');
  const isOverBag = nearZone === 'bag';

  return (
    <div style={{
      height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
      backgroundColor: '#FFF9F0', padding: '2vh 3vw', overflow: 'hidden',
    }} {...containerProps}>
      <CelebrationOverlay mode={celebMode} score={packed.length} onDone={() => setCelebMode(null)} />
      <MuteButton />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: '3vw', background: 'none', border: 'none', cursor: 'pointer', padding: '2vw', borderRadius: '2vw', color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: '4vw', fontWeight: 'bold', color: '#5D4E37' }}>{scenario.title}</div>
        <div style={{ width: '8vw' }} />
      </div>

      {/* Instruction */}
      <div style={{ fontSize: '3.5vw', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1vh', flexShrink: 0, textAlign: 'center' }}>
        {complete ? '준비 완료! 🎉' : '필요한 것을 가방에 끌어다 놓아요!'}
      </div>

      {/* Main: 2-column */}
      <div style={{ flex: 1, display: 'flex', gap: '2vw', minHeight: 0 }}>
        {/* Left: Bag (drop zone) */}
        <div ref={bagDrop.ref} style={{
          width: '48vw',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          backgroundColor: isOverBag ? '#EDE7F6' : '#F3E5F5',
          borderRadius: '2vw',
          border: isOverBag ? '4px dashed #AB47BC' : complete ? '4px solid #A5D6A7' : '4px dashed #CE93D8',
          boxShadow: isOverBag ? '0 0 30px rgba(171,71,188,0.3)' : '0 4px 16px rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          gap: '2vh',
          padding: '2vh',
        }}>
          {/* Bag emoji */}
          <div style={{ fontSize: '18vw' }}>{scenario.bag}</div>

          {/* Hint slots */}
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${Math.min(correctPick.length, 3)}, 1fr)`,
            gap: '1.5vw', width: '80%', maxWidth: '40vw',
          }}>
            {correctPick.map((item) => {
              const isPacked = packed.includes(item.name);
              return (
                <div key={item.name} style={{
                  aspectRatio: '1',
                  borderRadius: '1.5vw',
                  border: isPacked ? '3px solid #A5D6A7' : '3px dashed #D4C5B0',
                  backgroundColor: isPacked ? '#E8F5E9' : 'rgba(255,255,255,0.3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}>
                  <span style={{
                    fontSize: '5vw', lineHeight: 1,
                    filter: isPacked ? 'none' : 'brightness(0) contrast(2)',
                    opacity: isPacked ? 1 : 0.4,
                    transition: 'all 0.3s ease',
                  }}>{item.emoji}</span>
                  <span style={{
                    fontSize: '1.5vw', color: isPacked ? '#4CAF50' : '#B0A090',
                    fontWeight: 'bold', marginTop: '0.3vh',
                  }}>{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* Count */}
          <div style={{ fontSize: '2.5vw', color: '#7A6B5D', fontWeight: 'bold' }}>
            {packed.length} / {neededCount}
          </div>
        </div>

        {/* Right: Item cards */}
        <div style={{
          width: '45%', display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1.2vw',
          alignContent: 'center',
        }}>
          {allItems.map((item) => {
            const isPacked = packed.includes(item.name);
            const isWrong = wrongItem === item.name;
            const isDragged = dragging === item.name;
            const dp = isPacked ? {} : makeDragProps(item.name);
            return (
              <div key={item.name} {...dp} style={{
                ...(dp.style || {}),
                width: '20vw', height: '20vw',
                borderRadius: '2vw',
                border: isPacked ? '3px solid #A5D6A7' : '3px solid transparent',
                backgroundColor: isPacked ? '#E8F5E9' : '#FFFFFF',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5vh',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                opacity: isPacked ? 0.4 : isDragged ? 0.3 : 1,
                animation: isWrong ? 'shake 0.4s ease-in-out' : 'none',
                zIndex: isDragged ? 100 : 1,
              }}>
                <span style={{ fontSize: '6vw', lineHeight: 1, pointerEvents: 'none' }}>{item.emoji}</span>
                <span style={{ fontSize: '2vw', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{item.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ghost */}
      {dragging && ghostStyle && (() => {
        const item = allItems.find((i) => i.name === dragging);
        return item ? <div style={{ ...ghostStyle, fontSize: '10vw', lineHeight: 1 }}>{item.emoji}</div> : null;
      })()}

      {/* Feedback */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3vw', marginTop: '1vh', flexShrink: 0, minHeight: '5vh' }}>
        {feedback && (
          <div style={{ fontSize: '2.5vw', fontWeight: 'bold', color: complete ? '#4CAF50' : '#E65100' }}>{feedback}</div>
        )}
      </div>
    </div>
  );
}
