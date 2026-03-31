import { useState, useEffect, useCallback, useRef } from 'react';
import { addScore } from '../utils/storage';
import { speakCute as speak } from '../utils/tts';
import CelebrationOverlay from './utils/CelebrationOverlay';
import { speakPraise, speakWrong, speakComplete, playFanfare, playMegaFanfare } from './utils/celebration';
import useDragDrop from '../hooks/useDragDrop';
import { startBGM, stopBGM } from './utils/bgm';
import MuteButton from './utils/MuteButton';

const ANIMALS = [
  { name: '강아지', emoji: '🐕' }, { name: '고양이', emoji: '🐱' },
  { name: '토끼', emoji: '🐰' }, { name: '코끼리', emoji: '🐘' },
  { name: '기린', emoji: '🦒' }, { name: '펭귄', emoji: '🐧' },
  { name: '곰', emoji: '🐻' }, { name: '사자', emoji: '🦁' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ─── Sound effects ───
function playSfx(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === 'honk') {
      [300, 400].forEach((f, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'square'; o.frequency.value = f; const t = ctx.currentTime + i * 0.25; g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.2); o.start(t); o.stop(t + 0.2); });
    } else if (type === 'foghorn') {
      const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth'; o.frequency.value = 120; g.gain.setValueAtTime(0.12, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2); o.start(); o.stop(ctx.currentTime + 1.2);
    } else if (type === 'rocket') {
      const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sawtooth'; o.frequency.setValueAtTime(200, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.5); g.gain.setValueAtTime(0.1, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.5); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5); o.start(); o.stop(ctx.currentTime + 1.5);
    }
  } catch {}
}

// ─── Vehicle definitions ───
const VEHICLES = [
  {
    id: 'bus', name: '버스', emoji: '🚌', seats: 2, extra: 2,
    bg: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 55%, #A5D6A7 55%, #A5D6A7 60%, #9E9E9E 60%, #9E9E9E 100%)',
    departTTS: '출발~! 부릉부릉!',
    departTransform: 'translateX(120vw)',
    departDuration: '2s', sfx: 'honk',
    svgW: '85vw', svgH: '50vh',
    svg: (seats, filled, nearSeat, seatRefs, driving) => (
      <svg viewBox="0 0 340 140" style={{ width: '100%', height: '100%' }}>
        {/* Body */}
        <rect x="10" y="10" width="300" height="85" rx="18" fill="#FFB74D" stroke="#F57C00" strokeWidth="3" />
        <rect x="15" y="4" width="290" height="12" rx="6" fill="#FFA726" />
        {/* Driver */}
        <rect x="280" y="22" width="28" height="58" rx="9" fill="#FFE0B2" stroke="#F57C00" strokeWidth="2" />
        <text x="294" y="58" textAnchor="middle" fontSize="22">🧑‍✈️</text>
        <circle cx="315" cy="80" r="5" fill="#FFF9C4" stroke="#FBC02D" strokeWidth="1.5" />
        {/* Wheels */}
        <circle cx="70" cy="105" r="16" fill="#5D4037" stroke="#3E2723" strokeWidth="3">
          {driving && <animateTransform attributeName="transform" type="rotate" values="0 70 105;360 70 105" dur="0.4s" repeatCount="indefinite" />}
        </circle>
        <circle cx="240" cy="105" r="16" fill="#5D4037" stroke="#3E2723" strokeWidth="3">
          {driving && <animateTransform attributeName="transform" type="rotate" values="0 240 105;360 240 105" dur="0.4s" repeatCount="indefinite" />}
        </circle>
        {/* Windows (big) */}
        {seats.map((a, i) => { const wx = 30 + i * 110; const f = filled.includes(i); const n = i === filled.length && !driving; return (
          <g key={i}><rect ref={el => { seatRefs.current[i] = el; }} x={wx} y="20" width="80" height="60" rx="10" fill={f ? '#E8F5E9' : n ? '#FFF8E1' : '#E3F2FD'} stroke={f ? '#A5D6A7' : n ? '#FFA726' : '#90CAF9'} strokeWidth={n ? 3 : 2} strokeDasharray={f ? 'none' : '5,4'} />
          {f ? <text x={wx+40} y="58" textAnchor="middle" fontSize="32" style={{animation:'snapIn 0.4s ease-out'}}>{a.emoji}</text>
             : <text x={wx+40} y="58" textAnchor="middle" fontSize="32" style={{filter:'brightness(0)',opacity:nearSeat===i?0.4:0.15}}>{a.emoji}</text>}
          <text x={wx+40} y="88" textAnchor="middle" fontSize="12" fill="#7A6B5D" fontWeight="bold">{i+1}</text></g>
        ); })}
      </svg>
    ),
  },
  {
    id: 'ship', name: '배', emoji: '🚢', seats: 3, extra: 2,
    bg: 'linear-gradient(180deg, #87CEEB 0%, #B3E5FC 40%, #4FC3F7 40%, #0288D1 100%)',
    departTTS: '출항~! 둥실둥실!',
    departTransform: 'translateX(120vw)',
    departDuration: '3s', sfx: 'foghorn',
    svgW: '85vw', svgH: '50vh',
    svg: (seats, filled, nearSeat, seatRefs, driving) => (
      <svg viewBox="0 0 380 160" style={{ width: '100%', height: '100%' }}>
        {/* Water */}
        <path d="M0,130 Q60,118 120,130 Q180,142 240,130 Q300,118 380,130 L380,160 L0,160Z" fill="#29B6F6" opacity="0.5">
          <animate attributeName="d" values="M0,130 Q60,118 120,130 Q180,142 240,130 Q300,118 380,130 L380,160 L0,160Z;M0,130 Q60,142 120,130 Q180,118 240,130 Q300,142 380,130 L380,160 L0,160Z;M0,130 Q60,118 120,130 Q180,142 240,130 Q300,118 380,130 L380,160 L0,160Z" dur="2s" repeatCount="indefinite" />
        </path>
        {/* Hull */}
        <path d="M30,125 L15,70 L365,70 L350,125Z" fill="#5C6BC0" stroke="#3949AB" strokeWidth="2.5" />
        {/* Deck */}
        <rect x="40" y="35" width="300" height="38" rx="10" fill="#7986CB" stroke="#5C6BC0" strokeWidth="2" />
        {/* Smokestack */}
        <rect x="300" y="10" width="22" height="28" rx="4" fill="#EF5350" />
        {driving && <circle cx="311" cy="6" r="6" fill="#BDBDBD" opacity="0.6"><animate attributeName="cy" values="6;-6;-18" dur="1s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.6;0.3;0" dur="1s" repeatCount="indefinite" /></circle>}
        {/* Flag */}
        <line x1="330" y1="35" x2="330" y2="12" stroke="#795548" strokeWidth="2.5" />
        <polygon points="330,12 352,20 330,28" fill="#FFA726" />
        {/* Captain */}
        <text x="340" y="58" textAnchor="middle" fontSize="20">🧑‍✈️</text>
        {/* Windows (big circles) */}
        {seats.map((a, i) => { const wx = 60 + i * 85; const f = filled.includes(i); const n = i === filled.length && !driving; return (
          <g key={i}><circle ref={el => { seatRefs.current[i] = el; }} cx={wx+25} cy="97" r="22" fill={f ? '#E8F5E9' : n ? '#FFF8E1' : '#E3F2FD'} stroke={f ? '#A5D6A7' : n ? '#FFA726' : '#90CAF9'} strokeWidth={n ? 3 : 2} strokeDasharray={f ? 'none' : '4,4'} />
          {f ? <text x={wx+25} y="104" textAnchor="middle" fontSize="22" style={{animation:'snapIn 0.4s ease-out'}}>{a.emoji}</text>
             : <text x={wx+25} y="104" textAnchor="middle" fontSize="22" style={{filter:'brightness(0)',opacity:nearSeat===i?0.4:0.15}}>{a.emoji}</text>}
          <text x={wx+25} y="128" textAnchor="middle" fontSize="11" fill="#5D4E37" fontWeight="bold">{i+1}</text></g>
        ); })}
      </svg>
    ),
  },
  {
    id: 'rocket', name: '로켓', emoji: '🚀', seats: 4, extra: 2,
    bg: 'linear-gradient(180deg, #0D0D2B 0%, #1A1A3E 50%, #2C2C54 100%)',
    departTTS: '발사~!',
    departTransform: 'translateY(-120vh) rotate(-10deg)',
    departDuration: '2s', sfx: 'rocket',
    svgW: '40vw', svgH: '50vh',
    svg: (seats, filled, nearSeat, seatRefs, driving) => (
      <svg viewBox="0 0 160 320" style={{ width: '100%', height: '100%' }}>
        {/* Flame */}
        {driving && <><ellipse cx="80" cy="305" rx="22" ry="35" fill="#FF6F00" opacity="0.8"><animate attributeName="ry" values="30;42;30" dur="0.2s" repeatCount="indefinite" /></ellipse>
        <ellipse cx="80" cy="300" rx="12" ry="24" fill="#FFCA28"><animate attributeName="ry" values="18;28;18" dur="0.15s" repeatCount="indefinite" /></ellipse></>}
        {/* Body */}
        <path d="M45,275 L45,90 Q45,30 80,10 Q115,30 115,90 L115,275Z" fill="#E0E0E0" stroke="#BDBDBD" strokeWidth="2.5" />
        {/* Nose */}
        <path d="M45,90 Q45,30 80,10 Q115,30 115,90" fill="#EF5350" />
        {/* Fins */}
        <path d="M45,240 L18,280 L45,275Z" fill="#42A5F5" />
        <path d="M115,240 L142,280 L115,275Z" fill="#42A5F5" />
        {/* Windows (big) */}
        {seats.map((a, i) => { const wy = 105 + i * 42; const f = filled.includes(i); const n = i === filled.length && !driving; return (
          <g key={i}><circle ref={el => { seatRefs.current[i] = el; }} cx="80" cy={wy} r="17" fill={f ? '#E8F5E9' : n ? '#FFF8E1' : '#BBDEFB'} stroke={f ? '#A5D6A7' : n ? '#FFA726' : '#64B5F6'} strokeWidth={n ? 3 : 2} strokeDasharray={f ? 'none' : '4,4'} />
          {f ? <text x="80" y={wy+6} textAnchor="middle" fontSize="18" style={{animation:'snapIn 0.4s ease-out'}}>{a.emoji}</text>
             : <text x="80" y={wy+6} textAnchor="middle" fontSize="18" style={{filter:'brightness(0)',opacity:nearSeat===i?0.4:0.15}}>{a.emoji}</text>}
          <text x="80" y={wy+26} textAnchor="middle" fontSize="10" fill={driving ? '#FFF' : '#7A6B5D'} fontWeight="bold">{i+1}</text></g>
        ); })}
      </svg>
    ),
  },
];

// ──────────────── Stage 1: Shadow drag match ────────────────

function pickRound(exclude) {
  const pool = ANIMALS.filter((a) => a.name !== exclude);
  const answer = pool[Math.floor(Math.random() * pool.length)];
  const others = shuffle(ANIMALS.filter((a) => a.name !== answer.name)).slice(0, 2);
  return { answer, choices: shuffle([answer, ...others]) };
}

function Stage1({ onComplete, score, total, setScore, setTotal }) {
  const [round, setRound] = useState(() => pickRound(''));
  const [celebMode, setCelebMode] = useState(null);
  const [matched, setMatched] = useState(false);
  const [wrongSnap, setWrongSnap] = useState(null);
  const [roundCount, setRoundCount] = useState(0);

  const { makeDragProps, makeDropProps, dragging, dragPos, ghostStyle, containerProps, nearZone } = useDragDrop({
    onDrop: (item, zoneId) => {
      if (matched || wrongSnap) return 'ignore';
      setTotal((t) => t + 1);
      if (item === round.answer.name) {
        setMatched(true); setScore((s) => s + 1);
        addScore('child2', 'shadow', 1); playFanfare(); speakPraise();
        setCelebMode('big');
        return 'correct';
      }
      setWrongSnap(item); speakWrong();
      setTimeout(() => setWrongSnap(null), 600);
      return 'wrong';
    },
  });

  useEffect(() => { setTimeout(() => speak('동물을 그림자에 올려봐요!'), 400); }, []);

  const nextRound = useCallback(() => {
    const c = roundCount + 1; setRoundCount(c);
    if (c >= 3) { speak('잘했어요! 이제 탈것 게임 해봐요!'); setTimeout(onComplete, 1500); return; }
    const r = pickRound(round.answer.name);
    setRound(r); setMatched(false); setWrongSnap(null);
    setTimeout(() => speak('동물을 그림자에 올려봐요!'), 300);
  }, [round.answer.name, roundCount, onComplete]);

  const drop = makeDropProps('shadow');
  const isNear = nearZone === 'shadow';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }} {...containerProps}>
      <CelebrationOverlay mode={celebMode} score={score} onDone={() => { setCelebMode(null); nextRound(); }} />
      <div style={{ fontSize: 'min(3.5vw,32px)', fontWeight: 'bold', color: '#5D4E37', marginBottom: '1.5vh', flexShrink: 0 }}>{matched ? '맞았어요! 🎉' : '동물을 그림자에 올려봐요!'}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5vw', minHeight: 0 }}>
        {/* Drop zone */}
        <div ref={drop.ref} style={{
          width: '35vw', height: '35vw',
          backgroundColor: isNear ? '#FFF8E1' : '#F5F0E8', borderRadius: 'min(3vw,28px)',
          border: isNear ? '4px dashed #FFA726' : matched ? '4px solid #A5D6A7' : '4px dashed #D4C5B0',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          boxShadow: isNear ? '0 0 30px rgba(255,224,130,0.7)' : '0 4px 16px rgba(0,0,0,0.08)',
          transition: 'all 0.3s ease',
        }}>
          {matched ? <span style={{ fontSize: 'min(20vw,20vh)', lineHeight: 1, animation: 'snapIn 0.4s ease-out' }}>{round.answer.emoji}</span>
            : <><span style={{ fontSize: 'min(20vw,20vh)', filter: 'brightness(0)', opacity: isNear ? 0.4 : 0.8, lineHeight: 1, transition: 'opacity 0.2s' }}>{round.answer.emoji}</span>
              <div style={{ fontSize: 'min(1.8vw,14px)', color: '#B0A090', marginTop: '1vh' }}>여기에 올려봐요!</div></>}
        </div>
        {/* Draggable cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
          {round.choices.map((a) => {
            const dp = makeDragProps(a.name);
            const isDragged = dragging === a.name;
            return (
              <div key={a.name} {...dp} style={{
                ...dp.style,
                width: '20vw', height: '20vw', borderRadius: '2vw',
                border: '4px solid transparent', backgroundColor: '#FFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5vw',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                zIndex: isDragged ? 100 : 1,
                animation: wrongSnap === a.name ? 'shake 0.4s ease-in-out' : 'none',
                opacity: (matched && a.name === round.answer.name) ? 0.3 : isDragged ? 0.3 : 1,
              }}>
                <span style={{ fontSize: 'min(7vw,56px)', lineHeight: 1, pointerEvents: 'none' }}>{a.emoji}</span>
                <span style={{ fontSize: 'min(2.5vw,22px)', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{a.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Ghost */}
      {dragging && ghostStyle && (() => {
        const animal = round.choices.find((a) => a.name === dragging);
        return animal ? (
          <div style={{ ...ghostStyle, fontSize: 'min(10vw,80px)', lineHeight: 1 }}>{animal.emoji}</div>
        ) : null;
      })()}
    </div>
  );
}

// ──────────────── Stage 2: Vehicle Series ────────────────

function pickVehicleRound(seatCount, extra) {
  const picked = shuffle(ANIMALS).slice(0, seatCount);
  const others = shuffle(ANIMALS.filter((a) => !picked.find((p) => p.name === a.name))).slice(0, extra);
  return { seats: picked, cards: shuffle([...picked, ...others]) };
}

function VehicleGame({ score, total, setScore, setTotal, onBack }) {
  const [vIdx, setVIdx] = useState(0);
  const v = VEHICLES[vIdx];
  const [round, setRound] = useState(() => pickVehicleRound(v.seats, v.extra));
  const [filled, setFilled] = useState([]);
  const [celebMode, setCelebMode] = useState(null);
  const [departing, setDeparting] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [wrongSnap, setWrongSnap] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [nearSeat, setNearSeat] = useState(-1);
  const cardOrigins = useRef({});
  const seatRefs = useRef([]);

  const nextIdx = filled.length;
  const allFilled = filled.length === round.seats.length;
  const isRocket = v.id === 'rocket';

  useEffect(() => {
    setTimeout(() => speak(`${v.name}에 동물을 태워봐요! 1번부터!`), 400);
  }, [v.name]);

  function nextVehicle() {
    const ni = vIdx < VEHICLES.length - 1 ? vIdx + 1 : 0;
    setVIdx(ni);
    const nv = VEHICLES[ni];
    const r = pickVehicleRound(nv.seats, nv.extra);
    setRound(r); setFilled([]); setDeparting(false); setCountdown(null);
    setWrongSnap(null); setDragging(null); setNearSeat(-1);
    setTimeout(() => speak(ni === 0 ? `다시 ${nv.name}부터! 1번부터 태워봐요!` : `${nv.emoji} ${nv.name}가 왔어요! 1번부터!`), 500);
  }

  function isOverSeat(x, y, i) {
    const el = seatRefs.current[i]; if (!el) return false;
    const r = el.getBoundingClientRect();
    return x >= r.left - 10 && x <= r.right + 10 && y >= r.top - 10 && y <= r.bottom + 10;
  }

  function onDown(e, a) { if (allFilled || departing || wrongSnap) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); const r = e.currentTarget.getBoundingClientRect(); cardOrigins.current[a.name] = { x: r.left, y: r.top }; setDragging(a.name); setDragPos({ x: e.clientX, y: e.clientY }); }
  function onMove(e) { if (!dragging) return; e.preventDefault(); setDragPos({ x: e.clientX, y: e.clientY }); let f = -1; for (let i = 0; i < round.seats.length; i++) { if (isOverSeat(e.clientX, e.clientY, i)) { f = i; break; } } setNearSeat(f); }

  function onUp(e) {
    if (!dragging) return; e.preventDefault();
    const animal = round.cards.find((a) => a.name === dragging);
    if (nearSeat >= 0 && animal) {
      if (nearSeat !== nextIdx) { speak(`${nextIdx + 1}번부터 채워봐요!`); setDragging(null); setNearSeat(-1); return; }
      setTotal((t) => t + 1);
      if (animal.name === round.seats[nearSeat].name) {
        const nf = [...filled, nearSeat]; setFilled(nf); setScore((s) => s + 1); addScore('child2', 'shadow', 1);
        if (nf.length === round.seats.length) {
          if (v.id === 'rocket') {
            setCelebMode('mega'); playMegaFanfare();
            let c = 3; setCountdown(c);
            speak('3!');
            const iv = setInterval(() => { c--; if (c > 0) { setCountdown(c); speak(`${c}!`); } else { clearInterval(iv); setCountdown(null); speak(v.departTTS); playSfx(v.sfx); setDeparting(true); setTimeout(() => { setCelebMode(null); nextVehicle(); }, 3000); } }, 800);
          } else {
            playSfx(v.sfx); setCelebMode('mega'); speakComplete();
            setTimeout(() => { setDeparting(true); speak(v.departTTS); }, 1000);
            setTimeout(() => { setCelebMode(null); nextVehicle(); }, 4000);
          }
        } else { playFanfare(); speakPraise(); setCelebMode('big'); setTimeout(() => setCelebMode(null), 2000); }
      } else { setWrongSnap(animal.name); speakWrong(); setTimeout(() => setWrongSnap(null), 600); }
    }
    setDragging(null); setNearSeat(-1);
  }

  function cardStyle(animal) {
    const placed = filled.some((fi) => round.seats[fi]?.name === animal.name);
    const s = { width: '20vw', height: '20vw', borderRadius: '2vw', border: '3px solid transparent', backgroundColor: isRocket ? 'rgba(255,255,255,0.9)' : '#FFF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.3vh', boxShadow: '0 3px 10px rgba(0,0,0,0.1)', cursor: placed ? 'default' : 'grab', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', position: 'relative', transition: dragging === animal.name ? 'none' : 'transform 0.3s ease, opacity 0.3s ease', zIndex: dragging === animal.name ? 100 : 1, opacity: placed ? 0.3 : 1 };
    if (dragging === animal.name) { const o = cardOrigins.current[animal.name]; if (o) { s.transform = `translate(${dragPos.x-o.x-35}px,${dragPos.y-o.y-35}px) scale(1.1)`; s.boxShadow = '0 10px 28px rgba(0,0,0,0.25)'; } }
    if (wrongSnap === animal.name) s.animation = 'shake 0.4s ease-in-out';
    return s;
  }

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh',
      background: v.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <CelebrationOverlay mode={celebMode} score={score} onDone={() => {}} />

      {/* Background stars for rocket */}
      {isRocket && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(30)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${(i * 13.7) % 100}%`, top: `${(i * 17.3) % 100}%`,
              width: i % 3 === 0 ? '3px' : '2px', height: i % 3 === 0 ? '3px' : '2px',
              backgroundColor: '#FFF', borderRadius: '50%',
              opacity: 0.3 + (i % 5) * 0.15,
              animation: `twinkle ${1.5 + (i % 4) * 0.5}s ease-in-out infinite alternate`,
            }} />
          ))}
        </div>
      )}

      {/* Header: 10vh */}
      <div style={{
        height: '10vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <button style={{
          position: 'absolute', left: '3vw', fontSize: '3vw', background: 'none', border: 'none',
          cursor: 'pointer', padding: '2vw', color: isRocket ? '#E0E0E0' : '#5D4E37',
        }} onClick={onBack}>← 뒤로</button>
        <div style={{ fontSize: '4vw', fontWeight: 'bold', color: isRocket ? '#E0E0E0' : '#5D4E37', display: 'flex', gap: '2vw', alignItems: 'center' }}>
          {countdown != null ? <span style={{ fontSize: '8vw' }}>{countdown}</span>
            : allFilled ? <span>{v.emoji} 출발~!</span>
            : <span>{v.emoji} {nextIdx + 1}번 자리에 태워봐요!</span>}
          <span style={{ fontSize: '2.5vw', color: isRocket ? '#9E9E9E' : '#7A6B5D' }}>
            {VEHICLES.map((vv, i) => <span key={vv.id} style={{ opacity: i <= vIdx ? 1 : 0.3 }}>{vv.emoji}</span>)}
          </span>
        </div>
      </div>

      {/* Vehicle area: 55vh */}
      <div style={{
        height: '55vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative', zIndex: 5,
      }}>
        <div style={{
          width: v.svgW, height: v.svgH,
          transition: `transform ${v.departDuration} ease-in`,
          transform: departing ? v.departTransform : 'none',
        }}>
          {v.svg(round.seats, filled, nearSeat, seatRefs, departing)}
        </div>
      </div>

      {/* Cards area: 35vh */}
      <div style={{
        height: '35vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, position: 'relative', zIndex: 10,
        backgroundColor: isRocket ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{ display: 'flex', gap: '3vw', justifyContent: 'center', alignItems: 'center' }}>
          {round.cards.map((a) => {
            const placed = filled.some((fi) => round.seats[fi]?.name === a.name);
            return <div key={a.name} style={cardStyle(a)} onPointerDown={(e) => !placed && onDown(e, a)}>
              <span style={{ fontSize: '8vw', lineHeight: 1, pointerEvents: 'none' }}>{a.emoji}</span>
              <span style={{ fontSize: '2.5vw', fontWeight: 'bold', color: '#5D4E37', pointerEvents: 'none' }}>{a.name}</span>
            </div>;
          })}
        </div>
      </div>

      <style>{`
        @keyframes twinkle { 0% { opacity: 0.2; } 100% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}

// ──────────────── Main ────────────────

export default function ShadowMatch({ onBack }) {
  const [stage, setStage] = useState(1);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => { startBGM(); return () => stopBGM(); }, []);

  const bgColor = stage === 2 ? '#FFF9F0' : '#FFF9F0';

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: bgColor, padding: '2vh 3vw', overflow: 'hidden' }}>
      <MuteButton />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '1vh', flexShrink: 0 }}>
        <button style={{ fontSize: 'min(3vw,28px)', background: 'none', border: 'none', cursor: 'pointer', padding: '1vh 1vw', borderRadius: 16, color: '#5D4E37' }} onClick={onBack}>← 뒤로</button>
        <div style={{ display: 'flex', gap: '1vw', alignItems: 'center' }}>
          <button style={{ padding: '0.5vh 1.5vw', borderRadius: 14, fontSize: 'min(1.8vw,16px)', fontWeight: 'bold', cursor: 'pointer', border: '2px solid ' + (stage === 1 ? '#FFA726' : '#D4C5B0'), backgroundColor: stage === 1 ? '#FFE0B2' : '#FFF3E0', color: '#5D4E37' }} onClick={() => setStage(1)}>그림자</button>
          <button style={{ padding: '0.5vh 1.5vw', borderRadius: 14, fontSize: 'min(1.8vw,16px)', fontWeight: 'bold', cursor: 'pointer', border: '2px solid ' + (stage === 2 ? '#FFA726' : '#D4C5B0'), backgroundColor: stage === 2 ? '#FFE0B2' : '#FFF3E0', color: '#5D4E37' }} onClick={() => setStage(2)}>🚌🚢🚀 탈것</button>
          <span style={{ fontSize: 'min(2vw,18px)', color: '#7A6B5D' }}>⭐{score * 10}</span>
        </div>
        <div style={{ width: '8vw' }} />
      </div>

      {stage === 1 && <Stage1 onComplete={() => setStage(2)} score={score} total={total} setScore={setScore} setTotal={setTotal} />}
      {stage === 2 && <VehicleGame score={score} total={total} setScore={setScore} setTotal={setTotal} onBack={onBack} />}

      <style>{`
        @keyframes snapIn { 0% { transform: scale(0.5); opacity: 0.5; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
