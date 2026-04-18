import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Home, Trophy, Gamepad2, Grid3x3, Ghost, Brain, Car, Zap, Target, CircleDot, Swords, Rocket, Shield, Layers, Timer, Hash, Music, Hand } from 'lucide-react';
import { version as APP_VERSION } from '../package.json';

// --- 共用組件 ---

const Button = ({ onClick, children, className = "", variant = "primary", disabled = false }) => {
  const base = "px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 select-none touch-manipulation";
  const v = {
    primary: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 shadow-md disabled:opacity-50",
    danger: "bg-red-500 text-white hover:bg-red-600 disabled:opacity-50",
    success: "bg-green-500 text-white hover:bg-green-600 disabled:opacity-50",
    outline: "border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white disabled:opacity-50",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800",
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${className}`}>{children}</button>;
};

const Modal = ({ isOpen, title, message, onConfirm, confirmText = "確定", extraButtons }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-2 text-center">{title}</h3>
        <p className="text-slate-300 mb-6 text-center whitespace-pre-line">{message}</p>
        <div className="flex flex-col gap-3">
          <Button onClick={onConfirm} variant="primary" className="w-full">{confirmText}</Button>
          {extraButtons}
        </div>
      </div>
    </div>
  );
};

// 通用持壓按鈕 (Hold Button) - 支援觸控 + 滑鼠
const HoldBtn = ({ onStart, onEnd, children, className = "" }) => (
  <div
    className={`flex items-center justify-center font-bold text-white rounded-xl select-none touch-manipulation cursor-pointer bg-slate-700 active:bg-slate-500 border border-slate-600 transition-colors ${className}`}
    onTouchStart={e => { e.preventDefault(); onStart(); }}
    onTouchEnd={e => { e.preventDefault(); onEnd(); }}
    onMouseDown={onStart}
    onMouseUp={onEnd}
    onMouseLeave={onEnd}
  >{children}</div>
);

// 最高分持久化
const bestStorage = {
  load: key => { try { return Number(localStorage.getItem(`gb.best.${key}`)) || 0; } catch { return 0; } },
  save: (key, v) => { try { localStorage.setItem(`gb.best.${key}`, String(v)); } catch { /* quota/privacy mode */ } },
};
const updateBest = (key, current, candidate) => {
  const next = Math.max(current, candidate);
  if (next !== current) bestStorage.save(key, next);
  return next;
};

// 任一遊戲爆 runtime error 時顯示 fallback，避免白屏整站
class GameErrorBoundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error('Game crashed:', err, info); }
  reset = () => { this.setState({ err: null }); this.props.onBack?.(); };
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl">💥</div>
        <h3 className="text-xl font-bold text-white">這款遊戲出了點意外</h3>
        <p className="text-slate-400 text-sm">{String(this.state.err?.message || this.state.err)}</p>
        <button onClick={this.reset} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg">回大廳</button>
      </div>
    );
  }
}

// --- 遊戲 1: 井字遊戲 ---

const TicTacToe = ({ onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);

  const calcWinner = squares => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines)
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
        return { winner: squares[a], line: [a,b,c] };
    return null;
  };

  const handleClick = i => {
    if (winner || board[i]) return;
    const nb = [...board]; nb[i] = xIsNext ? 'X' : 'O';
    setBoard(nb); setXIsNext(!xIsNext);
    const w = calcWinner(nb);
    if (w) setWinner(w);
    else if (!nb.includes(null)) setWinner({ winner: 'Draw' });
  };

  const reset = () => { setBoard(Array(9).fill(null)); setXIsNext(true); setWinner(null); };

  return (
    <div className="flex flex-col items-center py-10 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-6 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Grid3x3 className="text-blue-400" /> 井字遊戲</h2>
        <Button onClick={reset} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700">
        <div className="grid grid-cols-3 gap-2">
          {board.map((sq, i) => (
            <button key={i}
              className={`w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl font-bold rounded-xl flex items-center justify-center transition-all touch-manipulation
                ${!sq && !winner ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700'}
                ${sq === 'X' ? 'text-blue-400' : 'text-pink-400'}
                ${winner?.line?.includes(i) ? 'bg-green-500/20 ring-2 ring-green-500' : ''}`}
              onClick={() => handleClick(i)} disabled={!!winner || !!sq}
            >{sq}</button>
          ))}
        </div>
      </div>
      <div className="mt-8 text-xl font-bold text-white bg-slate-800/50 px-6 py-3 rounded-full border border-slate-700/50">
        {winner
          ? winner.winner === 'Draw' ? <span className="text-slate-300">平手！再來一局</span> : <span className="text-green-400">玩家 {winner.winner} 獲勝！</span>
          : <span>輪到: <span className={xIsNext ? 'text-blue-400' : 'text-pink-400'}>{xIsNext ? 'X' : 'O'}</span></span>}
      </div>
    </div>
  );
};

// --- 遊戲 2: 貪吃蛇 (支援滑動手勢) ---

const SnakeGame = ({ onBack }) => {
  const GRID = 20, SPEED = 150;
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [dir, setDir] = useState({ x: 0, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => bestStorage.load('snake'));
  const [paused, setPaused] = useState(true);
  const touch = useRef(null);
  // 讓 tick 讀最新的 dir/food/score，避免 interval 每 tick 都被重建
  const tickRef = useRef({ dir, food, score });
  useEffect(() => { tickRef.current = { dir, food, score }; });

  useEffect(() => {
    const onKey = e => {
      if (gameOver) return;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} };
      const d = map[e.key];
      if (d) setDir(cur => {
        if ((d.x !== 0 && cur.x === 0) || (d.y !== 0 && cur.y === 0)) { setPaused(false); return d; }
        return cur;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameOver]);

  const swipe = dir => {
    if (gameOver) return;
    setDir(cur => {
      if ((dir.x !== 0 && cur.x === 0) || (dir.y !== 0 && cur.y === 0)) { setPaused(false); return dir; }
      return cur;
    });
  };

  useEffect(() => {
    if (paused || gameOver) return;
    const t = setInterval(() => {
      setSnake(prev => {
        const { dir: d, food: f, score: s } = tickRef.current;
        const head = { x: prev[0].x + d.x, y: prev[0].y + d.y };
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || prev.some(p => p.x === head.x && p.y === head.y)) {
          setGameOver(true); setPaused(true);
          setBest(b => updateBest('snake', b, s));
          return prev;
        }
        const ns = [head, ...prev];
        if (head.x === f.x && head.y === f.y) {
          setScore(v => v + 10);
          let nf;
          do { nf = { x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID) }; }
          while (ns.some(p => p.x === nf.x && p.y === nf.y));
          setFood(nf);
        } else ns.pop();
        return ns;
      });
    }, SPEED);
    return () => clearInterval(t);
  }, [paused, gameOver]);

  const reset = () => { setSnake([{x:10,y:10}]); setDir({x:0,y:0}); setScore(0); setGameOver(false); setPaused(true); setFood({x:15,y:10}); };
  const ctrl = d => swipe(d);

  return (
    <div className="flex flex-col items-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Ghost className="text-green-400" /> 貪吃蛇</h2>
        <Button onClick={reset} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">得分</div>
          <div className="text-2xl font-mono font-bold text-blue-400">{score}</div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">最高分</div>
          <div className="text-2xl font-mono font-bold text-yellow-400">{best}</div>
        </div>
      </div>
      <div
        className="relative bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl touch-none"
        style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
        onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={e => {
          if (!touch.current || gameOver) return;
          const dx = e.changedTouches[0].clientX - touch.current.x;
          const dy = e.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
          if (Math.abs(dx) > Math.abs(dy)) ctrl({ x: dx > 0 ? 1 : -1, y: 0 });
          else ctrl({ x: 0, y: dy > 0 ? 1 : -1 });
          touch.current = null;
        }}
      >
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID},1fr)`, gridTemplateRows: `repeat(${GRID},1fr)` }}>
          {snake.map((s, i) => (
            <div key={`${s.x}-${s.y}-${i}`}
              className={`${i===0?'bg-green-400 rounded-sm':'bg-green-600 rounded-sm'}`}
              style={{ gridColumnStart: s.x+1, gridRowStart: s.y+1 }}
            />
          ))}
          <div className="bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            style={{ gridColumnStart: food.x+1, gridRowStart: food.y+1 }}
          />
        </div>
        {paused && !gameOver && dir.x===0 && dir.y===0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
            <div className="text-center">
              <p className="text-white text-xl font-bold mb-2">滑動畫面或按方向鍵</p>
              <p className="text-slate-400 text-sm">手機：在畫面上滑動</p>
            </div>
          </div>
        )}
        <Modal isOpen={gameOver} title="遊戲結束" message={`得分：${score} 分`} onConfirm={reset} confirmText="再玩一次" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 w-44 select-none">
        <div />
        <HoldBtn onStart={() => ctrl({x:0,y:-1})} onEnd={() => {}} className="h-12">⬆️</HoldBtn>
        <div />
        <HoldBtn onStart={() => ctrl({x:-1,y:0})} onEnd={() => {}} className="h-12">⬅️</HoldBtn>
        <HoldBtn onStart={() => ctrl({x:0,y:1})} onEnd={() => {}} className="h-12">⬇️</HoldBtn>
        <HoldBtn onStart={() => ctrl({x:1,y:0})} onEnd={() => {}} className="h-12">➡️</HoldBtn>
      </div>
      <p className="text-slate-500 mt-3 text-xs text-center">手機滑動畫面 · 電腦方向鍵</p>
    </div>
  );
};

// --- 遊戲 3: 記憶翻牌 ---

const MemoryGame = ({ onBack }) => {
  const EMOJIS = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼'];
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [c1, setC1] = useState(null);
  const [c2, setC2] = useState(null);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const shuffle = () => {
    const c = [...EMOJIS,...EMOJIS].sort(()=>Math.random()-0.5).map(e=>({e,id:Math.random(),m:false}));
    setC1(null); setC2(null); setCards(c); setTurns(0); setWon(false); setLocked(false);
  };

  useEffect(() => { shuffle(); }, []);

  const pick = card => {
    if (locked || card.m || card === c1) return;
    c1 ? setC2(card) : setC1(card);
  };

  useEffect(() => {
    if (!c1 || !c2) return;
    setLocked(true);
    if (c1.e === c2.e) {
      setCards(p => p.map(c => c.e === c1.e ? {...c, m:true} : c));
      setC1(null); setC2(null); setTurns(p=>p+1); setLocked(false);
    } else {
      setTimeout(() => { setC1(null); setC2(null); setTurns(p=>p+1); setLocked(false); }, 800);
    }
  }, [c1, c2]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.m)) setTimeout(() => setWon(true), 500);
  }, [cards]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl py-10">
      <div className="flex justify-between w-full items-center mb-6 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Brain className="text-purple-400" /> 記憶翻牌</h2>
        <Button onClick={shuffle} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="bg-slate-800 px-6 py-2 rounded-full mb-6 border border-slate-700">
        <span className="text-slate-400 font-bold">回合：</span>
        <span className="text-white text-xl font-mono">{turns}</span>
      </div>
      <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4">
        {cards.map(card => (
          <div key={card.id} className="relative w-16 h-16 sm:w-20 sm:h-20 cursor-pointer perspective-1000 touch-manipulation" onClick={() => pick(card)}>
            <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${(card===c1||card===c2||card.m)?'rotate-y-180':''}`}>
              <div className="absolute w-full h-full bg-slate-700 rounded-xl border-2 border-slate-600 flex items-center justify-center backface-hidden hover:bg-slate-600">
                <span className="text-2xl">❓</span>
              </div>
              <div className={`absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center rotate-y-180 backface-hidden border-2 ${card.m?'border-yellow-400':'border-purple-300'}`}>
                <span className="text-3xl sm:text-4xl">{card.e}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal isOpen={won} title="恭喜過關！" message={`用了 ${turns} 個回合完成！`} onConfirm={shuffle} confirmText="再玩一次" />
    </div>
  );
};

// --- 遊戲 4: 俯視賽車 ---

const RacingGame = ({ onBack }) => {
  const GW = 360, GH = 500, CW = 30, CH = 50;
  const DIFF = {
    easy:   { speed: 2,   spawnRate: 0.015, pSpeed: 4 },
    normal: { speed: 3.5, spawnRate: 0.02,  pSpeed: 5 },
    hard:   { speed: 6,   spawnRate: 0.035, pSpeed: 6 },
  };

  const [status, setStatus] = useState('menu');
  const [mode, setMode] = useState(1);
  const [diff, setDiff] = useState('normal');
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState(null);
  const [, tick] = useState(0);

  const gs = useRef({
    p1: { x: 150, alive: true },
    p2: { x: 260, alive: true },
    obstacles: [],
    speed: 3, score: 0, frameId: null,
    keys: {},
    tc: { p1L: false, p1R: false, p2L: false, p2R: false },
    settings: DIFF.normal,
  });

  useEffect(() => {
    const kd = e => { gs.current.keys[e.code] = true; };
    const ku = e => { gs.current.keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
  }, []);

  const start = m => {
    cancelAnimationFrame(gs.current.frameId);
    const s = DIFF[diff];
    const p1x = m === 1 ? GW/2 - CW/2 : GW/4 - CW/2;
    gs.current = { p1:{x:p1x,alive:true}, p2:{x:3*GW/4-CW/2,alive:true}, obstacles:[], speed:s.speed, score:0, frameId:null, keys:{}, tc:{p1L:false,p1R:false,p2L:false,p2R:false}, settings:s };
    setMode(m); setScore(0); setWinner(null); setStatus('playing');
    loop(m);
  };

  const loop = m => {
    const s = gs.current;
    const { pSpeed } = s.settings;
    const half = GW / 2;
    const k = s.keys, tc = s.tc;

    if (s.p1.alive) {
      const L = k['KeyA'] || tc.p1L, R = k['KeyD'] || tc.p1R;
      if (m === 1) {
        if ((L || k['ArrowLeft'])  && s.p1.x > 0)           s.p1.x -= pSpeed;
        if ((R || k['ArrowRight']) && s.p1.x < GW-CW)       s.p1.x += pSpeed;
      } else {
        if (L && s.p1.x > 0)              s.p1.x -= pSpeed;
        if (R && s.p1.x < half-CW-2)     s.p1.x += pSpeed;
      }
    }
    if (m === 2 && s.p2.alive) {
      if ((k['ArrowLeft']  || tc.p2L) && s.p2.x > half+2)   s.p2.x -= pSpeed;
      if ((k['ArrowRight'] || tc.p2R) && s.p2.x < GW-CW)    s.p2.x += pSpeed;
    }

    if (Math.random() < s.settings.spawnRate + s.score*0.00005) {
      s.obstacles.push({ id:Math.random(), x:Math.random()*(GW-40), y:-50, w:40, h:40, t:Math.random()>0.5?'🪨':'🚧' });
    }
    s.obstacles.forEach(o => o.y += s.speed);
    const kept = s.obstacles.filter(o => o.y < GH);
    if (kept.length < s.obstacles.length) { s.score += 10; setScore(s.score); if (s.score%200===0) s.speed+=0.2; }
    s.obstacles = kept;

    const hit = p => s.obstacles.some(o => {
      const pr = {x:p.x+8,y:GH-CH-5,w:CW-16,h:CH-10};
      const or = {x:o.x+5,y:o.y+5,w:o.w-10,h:o.h-10};
      return pr.x<or.x+or.w && pr.x+pr.w>or.x && pr.y<or.y+or.h && pr.y+pr.h>or.y;
    });

    if (s.p1.alive && hit(s.p1)) s.p1.alive = false;
    if (m===2 && s.p2.alive && hit(s.p2)) s.p2.alive = false;

    if (m===1 && !s.p1.alive) { setWinner('GAME_OVER'); setStatus('gameover'); cancelAnimationFrame(s.frameId); return; }
    if (m===2) {
      if (!s.p1.alive && !s.p2.alive) { setWinner('DRAW'); setStatus('gameover'); cancelAnimationFrame(s.frameId); return; }
      if (!s.p1.alive) { setWinner('P2'); setStatus('gameover'); cancelAnimationFrame(s.frameId); return; }
      if (!s.p2.alive) { setWinner('P1'); setStatus('gameover'); cancelAnimationFrame(s.frameId); return; }
    }

    tick(p => p+1);
    s.frameId = requestAnimationFrame(() => loop(m));
  };

  useEffect(() => () => cancelAnimationFrame(gs.current.frameId), []);

  const st = key => val => { gs.current.tc[key] = val; };

  return (
    <div className="flex flex-col items-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Car className="text-red-500" /> 俯視賽車</h2>
        <Button onClick={() => { cancelAnimationFrame(gs.current.frameId); setStatus('menu'); }} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">{mode===2?'生存分數':'得分'}</div>
          <div className="text-2xl font-mono font-bold text-blue-400">{score}</div>
        </div>
      </div>
      <div className="relative bg-slate-600 border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl" style={{ width:'min(95vw,360px)', height:'min(80vh,500px)' }}>
        <div className="absolute inset-0 flex justify-center">
          <div className="h-full w-2 border-r-2 border-l-2 border-slate-400 opacity-30" style={{borderStyle:'dashed'}} />
          {mode===2 && <div className="absolute h-full w-[2px] bg-yellow-400 opacity-50" style={{left:'50%'}} />}
        </div>
        {status !== 'menu' && (
          <>
            {gs.current.obstacles.map(o => (
              <div key={o.id} className="absolute flex items-center justify-center text-3xl z-10" style={{left:o.x,top:o.y,width:o.w,height:o.h}}>{o.t}</div>
            ))}
            {gs.current.p1.alive && (
              <div className="absolute z-10" style={{left:gs.current.p1.x, top:GH-CH-10,width:CW,height:CH,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:32,display:'inline-block',transform:'rotate(-90deg)',lineHeight:1}}>🏎️</span>
                {mode===2&&<div className="absolute -top-6 left-0 text-xs font-bold text-blue-300 bg-black/50 px-1 rounded">P1</div>}
              </div>
            )}
            {mode===2 && gs.current.p2.alive && (
              <div className="absolute z-10" style={{left:gs.current.p2.x, top:GH-CH-10,width:CW,height:CH,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <span style={{fontSize:32,display:'inline-block',transform:'rotate(-90deg)',lineHeight:1}}>🚙</span>
                <div className="absolute -top-6 left-0 text-xs font-bold text-red-300 bg-black/50 px-1 rounded">P2</div>
              </div>
            )}
          </>
        )}
        {status === 'menu' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-20">
            <h3 className="text-3xl font-bold text-white mb-6 italic">TURBO RACING</h3>
            <div className="w-full mb-6">
              <p className="text-slate-400 text-sm mb-2 text-center">難度</p>
              <div className="grid grid-cols-3 gap-2">
                {['easy','normal','hard'].map(d => (
                  <button key={d} onClick={() => setDiff(d)}
                    className={`p-2 rounded-lg text-sm font-bold transition-all ${diff===d?'bg-yellow-500 text-black':'bg-slate-700 text-slate-400'}`}>
                    {d==='easy'?'簡單':d==='normal'?'普通':'困難'}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full space-y-3">
              <button onClick={() => start(1)} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="bg-white/20 p-2 rounded-lg">👤</span>單人挑戰</div><Play size={18}/>
              </button>
              <button onClick={() => start(2)} className="w-full bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl font-bold flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="bg-white/20 p-2 rounded-lg">👥</span>雙人對決</div><Play size={18}/>
              </button>
            </div>
          </div>
        )}
      </div>

      {status === 'playing' && (
        <div className="mt-4 w-full max-w-sm px-4">
          {mode===1 ? (
            <div className="flex gap-4 justify-center">
              <HoldBtn onStart={st('p1L')(true)} onEnd={st('p1L')(false)} className="w-28 h-14 text-2xl">◀</HoldBtn>
              <HoldBtn onStart={st('p1R')(true)} onEnd={st('p1R')(false)} className="w-28 h-14 text-2xl">▶</HoldBtn>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              <div className="flex flex-col items-center gap-1">
                <p className="text-slate-500 text-xs">P1 (WASD)</p>
                <div className="flex gap-2">
                  <HoldBtn onStart={st('p1L')(true)} onEnd={st('p1L')(false)} className="w-16 h-14 text-2xl">◀</HoldBtn>
                  <HoldBtn onStart={st('p1R')(true)} onEnd={st('p1R')(false)} className="w-16 h-14 text-2xl">▶</HoldBtn>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-slate-500 text-xs">P2 (←→)</p>
                <div className="flex gap-2">
                  <HoldBtn onStart={st('p2L')(true)} onEnd={st('p2L')(false)} className="w-16 h-14 text-2xl">◀</HoldBtn>
                  <HoldBtn onStart={st('p2R')(true)} onEnd={st('p2R')(false)} className="w-16 h-14 text-2xl">▶</HoldBtn>
                </div>
              </div>
            </div>
          )}
          <p className="text-slate-500 text-xs text-center mt-2">按住按鈕持續移動</p>
        </div>
      )}

      <Modal
        isOpen={status==='gameover'}
        title={winner==='GAME_OVER'?'💥 發生車禍！':'🏆 比賽結束'}
        message={
          winner==='GAME_OVER' ? `難度：${diff==='easy'?'簡單':diff==='normal'?'普通':'困難'}\n得分：${score}` :
          winner==='DRAW' ? '兩敗俱傷！平局。' :
          `恭喜 ${winner==='P1'?'玩家 1':'玩家 2'} 獲勝！\n堅持了 ${score} 分`
        }
        onConfirm={() => setStatus('menu')}
        confirmText="回主選單"
        extraButtons={<Button onClick={() => start(mode)} variant="secondary" className="w-full">再玩一次</Button>}
      />
    </div>
  );
};

// --- 遊戲 5: 第一人稱賽車 (Pseudo-3D) ---

const FPRacingGame = ({ onBack }) => {
  const W = 360, H = 500;
  const HORIZON = 160;
  const MAX_Z = 20;
  const ROAD_HW = 1.0; // road half-width in world units

  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStatus, setGameStatus] = useState('menu');

  const gs = useRef({
    playerX: 0, speed: 0.25, distance: 0,
    obstacles: [], lives: 3, score: 0,
    frameId: null, keys: {},
    tc: { left: false, right: false },
    invincible: 0, spawnTimer: 0,
  });

  useEffect(() => {
    const kd = e => { gs.current.keys[e.code] = true; if(['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault(); };
    const ku = e => { gs.current.keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); cancelAnimationFrame(gs.current.frameId); };
  }, []);

  const drawFrame = (ctx, s) => {
    ctx.clearRect(0, 0, W, H);

    // Sky
    const sky = ctx.createLinearGradient(0, 0, 0, HORIZON);
    sky.addColorStop(0, '#060d2e');
    sky.addColorStop(1, '#1a3a6b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, HORIZON);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (let i = 0; i < 35; i++) ctx.fillRect((i*113+17)%W, (i*67+11)%(HORIZON-10), 1.5, 1.5);

    // Road row-by-row (bottom = near, top = horizon)
    for (let y = H - 1; y >= HORIZON; y--) {
      const t = (y - HORIZON) / (H - HORIZON); // 0 at horizon, 1 at bottom
      const roadHW = t * 155;
      const cx = W / 2 - s.playerX * t * 90;

      // Grass (alternating strips for speed feel)
      const seg = Math.floor(s.distance + (1 - t) * 30);
      ctx.fillStyle = seg % 6 < 3 ? '#15803d' : '#166534';
      ctx.fillRect(0, y, W, 1);

      // Road surface
      ctx.fillStyle = seg % 4 < 2 ? '#475569' : '#3f4f63';
      ctx.fillRect(cx - roadHW, y, roadHW * 2, 1);

      // Road edges (yellow)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(cx - roadHW, y, 3, 1);
      ctx.fillRect(cx + roadHW - 3, y, 3, 1);

      // Center dashes
      if (seg % 8 < 4) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(cx - 2, y, 4, 1);
      }
    }

    // Obstacles (far to near)
    const sorted = [...s.obstacles].sort((a, b) => b.z - a.z);
    for (const obs of sorted) {
      if (obs.z < 0.5 || obs.z > MAX_Z) continue;
      const t = 1 - obs.z / MAX_Z;
      const cx = W / 2 - s.playerX * t * 90;
      const sx = cx + (obs.x * t * 90);
      const sy = HORIZON + t * (H - HORIZON);
      const sz = Math.floor(t * 85);
      if (sz < 6) continue;
      ctx.font = `${sz}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(obs.emoji, sx, sy + sz * 0.1);
    }

    // Player car
    const flash = s.invincible > 0 && Math.floor(s.invincible / 6) % 2 === 1;
    if (!flash) {
      ctx.font = '50px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🏎️', W / 2, H - 15);
    }

    // Speed bar
    const spd = (s.speed - 0.25) / 1.25;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(W - 18, H - 95, 10, 85);
    ctx.fillStyle = `hsl(${Math.floor(120 - spd * 120)}, 90%, 50%)`;
    if (spd > 0) ctx.fillRect(W - 18, H - 10 - spd * 80, 10, spd * 80);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPD', W - 19, H - 4);
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gs.current;

    // Lateral movement
    if (s.keys['ArrowLeft']  || s.keys['KeyA'] || s.tc.left)  s.playerX = Math.max(-ROAD_HW + 0.3, s.playerX - 0.022);
    if (s.keys['ArrowRight'] || s.keys['KeyD'] || s.tc.right) s.playerX = Math.min(ROAD_HW - 0.3,  s.playerX + 0.022);

    // Progress
    s.distance += s.speed;
    s.speed = Math.min(1.5, 0.25 + s.distance * 0.00035);
    s.score = Math.floor(s.distance);

    // Spawn
    s.spawnTimer++;
    if (s.spawnTimer >= Math.max(22, 55 - s.speed * 18)) {
      s.spawnTimer = 0;
      const emojis = ['🚗','🚕','🚙','🚌','🚧','🪨','🚐'];
      s.obstacles.push({ x: (Math.random() * 2 - 1) * 0.75, z: MAX_Z - 0.5, emoji: emojis[Math.floor(Math.random() * emojis.length)] });
    }

    // Move obstacles toward player
    s.obstacles.forEach(o => o.z -= s.speed * 0.38);
    s.obstacles = s.obstacles.filter(o => o.z > -0.5);

    // Collision
    if (s.invincible > 0) {
      s.invincible--;
    } else {
      for (const obs of s.obstacles) {
        if (obs.z < 0.4 || obs.z > 1.8) continue;
        if (Math.abs(obs.x - s.playerX) < 0.42) {
          s.lives--;
          s.invincible = 90;
          setLives(s.lives);
          if (s.lives <= 0) {
            setScore(s.score);
            setGameStatus('gameover');
            drawFrame(ctx, s);
            return;
          }
          break;
        }
      }
    }

    if (s.distance % 80 < s.speed) setScore(s.score);
    drawFrame(ctx, s);
    s.frameId = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
    cancelAnimationFrame(gs.current.frameId);
    Object.assign(gs.current, { playerX:0, speed:0.25, distance:0, obstacles:[], lives:3, score:0, invincible:0, spawnTimer:0, keys:{}, tc:{left:false,right:false} });
    setScore(0); setLives(3); setGameStatus('playing');
    gameLoop();
  };

  const setTC = (k, v) => { gs.current.tc[k] = v; };

  return (
    <div className="flex flex-col items-center w-full py-6">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Car className="text-orange-400" /> 第一人稱賽車</h2>
        <Button onClick={() => { cancelAnimationFrame(gs.current.frameId); setGameStatus('menu'); }} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="flex gap-4 mb-3">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">得分</div>
          <div className="text-2xl font-mono font-bold text-orange-400">{score}</div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">生命</div>
          <div className="text-xl">{Array.from({length: lives}).map((_, i) => <span key={i}>❤️</span>)}</div>
        </div>
      </div>
      <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-slate-700">
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', maxWidth: '95vw' }} />
        {gameStatus === 'menu' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <h3 className="text-3xl font-bold text-white mb-2 italic tracking-widest">SPEED RACER</h3>
            <p className="text-slate-400 text-sm mb-6 text-center px-6">閃避前方車輛！越開越快，3 條命用完即結束</p>
            <Button onClick={startGame} className="px-8 py-3 text-lg"><Play size={20} /> 開始</Button>
          </div>
        )}
      </div>
      {gameStatus === 'playing' && (
        <div className="mt-4 flex gap-6">
          <HoldBtn onStart={() => setTC('left',true)} onEnd={() => setTC('left',false)} className="w-32 h-16 text-2xl">◀ 左轉</HoldBtn>
          <HoldBtn onStart={() => setTC('right',true)} onEnd={() => setTC('right',false)} className="w-32 h-16 text-2xl">右轉 ▶</HoldBtn>
        </div>
      )}
      <p className="text-slate-500 text-xs mt-2">← → 鍵盤 · 手機按住按鈕持續轉向</p>
      <Modal
        isOpen={gameStatus === 'gameover'}
        title="💥 撞車了！"
        message={`最終得分：${score}`}
        onConfirm={startGame}
        confirmText="再玩一次"
        extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>}
      />
    </div>
  );
};

// --- 遊戲 6: 乒乓球 ---

const PongGame = ({ onBack }) => {
  const W = 360, H = 500, PW = 60, PH = 12, BR = 8, WIN = 5;

  const canvasRef = useRef(null);
  const [mode, setMode] = useState(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [over, setOver] = useState(null);

  const gs = useRef({
    ball: { x: W/2, y: H/2, vx: 3, vy: 4 },
    p1: { x: W/2 - PW/2 }, p2: { x: W/2 - PW/2 },
    p1s: 0, p2s: 0, frameId: null, keys: {},
    tc: { p1L: false, p1R: false, p2L: false, p2R: false },
  });
  const [, tick] = useState(0);

  useEffect(() => {
    const kd = e => { gs.current.keys[e.code] = true; };
    const ku = e => { gs.current.keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); cancelAnimationFrame(gs.current.frameId); };
  }, []);

  const start = m => {
    cancelAnimationFrame(gs.current.frameId);
    const s = gs.current;
    s.ball = { x:W/2, y:H/2, vx:3*(Math.random()>0.5?1:-1), vy:4 };
    s.p1 = {x:W/2-PW/2}; s.p2 = {x:W/2-PW/2};
    s.p1s = 0; s.p2s = 0;
    s.keys = {}; s.tc = {p1L:false,p1R:false,p2L:false,p2R:false};
    setP1Score(0); setP2Score(0); setOver(null); setMode(m);
    pongLoop(m);
  };

  const pongLoop = m => {
    const s = gs.current;
    const SPD = 5;
    const {k, tc} = {k: s.keys, tc: s.tc};

    // P1 (bottom)
    if (s.keys['ArrowLeft']  || tc.p1L) s.p1.x = Math.max(0, s.p1.x - SPD);
    if (s.keys['ArrowRight'] || tc.p1R) s.p1.x = Math.min(W-PW, s.p1.x + SPD);

    // P2 (top)
    if (m === 2) {
      if (s.keys['KeyA'] || tc.p2L) s.p2.x = Math.max(0, s.p2.x - SPD);
      if (s.keys['KeyD'] || tc.p2R) s.p2.x = Math.min(W-PW, s.p2.x + SPD);
    } else {
      // CPU
      const center = s.p2.x + PW/2;
      if (center < s.ball.x - 5) s.p2.x = Math.min(W-PW, s.p2.x + 3.5);
      else if (center > s.ball.x + 5) s.p2.x = Math.max(0, s.p2.x - 3.5);
    }

    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    // Wall bounce
    if (s.ball.x - BR <= 0) { s.ball.x = BR; s.ball.vx = Math.abs(s.ball.vx); }
    if (s.ball.x + BR >= W) { s.ball.x = W-BR; s.ball.vx = -Math.abs(s.ball.vx); }

    // P1 paddle (bottom) bounce
    const p1y = H - PH - 10;
    if (s.ball.vy > 0 && s.ball.y+BR >= p1y && s.ball.y+BR <= p1y+PH && s.ball.x+BR > s.p1.x && s.ball.x-BR < s.p1.x+PW) {
      s.ball.vy = -Math.abs(s.ball.vy);
      s.ball.vx = ((s.ball.x - (s.p1.x+PW/2)) / (PW/2)) * 5;
      s.ball.y = p1y - BR;
    }
    // P2 paddle (top) bounce
    const p2y = PH + 10;
    if (s.ball.vy < 0 && s.ball.y-BR <= p2y+PH && s.ball.y-BR >= p2y && s.ball.x+BR > s.p2.x && s.ball.x-BR < s.p2.x+PW) {
      s.ball.vy = Math.abs(s.ball.vy);
      s.ball.vx = ((s.ball.x - (s.p2.x+PW/2)) / (PW/2)) * 5;
      s.ball.y = p2y + PH + BR;
    }

    // Scoring
    if (s.ball.y > H) {
      s.p2s++; setP2Score(s.p2s);
      if (s.p2s >= WIN) { setOver('p2'); cancelAnimationFrame(s.frameId); return; }
      s.ball = {x:W/2,y:H/2,vx:3*(Math.random()>0.5?1:-1),vy:4};
    }
    if (s.ball.y < 0) {
      s.p1s++; setP1Score(s.p1s);
      if (s.p1s >= WIN) { setOver('p1'); cancelAnimationFrame(s.frameId); return; }
      s.ball = {x:W/2,y:H/2,vx:3*(Math.random()>0.5?1:-1),vy:-4};
    }

    tick(p => p+1);
    s.frameId = requestAnimationFrame(() => pongLoop(m));
  };

  useEffect(() => () => cancelAnimationFrame(gs.current.frameId), []);
  const setTC = (k, v) => { gs.current.tc[k] = v; };
  const s = gs.current;

  if (mode === null) return (
    <div className="flex flex-col items-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-6 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CircleDot className="text-cyan-400" /> 乒乓球</h2>
        <div className="w-10" />
      </div>
      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-sm w-full mx-4 space-y-4">
        <button onClick={() => start(1)} className="w-full bg-cyan-700 hover:bg-cyan-600 text-white p-4 rounded-xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="bg-white/20 p-2 rounded-lg">👤</span>單人 vs CPU</div><Play size={18}/>
        </button>
        <button onClick={() => start(2)} className="w-full bg-orange-700 hover:bg-orange-600 text-white p-4 rounded-xl font-bold flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="bg-white/20 p-2 rounded-lg">👥</span>雙人對戰</div><Play size={18}/>
        </button>
        <p className="text-slate-500 text-xs text-center">先得 {WIN} 分者獲勝</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CircleDot className="text-cyan-400" /> 乒乓球</h2>
        <Button onClick={() => { cancelAnimationFrame(s.frameId); setMode(null); }} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="flex gap-8 mb-4">
        <div className="text-center">
          <div className="text-slate-400 text-xs">{mode===2?'P2':'CPU'} (上)</div>
          <div className="text-4xl font-mono font-bold text-orange-400">{p2Score}</div>
        </div>
        <div className="text-slate-600 text-2xl self-center">:</div>
        <div className="text-center">
          <div className="text-slate-400 text-xs">P1 (下)</div>
          <div className="text-4xl font-mono font-bold text-cyan-400">{p1Score}</div>
        </div>
      </div>
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl" style={{ width: W, height: H, maxWidth: '95vw' }}>
        <div className="absolute w-full border-t-2 border-dashed border-slate-700 opacity-40" style={{ top: H/2 }} />
        <div className="absolute bg-orange-400 rounded-full" style={{ left: s.p2.x, top: PH+10, width: PW, height: PH }} />
        <div className="absolute bg-cyan-400 rounded-full" style={{ left: s.p1.x, top: H-PH-10, width: PW, height: PH }} />
        <div className="absolute bg-white rounded-full shadow-[0_0_8px_white]" style={{ left: s.ball.x-BR, top: s.ball.y-BR, width: BR*2, height: BR*2 }} />
        <div className="absolute top-2 left-2 text-slate-500 text-xs">{mode===2?'P2 (WASD)':'CPU'}</div>
        <div className="absolute bottom-2 left-2 text-slate-500 text-xs">P1 (← →)</div>
      </div>
      <div className="mt-4 w-full max-w-sm px-4">
        {mode === 2 ? (
          <div className="flex justify-between">
            <div className="flex flex-col items-center gap-1">
              <p className="text-slate-500 text-xs">P2 (上方)</p>
              <div className="flex gap-2">
                <HoldBtn onStart={() => setTC('p2L',true)} onEnd={() => setTC('p2L',false)} className="w-16 h-14 text-2xl">◀</HoldBtn>
                <HoldBtn onStart={() => setTC('p2R',true)} onEnd={() => setTC('p2R',false)} className="w-16 h-14 text-2xl">▶</HoldBtn>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-slate-500 text-xs">P1 (下方)</p>
              <div className="flex gap-2">
                <HoldBtn onStart={() => setTC('p1L',true)} onEnd={() => setTC('p1L',false)} className="w-16 h-14 text-2xl">◀</HoldBtn>
                <HoldBtn onStart={() => setTC('p1R',true)} onEnd={() => setTC('p1R',false)} className="w-16 h-14 text-2xl">▶</HoldBtn>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <HoldBtn onStart={() => setTC('p1L',true)} onEnd={() => setTC('p1L',false)} className="w-28 h-14 text-2xl">◀</HoldBtn>
            <HoldBtn onStart={() => setTC('p1R',true)} onEnd={() => setTC('p1R',false)} className="w-28 h-14 text-2xl">▶</HoldBtn>
          </div>
        )}
        <p className="text-slate-500 text-xs text-center mt-2">{mode===2?'P1: ←→ | P2: WASD':'P1: ←→ | 手機按按鈕'}</p>
      </div>
      <Modal
        isOpen={!!over}
        title={over==='p1'?'🏆 P1 勝利！':mode===2?'🏆 P2 勝利！':'😈 CPU 勝利！'}
        message={`比分 ${p2Score} : ${p1Score}`}
        onConfirm={() => setMode(null)}
        confirmText="回主選單"
        extraButtons={<Button onClick={() => start(mode)} variant="secondary" className="w-full">再玩一次</Button>}
      />
    </div>
  );
};

// --- 遊戲 7: 打地鼠 ---

const WhackAMole = ({ onBack }) => {
  const TOTAL = 9, TIME = 30;
  const [moles, setMoles] = useState(Array(TOTAL).fill(false));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => bestStorage.load('whackamole'));
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const scoreRef = useRef(0);
  const moleTimers = useRef([]);

  const spawnMole = useCallback(() => {
    const i = Math.floor(Math.random() * TOTAL);
    setMoles(p => { const n=[...p]; n[i]=true; return n; });
    const t = setTimeout(() => setMoles(p => { const n=[...p]; n[i]=false; return n; }), 900);
    moleTimers.current.push(t);
  }, []);

  const startGame = () => {
    moleTimers.current.forEach(clearTimeout);
    moleTimers.current = [];
    scoreRef.current = 0;
    setScore(0); setTimeLeft(TIME); setOver(false);
    setMoles(Array(TOTAL).fill(false));
    setRunning(true);
  };

  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(spawnMole, 700);
    const countdown = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(spawn); clearInterval(countdown);
          moleTimers.current.forEach(clearTimeout);
          setMoles(Array(TOTAL).fill(false));
          setBest(b => updateBest('whackamole', b, scoreRef.current));
          setRunning(false); setOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { clearInterval(spawn); clearInterval(countdown); moleTimers.current.forEach(clearTimeout); };
  }, [running, spawnMole]);

  const whack = i => {
    if (!moles[i] || !running) return;
    setMoles(p => { const n=[...p]; n[i]=false; return n; });
    scoreRef.current++;
    setScore(scoreRef.current);
  };

  return (
    <div className="flex flex-col items-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Target className="text-yellow-400" /> 打地鼠</h2>
        <Button onClick={startGame} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">得分</div>
          <div className="text-2xl font-mono font-bold text-yellow-400">{score}</div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">最高</div>
          <div className="text-2xl font-mono font-bold text-orange-400">{best}</div>
        </div>
        <div className={`bg-slate-800 px-4 py-2 rounded-lg border text-center ${timeLeft<=10?'border-red-500':'border-slate-700'}`}>
          <div className="text-slate-400 text-xs">時間</div>
          <div className={`text-2xl font-mono font-bold ${timeLeft<=10?'text-red-400 animate-pulse':'text-green-400'}`}>{timeLeft}s</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 p-2">
        {moles.map((hasMole, i) => (
          <button key={i} onClick={() => whack(i)}
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 flex items-center justify-center transition-all duration-100 touch-manipulation select-none
              ${hasMole ? 'bg-amber-800 border-amber-600 scale-95 shadow-lg' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
          >
            {hasMole ? <span className="text-4xl sm:text-5xl animate-bounce">🐭</span> : <span className="text-2xl opacity-30">🕳️</span>}
          </button>
        ))}
      </div>
      {!running && !over && (
        <Button onClick={startGame} className="mt-6 px-8 py-3 text-lg"><Play size={20} /> 開始遊戲</Button>
      )}
      <Modal
        isOpen={over}
        title="時間到！"
        message={`你打了 ${score} 隻地鼠！${score > 0 && score === best ? '\n🎉 新紀錄！' : ''}`}
        onConfirm={startGame}
        confirmText="再玩一次"
        extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>}
      />
    </div>
  );
};

// --- 遊戲 8: 打磚塊 ---

const BreakoutGame = ({ onBack }) => {
  const W = 360, H = 480, PW = 70, PH = 10, BR = 8;
  const ROWS = 5, COLS = 8;
  const BW = W/COLS - 4, BH = 20;
  const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6'];

  const canvasRef = useRef(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('idle');
  const [speed, setSpeed] = useState('normal');

  const SPEEDS = { slow:{vx:2,vy:-2.8}, normal:{vx:3,vy:-4}, fast:{vx:4.5,vy:-6} };

  const gs = useRef({
    ball: {x:W/2,y:H-70,vx:3,vy:-4}, pad:{x:W/2-PW/2},
    bricks: [], lives:3, score:0, frameId:null, keys:{},
    tc: {left:false,right:false}, speed:'normal',
  });

  const initBricks = () => Array.from({length:ROWS},(_, r) =>
    Array.from({length:COLS},(_, c) => ({
      x: c*(BW+4)+2, y: r*(BH+4)+40,
      alive: true, color: COLORS[r],
    }))
  ).flat();

  const startGame = () => {
    cancelAnimationFrame(gs.current.frameId);
    const s = gs.current;
    const sp = SPEEDS[s.speed||'normal'];
    s.ball = {x:W/2,y:H-70,vx:sp.vx*(Math.random()>0.5?1:-1),vy:sp.vy};
    s.pad = {x:W/2-PW/2}; s.bricks = initBricks();
    s.lives = 3; s.score = 0; s.keys = {}; s.tc = {left:false,right:false};
    setLives(3); setScore(0); setStatus('playing');
    breakLoop();
  };

  const breakLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gs.current;
    const SPD = 5;

    if (s.keys['ArrowLeft']  || s.keys['KeyA'] || s.tc.left)  s.pad.x = Math.max(0, s.pad.x - SPD);
    if (s.keys['ArrowRight'] || s.keys['KeyD'] || s.tc.right) s.pad.x = Math.min(W-PW, s.pad.x + SPD);

    s.ball.x += s.ball.vx;
    s.ball.y += s.ball.vy;

    if (s.ball.x - BR <= 0) { s.ball.x = BR; s.ball.vx = Math.abs(s.ball.vx); }
    if (s.ball.x + BR >= W) { s.ball.x = W-BR; s.ball.vx = -Math.abs(s.ball.vx); }
    if (s.ball.y - BR <= 0) { s.ball.y = BR; s.ball.vy = Math.abs(s.ball.vy); }

    // Paddle bounce
    if (s.ball.vy > 0 && s.ball.y+BR >= H-PH-10 && s.ball.y+BR <= H-10 && s.ball.x > s.pad.x-BR && s.ball.x < s.pad.x+PW+BR) {
      s.ball.vy = -Math.abs(s.ball.vy);
      s.ball.vx = ((s.ball.x - (s.pad.x+PW/2)) / (PW/2)) * 5;
      s.ball.y = H - PH - 10 - BR;
    }

    // Ball lost
    if (s.ball.y - BR > H) {
      s.lives--; setLives(s.lives);
      if (s.lives <= 0) { cancelAnimationFrame(s.frameId); drawBreakout(ctx, s); setStatus('dead'); return; }
      const sp2 = SPEEDS[s.speed||'normal'];
      s.ball = {x:W/2,y:H-70,vx:sp2.vx*(Math.random()>0.5?1:-1),vy:sp2.vy};
    }

    // Brick collision
    for (const b of s.bricks) {
      if (!b.alive) continue;
      if (s.ball.x+BR > b.x && s.ball.x-BR < b.x+BW && s.ball.y+BR > b.y && s.ball.y-BR < b.y+BH) {
        b.alive = false; s.score += 10; setScore(s.score);
        const ox = Math.min(s.ball.x+BR - b.x, b.x+BW - (s.ball.x-BR));
        const oy = Math.min(s.ball.y+BR - b.y, b.y+BH - (s.ball.y-BR));
        if (ox < oy) s.ball.vx *= -1; else s.ball.vy *= -1;
        break;
      }
    }

    if (s.bricks.every(b => !b.alive)) { cancelAnimationFrame(s.frameId); drawBreakout(ctx, s); setStatus('won'); return; }

    drawBreakout(ctx, s);
    s.frameId = requestAnimationFrame(breakLoop);
  };

  const drawBreakout = (ctx, s) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);
    for (const b of s.bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, BW, BH);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(b.x, b.y, BW, 3);
    }
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath(); ctx.roundRect(s.pad.x, H-PH-10, PW, PH, 5); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, BR, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 10; ctx.shadowColor = 'white'; ctx.fill(); ctx.shadowBlur = 0;
  };

  useEffect(() => {
    const kd = e => { gs.current.keys[e.code] = true; };
    const ku = e => { gs.current.keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); cancelAnimationFrame(gs.current.frameId); };
  }, []);

  const setTC = (k, v) => { gs.current.tc[k] = v; };

  return (
    <div className="flex flex-col items-center w-full py-6">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Zap className="text-yellow-400" /> 打磚塊</h2>
        <Button onClick={startGame} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>
      <div className="flex gap-4 mb-3 flex-wrap justify-center items-center">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">得分</div>
          <div className="text-2xl font-mono font-bold text-yellow-400">{score}</div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">生命</div>
          <div className="text-xl">{Array.from({length: lives}).map((_, i) => <span key={i}>❤️</span>)}</div>
        </div>
        <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs mb-1">速度</div>
          <div className="flex gap-1">
            {['slow','normal','fast'].map(s=>(
              <button key={s} onClick={()=>{ setSpeed(s); gs.current.speed=s; }}
                className={`text-xs px-2 py-0.5 rounded font-bold transition-all ${speed===s?'bg-blue-600 text-white':'bg-slate-700 text-slate-400 hover:text-white'}`}>
                {s==='slow'?'慢':s==='normal'?'普通':'快'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden" style={{ width: W, height: H, maxWidth: '95vw' }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', maxWidth: '95vw' }} />
        {status === 'idle' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Button onClick={startGame} className="px-8 py-3 text-lg"><Play size={20} /> 開始遊戲</Button>
          </div>
        )}
      </div>
      {status === 'playing' && (
        <div className="mt-4 flex gap-6">
          <HoldBtn onStart={() => setTC('left',true)} onEnd={() => setTC('left',false)} className="w-28 h-14 text-2xl">◀</HoldBtn>
          <HoldBtn onStart={() => setTC('right',true)} onEnd={() => setTC('right',false)} className="w-28 h-14 text-2xl">▶</HoldBtn>
        </div>
      )}
      <p className="text-slate-500 text-xs mt-2">← → / WASD · 手機按住按鈕</p>
      <Modal isOpen={status==='dead'} title="💔 遊戲結束" message={`得分：${score}`} onConfirm={startGame} confirmText="再玩一次"
        extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>} />
      <Modal isOpen={status==='won'} title="🎉 全部清除！" message={`完美！得分：${score}`} onConfirm={startGame} confirmText="再玩一次"
        extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>} />
    </div>
  );
};

// --- 遊戲 9: 四子棋 (Connect Four) ---

const ConnectFour = ({ onBack }) => {
  const COLS = 7, ROWS = 6;
  const [board, setBoard] = useState(() => Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
  const [turn, setTurn] = useState(1);
  const [winner, setWinner] = useState(null);
  const [winLine, setWinLine] = useState([]);

  const check4 = (b, r, c, p) => {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      let cells = [];
      for (let i = -3; i <= 3; i++) {
        const nr = r+dr*i, nc = c+dc*i;
        if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&b[nr][nc]===p) cells.push([nr,nc]);
        else cells = [];
        if (cells.length === 4) return cells;
      }
    }
    return null;
  };

  const drop = col => {
    if (winner) return;
    let row = -1;
    for (let r = ROWS-1; r >= 0; r--) if (!board[r][col]) { row = r; break; }
    if (row === -1) return;
    const nb = board.map(r => [...r]);
    nb[row][col] = turn;
    const win = check4(nb, row, col, turn);
    if (win) { setWinner(turn); setWinLine(win); }
    else if (nb.every(r => r.every(c => c !== 0))) setWinner('draw');
    else setTurn(t => t===1 ? 2 : 1);
    setBoard(nb);
  };

  const reset = () => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(0)));
    setTurn(1); setWinner(null); setWinLine([]);
  };

  const isWin = (r, c) => winLine.some(([wr,wc]) => wr===r && wc===c);

  return (
    <div className="flex flex-col items-center w-full py-10">
      <div className="flex justify-between w-full max-w-lg items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Swords className="text-blue-400"/> 四子棋</h2>
        <Button onClick={reset} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>

      <div className={`mb-5 px-6 py-2 rounded-full border font-bold text-lg transition-all
        ${!winner ? (turn===1?'bg-red-500/20 border-red-500/50 text-red-400':'bg-yellow-500/20 border-yellow-500/50 text-yellow-400') : 'bg-slate-800 border-slate-700 text-white'}`}>
        {winner
          ? (winner==='draw' ? '平局！' : <span style={{color:winner===1?'#f87171':'#facc15'}}>玩家 {winner} 獲勝！🏆</span>)
          : <span>玩家 <span style={{color:turn===1?'#f87171':'#facc15'}}>{turn}</span> 的回合</span>}
      </div>

      <div className="bg-blue-900 p-3 rounded-2xl shadow-2xl border-2 border-blue-700">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {Array.from({length:COLS}, (_,c) => (
            <button key={c} onClick={() => drop(c)} disabled={!!winner}
              className={`h-8 rounded-lg text-sm font-bold transition-all touch-manipulation
                ${!winner ? (turn===1?'hover:bg-red-500/40 text-red-300':'hover:bg-yellow-500/40 text-yellow-300') : 'text-slate-600'}`}>
              ▼
            </button>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {board.map((row,r) => row.map((cell,c) => (
            <div key={`${r}-${c}`}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 transition-all duration-300 cursor-pointer
                ${cell===1 ? 'bg-red-500 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}
                ${cell===2 ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : ''}
                ${cell===0 ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : ''}
                ${isWin(r,c) ? 'ring-4 ring-white scale-110' : ''}`}
              onClick={() => drop(c)}
            />
          )))}
        </div>
      </div>

      <p className="mt-4 text-slate-500 text-sm">
        <span className="text-red-400 font-bold">●</span> P1 vs <span className="text-yellow-400 font-bold">●</span> P2 · 先連 4 子者獲勝
      </p>
      {winner && <Button onClick={reset} className="mt-4 px-8">再玩一次</Button>}
    </div>
  );
};

// --- 遊戲 10: 雙人貪吃蛇 ---

const Snake2P = ({ onBack }) => {
  const GRID = 20, SPEED = 140;
  const gsRef = useRef(null);
  const [, tick] = useState(0);
  const [over, setOver] = useState(false);
  const [running, setRunning] = useState(false);

  const genFood = s => {
    let f;
    do {
      f = { x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID) };
    } while (s.p1.body.some(b=>b.x===f.x&&b.y===f.y) || s.p2.body.some(b=>b.x===f.x&&b.y===f.y));
    s.food = f;
  };

  const initState = () => ({
    p1: { body:[{x:4,y:10},{x:3,y:10},{x:2,y:10}], dir:{x:1,y:0}, next:{x:1,y:0}, score:0, alive:true },
    p2: { body:[{x:15,y:10},{x:16,y:10},{x:17,y:10}], dir:{x:-1,y:0}, next:{x:-1,y:0}, score:0, alive:true },
    food: {x:10,y:5}, intervalId: null,
  });

  const start = () => {
    if (gsRef.current?.intervalId) clearInterval(gsRef.current.intervalId);
    gsRef.current = initState();
    setOver(false); setRunning(true);
  };

  useEffect(() => {
    if (!running || !gsRef.current) return;
    const s = gsRef.current;
    const id = setInterval(() => {
      const { p1, p2 } = s;
      p1.dir = p1.next; p2.dir = p2.next;

      const move = p => {
        if (!p.alive) return;
        const head = { x: p.body[0].x+p.dir.x, y: p.body[0].y+p.dir.y };
        if (head.x<0||head.x>=GRID||head.y<0||head.y>=GRID) { p.alive=false; return; }
        const nb = [head, ...p.body];
        if (head.x===s.food.x && head.y===s.food.y) { p.score+=10; genFood(s); } else nb.pop();
        p.body = nb;
      };

      move(p1); move(p2);

      if (p1.alive && p1.body.slice(1).some(b=>b.x===p1.body[0].x&&b.y===p1.body[0].y)) p1.alive=false;
      if (p2.alive && p2.body.slice(1).some(b=>b.x===p2.body[0].x&&b.y===p2.body[0].y)) p2.alive=false;
      if (p1.alive && p2.body.some(b=>b.x===p1.body[0].x&&b.y===p1.body[0].y)) p1.alive=false;
      if (p2.alive && p1.body.some(b=>b.x===p2.body[0].x&&b.y===p2.body[0].y)) p2.alive=false;

      if (!p1.alive || !p2.alive) { clearInterval(id); setRunning(false); setOver(true); }
      tick(p => p+1);
    }, SPEED);
    s.intervalId = id;
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    const kd = e => {
      const s = gsRef.current; if (!s) return;
      const { p1, p2 } = s;
      if (e.key==='w'||e.key==='W') { if(p1.dir.y===0) p1.next={x:0,y:-1}; }
      if (e.key==='s'||e.key==='S') { if(p1.dir.y===0) p1.next={x:0,y:1}; }
      if (e.key==='a'||e.key==='A') { if(p1.dir.x===0) p1.next={x:-1,y:0}; }
      if (e.key==='d'||e.key==='D') { if(p1.dir.x===0) p1.next={x:1,y:0}; }
      if (e.key==='ArrowUp')    { e.preventDefault(); if(p2.dir.y===0) p2.next={x:0,y:-1}; }
      if (e.key==='ArrowDown')  { e.preventDefault(); if(p2.dir.y===0) p2.next={x:0,y:1}; }
      if (e.key==='ArrowLeft')  { e.preventDefault(); if(p2.dir.x===0) p2.next={x:-1,y:0}; }
      if (e.key==='ArrowRight') { e.preventDefault(); if(p2.dir.x===0) p2.next={x:1,y:0}; }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  const setDir = (player, d) => {
    const s = gsRef.current; if (!s) return;
    const p = s[player];
    if ((d.x!==0&&p.dir.x===0)||(d.y!==0&&p.dir.y===0)) p.next = d;
  };

  const s = gsRef.current || initState();
  const result = over
    ? (!s.p1.alive&&!s.p2.alive ? '平局！' : !s.p1.alive ? 'P2 (紅) 勝利！' : 'P1 (藍) 勝利！')
    : '';

  return (
    <div className="flex flex-col items-center w-full py-8">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Ghost className="text-teal-400"/> 雙人貪吃蛇</h2>
        <Button onClick={start} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>

      <div className="flex gap-6 mb-4">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-blue-500/40 text-center">
          <div className="text-blue-400 text-xs font-bold">P1 藍</div>
          <div className="text-2xl font-mono text-blue-400">{s.p1.score}</div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-red-500/40 text-center">
          <div className="text-red-400 text-xs font-bold">P2 紅</div>
          <div className="text-2xl font-mono text-red-400">{s.p2.score}</div>
        </div>
      </div>

      <div className="relative bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl"
        style={{ width:'min(90vw,400px)', height:'min(90vw,400px)' }}>
        <div className="absolute inset-0 grid"
          style={{ gridTemplateColumns:`repeat(${GRID},1fr)`, gridTemplateRows:`repeat(${GRID},1fr)` }}>
          {s.p1.body.map((b,i) => (
            <div key={`p1-${i}`} className={`${i===0?'bg-blue-400':'bg-blue-700'} rounded-sm`}
              style={{ gridColumnStart:b.x+1, gridRowStart:b.y+1 }} />
          ))}
          {s.p2.body.map((b,i) => (
            <div key={`p2-${i}`} className={`${i===0?'bg-red-400':'bg-red-700'} rounded-sm`}
              style={{ gridColumnStart:b.x+1, gridRowStart:b.y+1 }} />
          ))}
          <div className="bg-yellow-400 rounded-full animate-pulse z-10"
            style={{ gridColumnStart:s.food.x+1, gridRowStart:s.food.y+1 }} />
        </div>
        {!running && !over && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="text-center">
              <p className="text-white text-lg font-bold mb-1">雙蛇對決！</p>
              <p className="text-slate-400 text-sm mb-4">碰牆 / 碰蛇身即落敗</p>
              <Button onClick={start}><Play size={18}/> 開始</Button>
            </div>
          </div>
        )}
        {!s.p1.alive && running && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full text-blue-400 text-sm font-bold z-20">P1 陣亡</div>
        )}
        {!s.p2.alive && running && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 px-3 py-1 rounded-full text-red-400 text-sm font-bold z-20">P2 陣亡</div>
        )}
      </div>

      <div className="flex justify-between w-full max-w-xs px-4 mt-5 gap-4">
        <div>
          <p className="text-blue-400 text-xs text-center mb-1">P1 (WASD)</p>
          <div className="grid grid-cols-3 gap-1">
            <div/>
            <HoldBtn onStart={() => setDir('p1',{x:0,y:-1})} onEnd={() => {}} className="w-11 h-11 text-base">▲</HoldBtn>
            <div/>
            <HoldBtn onStart={() => setDir('p1',{x:-1,y:0})} onEnd={() => {}} className="w-11 h-11 text-base">◀</HoldBtn>
            <HoldBtn onStart={() => setDir('p1',{x:0,y:1})} onEnd={() => {}} className="w-11 h-11 text-base">▼</HoldBtn>
            <HoldBtn onStart={() => setDir('p1',{x:1,y:0})} onEnd={() => {}} className="w-11 h-11 text-base">▶</HoldBtn>
          </div>
        </div>
        <div>
          <p className="text-red-400 text-xs text-center mb-1">P2 (方向鍵)</p>
          <div className="grid grid-cols-3 gap-1">
            <div/>
            <HoldBtn onStart={() => setDir('p2',{x:0,y:-1})} onEnd={() => {}} className="w-11 h-11 text-base">▲</HoldBtn>
            <div/>
            <HoldBtn onStart={() => setDir('p2',{x:-1,y:0})} onEnd={() => {}} className="w-11 h-11 text-base">◀</HoldBtn>
            <HoldBtn onStart={() => setDir('p2',{x:0,y:1})} onEnd={() => {}} className="w-11 h-11 text-base">▼</HoldBtn>
            <HoldBtn onStart={() => setDir('p2',{x:1,y:0})} onEnd={() => {}} className="w-11 h-11 text-base">▶</HoldBtn>
          </div>
        </div>
      </div>

      <Modal
        isOpen={over}
        title={result.includes('P1') ? '🏆 P1 (藍) 勝利！' : result.includes('P2') ? '🏆 P2 (紅) 勝利！' : '🤝 平局！'}
        message={`P1: ${s.p1.score} 分 | P2: ${s.p2.score} 分`}
        onConfirm={start} confirmText="再來一局"
        extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>}
      />
    </div>
  );
};

// --- 遊戲 11: 太空對戰 ---

const SpaceBattle = ({ onBack }) => {
  const W = 360, H = 500;
  const SHIP_W = 36, SHIP_H = 28;
  const BULLET_W = 5, BULLET_H = 12;
  const BSPEED = 8, SSPEED = 5, COOLDOWN = 22;
  const P1_Y = H - 55, P2_Y = 55, MAX_HP = 5;

  const canvasRef = useRef(null);
  const [p1hp, setP1hp] = useState(MAX_HP);
  const [p2hp, setP2hp] = useState(MAX_HP);
  const [status, setStatus] = useState('menu');
  const runRef = useRef(false);

  const gs = useRef({
    p1: { x:W/2, hp:MAX_HP, cd:0 }, p2: { x:W/2, hp:MAX_HP, cd:0 },
    bullets: [], keys: {},
    tc: { p1L:false, p1R:false, p1F:false, p2L:false, p2R:false, p2F:false },
    frameId: null,
    stars: Array.from({length:45}, () => ({ x:Math.random()*W, y:Math.random()*H, r:Math.random()*1.5+0.3 })),
  });

  useEffect(() => {
    const kd = e => {
      gs.current.keys[e.code] = true;
      if (['ArrowLeft','ArrowRight'].includes(e.key) || ['Space','Enter'].includes(e.code)) e.preventDefault();
    };
    const ku = e => { gs.current.keys[e.code] = false; };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      cancelAnimationFrame(gs.current.frameId);
    };
  }, []);

  const drawShip = (ctx, x, y, color, pointUp) => {
    ctx.fillStyle = color;
    ctx.shadowBlur = 14; ctx.shadowColor = color;
    ctx.beginPath();
    if (pointUp) {
      ctx.moveTo(x, y-SHIP_H/2);
      ctx.lineTo(x-SHIP_W/2, y+SHIP_H/2);
      ctx.lineTo(x, y+SHIP_H/4);
      ctx.lineTo(x+SHIP_W/2, y+SHIP_H/2);
    } else {
      ctx.moveTo(x, y+SHIP_H/2);
      ctx.lineTo(x-SHIP_W/2, y-SHIP_H/2);
      ctx.lineTo(x, y-SHIP_H/4);
      ctx.lineTo(x+SHIP_W/2, y-SHIP_H/2);
    }
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(x, pointUp ? y+SHIP_H/2+3 : y-SHIP_H/2-3, 5, 3, 0, 0, Math.PI*2);
    ctx.fill();
  };

  const drawScene = (ctx, s) => {
    ctx.fillStyle = '#020817'; ctx.fillRect(0, 0, W, H);
    s.stars.forEach(st => {
      ctx.fillStyle = `rgba(255,255,255,${0.3+st.r*0.2})`;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth=1;
    ctx.setLineDash([8,8]);
    ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
    ctx.setLineDash([]);
    // HP bars
    const hw = 110;
    ctx.fillStyle='#0f172a'; ctx.fillRect(8,H-20,hw,10);
    ctx.fillStyle='#3b82f6'; ctx.fillRect(8,H-20,(s.p1.hp/MAX_HP)*hw,10);
    ctx.strokeStyle='rgba(148,163,184,0.3)'; ctx.strokeRect(8,H-20,hw,10);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='8px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`P1  ${s.p1.hp}/${MAX_HP}`, 11, H-12);
    ctx.fillStyle='#0f172a'; ctx.fillRect(W-hw-8,10,hw,10);
    ctx.fillStyle='#ef4444'; ctx.fillRect(W-hw-8,10,(s.p2.hp/MAX_HP)*hw,10);
    ctx.strokeStyle='rgba(148,163,184,0.3)'; ctx.strokeRect(W-hw-8,10,hw,10);
    ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.textAlign='right';
    ctx.fillText(`P2  ${s.p2.hp}/${MAX_HP}`, W-11, 18);
    // Bullets
    s.bullets.forEach(b => {
      const c = b.o===1 ? '#60a5fa' : '#f87171';
      ctx.fillStyle=c; ctx.shadowBlur=8; ctx.shadowColor=c;
      ctx.fillRect(b.x-BULLET_W/2, b.vy<0?b.y-BULLET_H:b.y, BULLET_W, BULLET_H);
      ctx.shadowBlur=0;
    });
    drawShip(ctx, s.p1.x, P1_Y, '#3b82f6', true);
    drawShip(ctx, s.p2.x, P2_Y, '#ef4444', false);
  };

  const startGame = () => {
    cancelAnimationFrame(gs.current.frameId);
    const s = gs.current;
    s.p1={x:W/2,hp:MAX_HP,cd:0}; s.p2={x:W/2,hp:MAX_HP,cd:0};
    s.bullets=[]; s.keys={};
    s.tc={p1L:false,p1R:false,p1F:false,p2L:false,p2R:false,p2F:false};
    setP1hp(MAX_HP); setP2hp(MAX_HP); setStatus('playing');
    runRef.current = true;
    spaceLoop();
  };

  const spaceLoop = () => {
    if (!runRef.current) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const s = gs.current;
    const k = s.keys, tc = s.tc;

    if ((k['KeyA']||tc.p1L) && s.p1.x>SHIP_W/2) s.p1.x-=SSPEED;
    if ((k['KeyD']||tc.p1R) && s.p1.x<W-SHIP_W/2) s.p1.x+=SSPEED;
    if ((k['ArrowLeft']||tc.p2L) && s.p2.x>SHIP_W/2) s.p2.x-=SSPEED;
    if ((k['ArrowRight']||tc.p2R) && s.p2.x<W-SHIP_W/2) s.p2.x+=SSPEED;

    if (s.p1.cd>0) s.p1.cd--;
    if ((k['KeyF']||k['Space']||tc.p1F) && s.p1.cd===0) {
      s.bullets.push({x:s.p1.x, y:P1_Y-SHIP_H/2-2, vy:-BSPEED, o:1});
      s.p1.cd=COOLDOWN;
    }
    if (s.p2.cd>0) s.p2.cd--;
    if ((k['Enter']||k['NumpadEnter']||tc.p2F) && s.p2.cd===0) {
      s.bullets.push({x:s.p2.x, y:P2_Y+SHIP_H/2+2, vy:BSPEED, o:2});
      s.p2.cd=COOLDOWN;
    }

    s.bullets.forEach(b => b.y+=b.vy);

    let p1hit=0, p2hit=0;
    s.bullets = s.bullets.filter(b => {
      if (b.y<-30||b.y>H+30) return false;
      if (b.o===1 && Math.abs(b.y-P2_Y)<SHIP_H/2+4 && Math.abs(b.x-s.p2.x)<SHIP_W/2) { p2hit++; return false; }
      if (b.o===2 && Math.abs(b.y-P1_Y)<SHIP_H/2+4 && Math.abs(b.x-s.p1.x)<SHIP_W/2) { p1hit++; return false; }
      return true;
    });
    if (p2hit>0) { s.p2.hp=Math.max(0,s.p2.hp-p2hit); setP2hp(s.p2.hp); }
    if (p1hit>0) { s.p1.hp=Math.max(0,s.p1.hp-p1hit); setP1hp(s.p1.hp); }

    if (s.p1.hp<=0 || s.p2.hp<=0) {
      runRef.current=false;
      drawScene(ctx, s);
      setStatus(s.p1.hp<=0 ? 'p2wins' : 'p1wins');
      return;
    }

    drawScene(ctx, s);
    s.frameId = requestAnimationFrame(spaceLoop);
  };

  const setTC = (k, v) => { gs.current.tc[k]=v; };
  const isOver = status==='p1wins'||status==='p2wins';

  return (
    <div className="flex flex-col items-center w-full py-6">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Rocket className="text-indigo-400"/> 太空對戰</h2>
        <Button onClick={() => { runRef.current=false; cancelAnimationFrame(gs.current.frameId); setStatus('menu'); }} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>

      <div className="flex gap-8 mb-3">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-blue-500/40 text-center">
          <div className="text-blue-400 text-xs">P1 (藍)</div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({length:MAX_HP}).map((_,i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${i<p1hp?'bg-blue-500':'bg-slate-700'}`}/>
            ))}
          </div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-red-500/40 text-center">
          <div className="text-red-400 text-xs">P2 (紅)</div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({length:MAX_HP}).map((_,i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${i<p2hp?'bg-red-500':'bg-slate-700'}`}/>
            ))}
          </div>
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden shadow-2xl border-2 border-slate-800">
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block', maxWidth:'95vw'}}/>
        {status==='menu' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center px-6">
            <h3 className="text-3xl font-bold text-white mb-3 tracking-widest">SPACE BATTLE</h3>
            <div className="text-sm mb-6 text-center leading-6">
              <p className="text-slate-400">P1 vs P2 · 先打掉對方全部 HP 獲勝</p>
              <p className="text-blue-400 mt-1">P1: A/D 移動 · F / 空白鍵 射擊</p>
              <p className="text-red-400">P2: ←/→ 移動 · Enter 射擊</p>
            </div>
            <Button onClick={startGame} className="px-8 py-3 text-lg"><Play size={20}/> 開始對戰</Button>
          </div>
        )}
      </div>

      {status==='playing' && (
        <div className="mt-3 w-full max-w-sm px-4">
          <div className="flex justify-between gap-2">
            <div className="flex flex-col items-center gap-1">
              <p className="text-blue-400 text-xs">P1 下方</p>
              <div className="flex gap-1">
                <HoldBtn onStart={() => setTC('p1L',true)} onEnd={() => setTC('p1L',false)} className="w-12 h-12 text-xl">◀</HoldBtn>
                <HoldBtn onStart={() => setTC('p1F',true)} onEnd={() => setTC('p1F',false)} className="w-12 h-12 text-xl bg-blue-800 border-blue-600">🔵</HoldBtn>
                <HoldBtn onStart={() => setTC('p1R',true)} onEnd={() => setTC('p1R',false)} className="w-12 h-12 text-xl">▶</HoldBtn>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-red-400 text-xs">P2 上方</p>
              <div className="flex gap-1">
                <HoldBtn onStart={() => setTC('p2L',true)} onEnd={() => setTC('p2L',false)} className="w-12 h-12 text-xl">◀</HoldBtn>
                <HoldBtn onStart={() => setTC('p2F',true)} onEnd={() => setTC('p2F',false)} className="w-12 h-12 text-xl bg-red-900 border-red-700">🔴</HoldBtn>
                <HoldBtn onStart={() => setTC('p2R',true)} onEnd={() => setTC('p2R',false)} className="w-12 h-12 text-xl">▶</HoldBtn>
              </div>
            </div>
          </div>
          <p className="text-slate-600 text-xs text-center mt-1">按住移動 · 點按🔵🔴射擊</p>
        </div>
      )}

      <Modal
        isOpen={isOver}
        title={status==='p1wins' ? '🏆 P1 (藍) 獲勝！' : '🏆 P2 (紅) 獲勝！'}
        message="精彩對決！"
        onConfirm={startGame} confirmText="再來一局"
        extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>}
      />
    </div>
  );
};

// --- 三消遊戲 ---
const MatchThree = ({ onBack }) => {
  const COLS=8, ROWS=8, NTYPES=6;
  const COLORS=['#ef4444','#f97316','#fde047','#22c55e','#3b82f6','#a855f7'];
  const SHAPES=['◆','●','▲','■','★','♥'];

  const findMatches = (b) => {
    const hit=new Set();
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS-2;c++){
      if(b[r][c]!==null&&b[r][c]===b[r][c+1]&&b[r][c]===b[r][c+2]){
        let e=c+2; while(e+1<COLS&&b[r][c]===b[r][e+1])e++;
        for(let i=c;i<=e;i++) hit.add(`${r},${i}`);
      }
    }
    for(let c=0;c<COLS;c++) for(let r=0;r<ROWS-2;r++){
      if(b[r][c]!==null&&b[r][c]===b[r+1][c]&&b[r][c]===b[r+2][c]){
        let e=r+2; while(e+1<ROWS&&b[r][c]===b[e+1][c])e++;
        for(let i=r;i<=e;i++) hit.add(`${i},${c}`);
      }
    }
    return [...hit].map(s=>{const[r,c]=s.split(',').map(Number);return{r,c};});
  };

  const applyGravity = (b) => {
    const nb=b.map(r=>[...r]);
    for(let c=0;c<COLS;c++){
      let bot=ROWS-1;
      for(let r=ROWS-1;r>=0;r--){if(nb[r][c]!==null){nb[bot][c]=nb[r][c];if(bot!==r)nb[r][c]=null;bot--;}}
      while(bot>=0){nb[bot][c]=Math.floor(Math.random()*NTYPES);bot--;}
    }
    return nb;
  };

  const resolveAll = (b) => {
    let cur=b, pts=0, cascade=0;
    let m=findMatches(cur);
    while(m.length>0){
      pts+=m.length*10*(cascade+1);
      cascade++;
      const nb=cur.map(r=>[...r]);
      m.forEach(({r,c})=>nb[r][c]=null);
      cur=applyGravity(nb);
      m=findMatches(cur);
    }
    return{board:cur,pts,cascade};
  };

  const initBoard = () => {
    const b=Array.from({length:ROWS},()=>Array.from({length:COLS},()=>Math.floor(Math.random()*NTYPES)));
    return resolveAll(b).board;
  };

  const [board,setBoard]=useState(initBoard);
  const [sel,setSel]=useState(null);
  const [flash,setFlash]=useState([]);
  const [score,setScore]=useState(0);
  const [busy,setBusy]=useState(false);
  const [comboMsg,setComboMsg]=useState('');

  const handleClick=(r,c)=>{
    if(busy) return;
    if(!sel){ setSel({r,c}); return; }
    if(sel.r===r&&sel.c===c){ setSel(null); return; }
    const dr=Math.abs(r-sel.r),dc=Math.abs(c-sel.c);
    if(dr+dc!==1){ setSel({r,c}); return; }
    const nb=board.map(row=>[...row]);
    [nb[r][c],nb[sel.r][sel.c]]=[nb[sel.r][sel.c],nb[r][c]];
    const m=findMatches(nb);
    setSel(null);
    if(m.length===0) return;
    setBusy(true);
    setFlash(m.map(({r,c})=>`${r},${c}`));
    setTimeout(()=>{
      const {board:resolved,pts,cascade}=resolveAll(nb);
      setBoard(resolved);
      setScore(s=>s+pts);
      if(cascade>1) setComboMsg(`${cascade}連鎖！+${pts}`);
      else setComboMsg('');
      setFlash([]);
      setBusy(false);
      setTimeout(()=>setComboMsg(''),800);
    },300);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto py-4">
      <div className="flex items-center gap-3 w-full">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">三消遊戲</h2>
        <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-center">
          <div className="text-xs text-slate-400">分數</div>
          <div className="font-bold text-yellow-400">{score}</div>
        </div>
        <Button onClick={()=>{setBoard(initBoard());setScore(0);setSel(null);}} variant="secondary"><RotateCcw size={16}/></Button>
      </div>
      {comboMsg&&<div className="text-yellow-300 font-bold text-lg animate-bounce">{comboMsg}</div>}
      <div className="bg-slate-900 p-2 rounded-xl border border-slate-700">
        <div style={{display:'grid',gridTemplateColumns:`repeat(${COLS},1fr)`,gap:3}}>
          {board.map((row,r)=>row.map((gem,c)=>{
            const key=`${r},${c}`;
            const isSel=sel?.r===r&&sel?.c===c;
            const isFlash=flash.includes(key);
            return <button key={key} onClick={()=>handleClick(r,c)}
              style={{background:isFlash?'#fff':COLORS[gem],width:38,height:38,borderRadius:8,fontSize:15,transition:'all 0.15s',transform:isSel?'scale(1.2)':isFlash?'scale(0.8)':'scale(1)',opacity:isFlash?0.5:1}}
              className={`flex items-center justify-center font-bold text-white select-none touch-manipulation ${isSel?'ring-2 ring-white':''}`}>
              {SHAPES[gem]}
            </button>;
          }))}
        </div>
      </div>
      <p className="text-slate-500 text-xs">點選寶石，再點相鄰寶石交換 · 連鎖消除有加成</p>
    </div>
  );
};

// --- 切水果 ---
const FruitNinja = ({ onBack }) => {
  const W=360, H=500;
  const canvasRef=useRef(null);
  const gs=useRef(null);
  const rafRef=useRef(null);
  const [ui,setUi]=useState(()=>({score:0,lives:3,status:'idle',hi:bestStorage.load('fruitninja')}));

  const FTYPES=[
    {color:'#22c55e',inner:'#ef4444',r:26},
    {color:'#f97316',inner:'#fcd34d',r:22},
    {color:'#ef4444',inner:'#fef9c3',r:20},
    {color:'#fde047',inner:'#fef3c7',r:18},
    {color:'#a855f7',inner:'#ddd6fe',r:21},
  ];

  const initGs=()=>({fruits:[],blade:[],score:0,lives:3,tick:0,nextF:50,combo:0,comboTimer:0,status:'playing'});

  const lineSeg=(p1,p2,cx,cy,r)=>{
    const dx=p2.x-p1.x,dy=p2.y-p1.y,len2=dx*dx+dy*dy;
    if(!len2) return Math.hypot(cx-p1.x,cy-p1.y)<r;
    const t=Math.max(0,Math.min(1,((cx-p1.x)*dx+(cy-p1.y)*dy)/len2));
    return Math.hypot(p1.x+t*dx-cx,p1.y+t*dy-cy)<r;
  };

  const draw=()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const g=gs.current;
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);

    g.fruits.forEach(f=>{
      if(f.sliced){
        const progress=f.sliceTimer/25;
        [-1,1].forEach((s,i)=>{
          ctx.save();
          ctx.translate(f.x+s*progress*18,f.y+progress*10);
          ctx.rotate(f.angle+s*progress*1.2);
          ctx.beginPath();
          ctx.arc(0,0,f.r,i===0?0:Math.PI,i===0?Math.PI:Math.PI*2);
          ctx.closePath();
          ctx.fillStyle=i===0?f.color:f.inner;
          ctx.fill();
          ctx.restore();
        });
      } else {
        ctx.beginPath(); ctx.arc(f.x,f.y,f.r,0,Math.PI*2);
        ctx.fillStyle=f.color; ctx.fill();
        ctx.beginPath(); ctx.arc(f.x-f.r*0.3,f.y-f.r*0.35,f.r*0.28,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.35)'; ctx.fill();
      }
    });

    if(g.blade.length>1){
      ctx.beginPath(); ctx.moveTo(g.blade[0].x,g.blade[0].y);
      g.blade.forEach(p=>ctx.lineTo(p.x,p.y));
      ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=2; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
      ctx.strokeStyle='rgba(120,220,255,0.4)'; ctx.lineWidth=8; ctx.stroke();
    }

    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,28);
    ctx.fillStyle='#f8fafc'; ctx.font='bold 14px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`分: ${g.score}`,8,19);
    ctx.textAlign='right'; ctx.fillText('❤'.repeat(Math.max(0,g.lives)),W-8,19);
    if(g.combo>1){
      ctx.textAlign='center'; ctx.fillStyle='#fbbf24';
      ctx.font=`bold ${Math.min(28,14+g.combo*2)}px sans-serif`;
      ctx.globalAlpha=Math.min(1,g.comboTimer/15);
      ctx.fillText(`COMBO x${g.combo}`,W/2,70);
      ctx.globalAlpha=1;
    }
    if(g.status==='dead'){
      ctx.fillStyle='rgba(0,0,0,0.65)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff'; ctx.font='bold 28px sans-serif'; ctx.textAlign='center';
      ctx.fillText('遊戲結束',W/2,H/2-16);
      ctx.font='16px sans-serif'; ctx.fillText(`得分: ${g.score}`,W/2,H/2+12);
    }
  };

  const loop=useCallback(()=>{
    const g=gs.current;
    if(g.status==='dead'){draw();return;}
    g.tick++;
    g.nextF--;
    if(g.nextF<=0){
      const ft=FTYPES[Math.floor(Math.random()*FTYPES.length)];
      g.fruits.push({...ft,x:ft.r*2+Math.random()*(W-ft.r*4),y:H+ft.r,vx:(Math.random()-0.5)*3,vy:-(11+Math.random()*5),angle:0,sliced:false,sliceTimer:0,dx:(Math.random()>0.5?1:-1)*0.8,});
      g.nextF=Math.max(18,50-Math.floor(g.score/200)*3);
    }
    g.fruits.forEach(f=>{f.x+=f.vx;f.y+=f.vy;f.vy+=0.32;f.angle+=0.04;if(f.sliced)f.sliceTimer++;});
    g.fruits.forEach(f=>{
      if(!f.sliced&&f.y>H+f.r+10&&!f.missed){
        f.missed=true; g.lives--;
        setUi(u=>({...u,lives:g.lives}));
        if(g.lives<=0){g.status='dead';setUi(u=>({...u,status:'dead',hi:updateBest('fruitninja',u.hi,g.score)}));}
      }
    });
    g.fruits=g.fruits.filter(f=>!(f.missed||(f.sliced&&f.sliceTimer>28)));
    if(g.comboTimer>0) g.comboTimer--; else if(g.comboTimer===0) g.combo=0;
    if(g.blade.length>1){
      for(let i=0;i<g.blade.length-1;i++){
        g.fruits.forEach(f=>{
          if(f.sliced) return;
          if(lineSeg(g.blade[i],g.blade[i+1],f.x,f.y,f.r)){
            f.sliced=true; g.combo++; g.comboTimer=25;
            g.score+=10*Math.max(1,g.combo);
            setUi(u=>({...u,score:g.score}));
          }
        });
      }
    }
    while(g.blade.length>18) g.blade.shift();
    draw();
    rafRef.current=requestAnimationFrame(loop);
  },[]);

  const startGame=()=>{
    cancelAnimationFrame(rafRef.current);
    gs.current=initGs();
    setUi(u=>({...u,score:0,lives:3,status:'playing'}));
    rafRef.current=requestAnimationFrame(loop);
  };

  const getPos=(e)=>{
    const canvas=canvasRef.current;
    const rect=canvas.getBoundingClientRect();
    const sx=W/rect.width,sy=H/rect.height;
    const src=e.touches?e.touches[0]:e;
    return{x:(src.clientX-rect.left)*sx,y:(src.clientY-rect.top)*sy};
  };

  const onMove=(e)=>{
    e.preventDefault();
    if(!gs.current||gs.current.status!=='playing') return;
    gs.current.blade.push(getPos(e));
  };

  useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);

  return (
    <div className="flex flex-col items-center gap-3 w-full py-4">
      <div className="flex items-center gap-3 w-full max-w-sm px-4">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">切水果</h2>
        <span className="text-yellow-400 font-bold text-sm">最高: {ui.hi}</span>
      </div>
      <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden select-none"
        style={{width:'100%',maxWidth:W,touchAction:'none'}}>
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block',width:'100%',cursor:'crosshair'}}
          onMouseMove={onMove} onTouchMove={onMove}
          onTouchStart={e=>{if(gs.current?.status==='dead'){startGame();}}}/>
        {ui.status==='idle'&&<div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <Button onClick={startGame}><Play size={18}/>開始切！</Button>
        </div>}
        {ui.status==='dead'&&<div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <Button onClick={startGame}><RotateCcw size={16}/>再試</Button>
          <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
        </div>}
      </div>
      <p className="text-slate-500 text-xs">滑動 / 手指劃過水果切開 · 連切有 COMBO 加成 · 漏掉水果失命</p>
    </div>
  );
};

// --- 俄羅斯方塊 ---
const TETROMINOES = {
  I:{shape:[[1,1,1,1]],color:'#22d3ee'},
  O:{shape:[[1,1],[1,1]],color:'#fde047'},
  T:{shape:[[0,1,0],[1,1,1]],color:'#a78bfa'},
  S:{shape:[[0,1,1],[1,1,0]],color:'#4ade80'},
  Z:{shape:[[1,1,0],[0,1,1]],color:'#f87171'},
  J:{shape:[[1,0,0],[1,1,1]],color:'#60a5fa'},
  L:{shape:[[0,0,1],[1,1,1]],color:'#fb923c'},
};
const TET_KEYS = Object.keys(TETROMINOES);

const TetrisGame = ({ onBack }) => {
  const COLS=10, ROWS=20, CELL=28;
  const W=COLS*CELL, H=ROWS*CELL;
  const canvasRef=useRef(null);
  const gs=useRef(null);
  const rafRef=useRef(null);
  const [ui,setUi]=useState({score:0,lines:0,level:1,status:'idle',next:'T'});

  const randPiece=()=>TET_KEYS[Math.floor(Math.random()*TET_KEYS.length)];

  const rotate=(shape)=>{
    const rows=shape.length,cols=shape[0].length;
    return Array.from({length:cols},(_,r)=>Array.from({length:rows},(_,c)=>shape[rows-1-c][r]));
  };

  const fits=(board,shape,ox,oy)=>{
    for(let r=0;r<shape.length;r++) for(let c=0;c<shape[r].length;c++){
      if(!shape[r][c]) continue;
      const nr=oy+r,nc=ox+c;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS||board[nr][nc]) return false;
    }
    return true;
  };

  const lock=(board,shape,ox,oy,color)=>{
    const nb=board.map(r=>[...r]);
    for(let r=0;r<shape.length;r++) for(let c=0;c<shape[r].length;c++){
      if(shape[r][c]) nb[oy+r][ox+c]=color;
    }
    return nb;
  };

  const clearLines=(board)=>{
    const kept=board.filter(row=>row.some(c=>!c));
    const cleared=ROWS-kept.length;
    const empty=Array.from({length:cleared},()=>Array(COLS).fill(null));
    return{board:[...empty,...kept],cleared};
  };

  const spawnPiece=(type)=>{
    const t=TETROMINOES[type];
    return{shape:t.shape.map(r=>[...r]),color:t.color,x:Math.floor(COLS/2)-Math.floor(t.shape[0].length/2),y:0};
  };

  const initGs=()=>({
    board:Array.from({length:ROWS},()=>Array(COLS).fill(null)),
    piece:spawnPiece('T'),next:randPiece(),
    score:0,lines:0,level:1,dropTimer:0,dropInterval:48,
    keys:{},lastKey:{},keyRepeat:{},status:'playing',
  });

  const draw=()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const g=gs.current;
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
    // grid lines
    ctx.strokeStyle='#1e293b'; ctx.lineWidth=0.5;
    for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*CELL);ctx.lineTo(W,r*CELL);ctx.stroke();}
    for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*CELL,0);ctx.lineTo(c*CELL,H);ctx.stroke();}
    // board cells
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      if(g.board[r][c]){
        ctx.fillStyle=g.board[r][c];
        ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,CELL-2);
        ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.fillRect(c*CELL+1,r*CELL+1,CELL-2,4);
      }
    }
    // ghost piece
    const p=g.piece; let gy=p.y;
    while(fits(g.board,p.shape,p.x,gy+1)) gy++;
    if(gy!==p.y){
      ctx.globalAlpha=0.2;
      for(let r=0;r<p.shape.length;r++) for(let c=0;c<p.shape[r].length;c++){
        if(p.shape[r][c]){ ctx.fillStyle=p.color; ctx.fillRect((p.x+c)*CELL+1,(gy+r)*CELL+1,CELL-2,CELL-2); }
      }
      ctx.globalAlpha=1;
    }
    // current piece
    for(let r=0;r<p.shape.length;r++) for(let c=0;c<p.shape[r].length;c++){
      if(p.shape[r][c]){
        ctx.fillStyle=p.color; ctx.fillRect((p.x+c)*CELL+1,(p.y+r)*CELL+1,CELL-2,CELL-2);
        ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.fillRect((p.x+c)*CELL+1,(p.y+r)*CELL+1,CELL-2,4);
      }
    }
  };

  // placePiece 只操作 gs ref，沒有實際依賴，所以 useCallback([]) 安全穩定
  const placePiece=useCallback((g)=>{
    g.board=lock(g.board,g.piece.shape,g.piece.x,g.piece.y,g.piece.color);
    const {board:nb,cleared}=clearLines(g.board);
    g.board=nb;
    const pts=[0,100,300,500,800][cleared]||0;
    g.lines+=cleared; g.score+=pts*(g.level);
    g.level=Math.floor(g.lines/10)+1;
    g.dropInterval=Math.max(8,48-g.level*4);
    const next=g.next;
    g.next=randPiece();
    const np=spawnPiece(next);
    if(!fits(g.board,np.shape,np.x,np.y)){ g.status='dead'; setUi(u=>({...u,score:g.score,lines:g.lines,level:g.level,status:'dead'})); return; }
    g.piece=np;
    setUi(u=>({...u,score:g.score,lines:g.lines,level:g.level,next:g.next}));
  },[]);

  const loop=useCallback(()=>{
    const g=gs.current;
    if(g.status!=='playing'){draw();return;}
    g.dropTimer++;
    // key handling with repeat
    const handleKey=(code,action)=>{
      if(g.keys[code]){
        if(!g.lastKey[code]){ action(); g.lastKey[code]=1; g.keyRepeat[code]=0; }
        else{ g.keyRepeat[code]=(g.keyRepeat[code]||0)+1; if(g.keyRepeat[code]>10) action(); }
      } else { g.lastKey[code]=0; g.keyRepeat[code]=0; }
    };
    handleKey('ArrowLeft',()=>{ if(fits(g.board,g.piece.shape,g.piece.x-1,g.piece.y)) g.piece.x--; });
    handleKey('ArrowRight',()=>{ if(fits(g.board,g.piece.shape,g.piece.x+1,g.piece.y)) g.piece.x++; });
    handleKey('ArrowDown',()=>{ if(fits(g.board,g.piece.shape,g.piece.x,g.piece.y+1)) g.piece.y++; else placePiece(g); });
    if(g.keys['ArrowDown']) g.dropTimer=0;
    if(g.dropTimer>=g.dropInterval){
      g.dropTimer=0;
      if(fits(g.board,g.piece.shape,g.piece.x,g.piece.y+1)) g.piece.y++;
      else placePiece(g);
    }
    draw();
    rafRef.current=requestAnimationFrame(loop);
  },[placePiece]);

  const startGame=()=>{
    cancelAnimationFrame(rafRef.current);
    gs.current=initGs();
    setUi({score:0,lines:0,level:1,status:'playing',next:gs.current.next});
    rafRef.current=requestAnimationFrame(loop);
  };

  useEffect(()=>{
    const kd=e=>{ gs.current&&(gs.current.keys[e.code]=true); if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); };
    const ku=e=>{ gs.current&&(gs.current.keys[e.code]=false); };
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    return()=>{ window.removeEventListener('keydown',kd); window.removeEventListener('keyup',ku); cancelAnimationFrame(rafRef.current); };
  },[]);

  // rotate on up key (one-shot via keydown event)
  useEffect(()=>{
    const kd=e=>{
      if(!gs.current||gs.current.status!=='playing') return;
      const g=gs.current;
      if(e.code==='ArrowUp'||e.code==='KeyZ'){
        const rot=rotate(g.piece.shape);
        if(fits(g.board,rot,g.piece.x,g.piece.y)) g.piece.shape=rot;
        else if(fits(g.board,rot,g.piece.x-1,g.piece.y)){g.piece.shape=rot;g.piece.x--;}
        else if(fits(g.board,rot,g.piece.x+1,g.piece.y)){g.piece.shape=rot;g.piece.x++;}
      }
      if(e.code==='Space'){ // hard drop
        while(fits(g.board,g.piece.shape,g.piece.x,g.piece.y+1)) g.piece.y++;
        placePiece(g);
      }
    };
    window.addEventListener('keydown',kd);
    return()=>window.removeEventListener('keydown',kd);
  },[placePiece]);

  // swipe gestures
  const touchRef=useRef({});
  const onTouchStart=e=>{ touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY}; };
  const onTouchEnd=e=>{
    const g=gs.current; if(!g||g.status!=='playing') return;
    const dx=e.changedTouches[0].clientX-touchRef.current.x;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    if(Math.abs(dx)>Math.abs(dy)){
      if(Math.abs(dx)>20){ if(dx>0){ if(fits(g.board,g.piece.shape,g.piece.x+1,g.piece.y)) g.piece.x++; } else { if(fits(g.board,g.piece.shape,g.piece.x-1,g.piece.y)) g.piece.x--; } }
    } else {
      if(dy>20){ while(fits(g.board,g.piece.shape,g.piece.x,g.piece.y+1)) g.piece.y++; placePiece(g); }
      else if(dy<-20){ const rot=rotate(g.piece.shape); if(fits(g.board,rot,g.piece.x,g.piece.y)) g.piece.shape=rot; }
    }
  };

  const nextShape=TETROMINOES[ui.next]||TETROMINOES['T'];

  return (
    <div className="flex flex-col items-center gap-3 w-full py-4">
      <div className="flex items-center gap-3 w-full max-w-md px-4">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-2xl font-bold text-white flex-1 text-center">俄羅斯方塊</h2>
        <Button onClick={startGame} variant="secondary"><RotateCcw size={16}/></Button>
      </div>
      <div className="flex gap-4 items-start">
        <div className="flex flex-col gap-3">
          {[{label:'分數',val:ui.score,color:'text-yellow-400'},{label:'消行',val:ui.lines,color:'text-cyan-400'},{label:'等級',val:ui.level,color:'text-purple-400'}].map(({label,val,color})=>(
            <div key={label} className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-center w-20">
              <div className="text-slate-400 text-xs">{label}</div>
              <div className={`text-xl font-bold ${color}`}>{val}</div>
            </div>
          ))}
          <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-center w-20">
            <div className="text-slate-400 text-xs mb-1">下一個</div>
            <div style={{display:'grid',gridTemplateColumns:`repeat(${nextShape.shape[0].length},12px)`,gap:1,margin:'0 auto',width:'fit-content'}}>
              {nextShape.shape.flat().map((c,i)=><div key={i} style={{width:12,height:12,background:c?nextShape.color:'transparent',borderRadius:2}}/>)}
            </div>
          </div>
        </div>
        <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden" style={{width:W,height:H}}>
          <canvas ref={canvasRef} width={W} height={H} style={{display:'block'}} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}/>
          {ui.status==='idle'&&<div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
            <p className="text-slate-300 text-sm text-center px-4">↑ 旋轉 · ↓ 加速 · 空白鍵 落底<br/>手機: 上滑旋轉 · 下滑落底</p>
            <Button onClick={startGame}><Play size={18}/>開始遊戲</Button>
          </div>}
          {ui.status==='dead'&&<div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
            <p className="text-2xl font-bold text-red-400">遊戲結束</p>
            <p className="text-slate-300">得分 {ui.score} · {ui.lines} 行</p>
            <Button onClick={startGame}><RotateCcw size={18}/>再試一次</Button>
            <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
          </div>}
        </div>
      </div>
      {ui.status==='playing'&&<div className="flex gap-3 mt-2">
        <button onTouchStart={e=>{e.preventDefault();const g=gs.current;if(g&&fits(g.board,g.piece.shape,g.piece.x-1,g.piece.y))g.piece.x--;}} className="bg-slate-700 active:bg-slate-500 text-white font-bold rounded-xl px-6 py-4 text-xl border border-slate-600 select-none touch-manipulation">◀</button>
        <button onTouchStart={e=>{e.preventDefault();const g=gs.current;if(g){const rot=rotate(g.piece.shape);if(fits(g.board,rot,g.piece.x,g.piece.y))g.piece.shape=rot;}}} className="bg-slate-700 active:bg-slate-500 text-white font-bold rounded-xl px-6 py-4 text-xl border border-slate-600 select-none touch-manipulation">↺</button>
        <button onTouchStart={e=>{e.preventDefault();const g=gs.current;if(g){while(fits(g.board,g.piece.shape,g.piece.x,g.piece.y+1))g.piece.y++;placePiece(g);}}} className="bg-slate-700 active:bg-slate-500 text-white font-bold rounded-xl px-6 py-4 text-xl border border-slate-600 select-none touch-manipulation">▼▼</button>
        <button onTouchStart={e=>{e.preventDefault();const g=gs.current;if(g&&fits(g.board,g.piece.shape,g.piece.x+1,g.piece.y))g.piece.x++;}} className="bg-slate-700 active:bg-slate-500 text-white font-bold rounded-xl px-6 py-4 text-xl border border-slate-600 select-none touch-manipulation">▶</button>
      </div>}
    </div>
  );
};

// --- 2048 ---
const Game2048 = () => {
  const EMPTY=()=>Array(4).fill(null).map(()=>Array(4).fill(0));
  const addRand=(board)=>{
    const empty=[];
    for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(!board[r][c]) empty.push([r,c]);
    if(!empty.length) return board;
    const nb=board.map(r=>[...r]);
    const [r,c]=empty[Math.floor(Math.random()*empty.length)];
    nb[r][c]=Math.random()<0.9?2:4;
    return nb;
  };
  const newBoard=()=>addRand(addRand(EMPTY()));

  const [board,setBoard]=useState(newBoard);
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(() => bestStorage.load('game2048'));
  const [status,setStatus]=useState('playing'); // playing/won/lost
  const touchRef=useRef({});

  const slideRow=(row)=>{
    const nums=row.filter(x=>x);
    let pts=0;
    for(let i=0;i<nums.length-1;i++){
      if(nums[i]===nums[i+1]){nums[i]*=2;pts+=nums[i];nums.splice(i+1,1);}
    }
    while(nums.length<4) nums.push(0);
    return{row:nums,pts};
  };

  const move=(dir)=>{
    setBoard(prev=>{
      let nb=prev.map(r=>[...r]);
      let totalPts=0;
      const transpose=m=>m[0].map((_,c)=>m.map(r=>r[c]));
      const flipH=m=>m.map(r=>[...r].reverse());
      if(dir==='left'){
        nb=nb.map(row=>{const{row:nr,pts}=slideRow(row);totalPts+=pts;return nr;});
      } else if(dir==='right'){
        nb=flipH(nb).map(row=>{const{row:nr,pts}=slideRow(row);totalPts+=pts;return nr;});
        nb=flipH(nb);
      } else if(dir==='up'){
        nb=transpose(nb).map(row=>{const{row:nr,pts}=slideRow(row);totalPts+=pts;return nr;});
        nb=transpose(nb);
      } else {
        nb=flipH(transpose(nb)).map(row=>{const{row:nr,pts}=slideRow(row);totalPts+=pts;return nr;});
        nb=transpose(flipH(nb));
      }
      const changed=nb.some((r,ri)=>r.some((c,ci)=>c!==prev[ri][ci]));
      if(!changed) return prev;
      const withNew=addRand(nb);
      setScore(s=>{ const ns=s+totalPts; setBest(b=>updateBest('game2048',b,ns)); return ns; });
      if(withNew.some(r=>r.includes(2048))) setStatus('won');
      else {
        // check if any move possible
        const noMove=withNew.every((r,ri)=>r.every((c,ci)=>{
          if(!c) return false;
          return ![[0,1],[1,0],[0,-1],[-1,0]].some(([dr,dc])=>{
            const nr2=ri+dr,nc2=ci+dc;
            return nr2>=0&&nr2<4&&nc2>=0&&nc2<4&&withNew[nr2][nc2]===c;
          });
        }));
        if(noMove) setStatus('lost');
      }
      return withNew;
    });
  };

  useEffect(()=>{
    const kd=e=>{
      const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
      if(m[e.key]){e.preventDefault();move(m[e.key]);}
    };
    window.addEventListener('keydown',kd);
    return()=>window.removeEventListener('keydown',kd);
  },[]);

  const onTouchStart=e=>touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};
  const onTouchEnd=e=>{
    const dx=e.changedTouches[0].clientX-touchRef.current.x;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    if(Math.max(Math.abs(dx),Math.abs(dy))<20) return;
    if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left'); else move(dy>0?'down':'up');
  };

  const COLORS={0:'#1e293b',2:'#fef3c7',4:'#fde68a',8:'#fcd34d',16:'#fb923c',32:'#f87171',64:'#ef4444',128:'#a78bfa',256:'#8b5cf6',512:'#7c3aed',1024:'#6d28d9',2048:'#fbbf24'};
  const textColor=v=>v<=4?'#1e293b':'#ffffff';
  const fontSize=v=>v>=1024?'text-lg':v>=128?'text-xl':'text-2xl';

  const restart=()=>{setBoard(newBoard());setScore(0);setStatus('playing');};

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto py-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex gap-3 w-full items-center">
        <h2 className="text-2xl font-bold text-white flex-1">2048</h2>
        <div className="bg-slate-800 px-3 py-1 rounded-lg text-center border border-slate-700"><div className="text-xs text-slate-400">分數</div><div className="font-bold text-yellow-400">{score}</div></div>
        <div className="bg-slate-800 px-3 py-1 rounded-lg text-center border border-slate-700"><div className="text-xs text-slate-400">最高</div><div className="font-bold text-cyan-400">{best}</div></div>
        <button onClick={restart} className="bg-slate-700 p-2 rounded-lg border border-slate-600 hover:bg-slate-600"><RotateCcw size={16} className="text-white"/></button>
      </div>
      <div className="bg-slate-800 p-2 rounded-xl border border-slate-700 w-full">
        <div className="grid grid-cols-4 gap-2">
          {board.flat().map((v,i)=>(
            <div key={i} className={`rounded-lg flex items-center justify-center h-16 font-bold ${fontSize(v)} transition-all`}
              style={{background:COLORS[v]||'#581c87',color:textColor(v)}}>
              {v||''}
            </div>
          ))}
        </div>
      </div>
      <p className="text-slate-500 text-xs">方向鍵 / 滑動 · 合併到 2048</p>
      {status!=='playing'&&<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-2xl p-8 text-center border border-slate-600 mx-4">
          <div className="text-4xl mb-3">{status==='won'?'🎉':'😢'}</div>
          <h3 className="text-xl font-bold text-white mb-2">{status==='won'?'達到 2048！':'沒有步驟了'}</h3>
          <p className="text-slate-400 mb-4">最終得分：{score}</p>
          <Button onClick={restart} className="w-full"><RotateCcw size={16}/>再玩一次</Button>
        </div>
      </div>}
    </div>
  );
};

const Game2048Wrapper = ({ onBack }) => (
  <div className="w-full max-w-sm mx-auto">
    <div className="flex items-center gap-3 mb-3 px-2">
      <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
    </div>
    <Game2048 />
  </div>
);

// --- 踩地雷 ---
const Minesweeper = ({ onBack }) => {
  const PRESETS={easy:{rows:9,cols:9,mines:10},medium:{rows:16,cols:16,mines:40},hard:{rows:16,cols:30,mines:99}};
  const [preset,setPreset]=useState('easy');
  const [board,setBoard]=useState(null);
  const [status,setStatus]=useState('idle'); // idle/playing/won/lost
  const [time,setTime]=useState(0);
  const [flags,setFlags]=useState(0);
  const timerRef=useRef(null);
  const firstClick=useRef(true);

  const {rows,cols,mines}=PRESETS[preset];

  const newBoard=(r,c,rows,cols,mines)=>{
    // Generate mines avoiding first click area
    const safe=new Set();
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){ const nr=r+dr,nc=c+dc; if(nr>=0&&nr<rows&&nc>=0&&nc<cols) safe.add(nr*cols+nc); }
    const positions=[];
    for(let i=0;i<rows*cols;i++) if(!safe.has(i)) positions.push(i);
    // shuffle and take mines
    for(let i=positions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[positions[i],positions[j]]=[positions[j],positions[i]];}
    const mineSet=new Set(positions.slice(0,mines));
    const cells=Array.from({length:rows},(_,ri)=>Array.from({length:cols},(_,ci)=>{
      const idx=ri*cols+ci;
      return{mine:mineSet.has(idx),revealed:false,flagged:false,adj:0};
    }));
    // calc adjacency
    for(let ri=0;ri<rows;ri++) for(let ci=0;ci<cols;ci++){
      if(cells[ri][ci].mine) continue;
      let n=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=ri+dr,nc=ci+dc;
        if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&cells[nr][nc].mine) n++;
      }
      cells[ri][ci].adj=n;
    }
    return cells;
  };

  const reveal=(board,r,c,rows,cols)=>{
    const nb=board.map(row=>row.map(cell=>({...cell})));
    const stack=[[r,c]];
    while(stack.length){
      const[cr,cc]=stack.pop();
      if(cr<0||cr>=rows||cc<0||cc>=cols) continue;
      const cell=nb[cr][cc];
      if(cell.revealed||cell.flagged) continue;
      cell.revealed=true;
      if(cell.adj===0&&!cell.mine){
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) stack.push([cr+dr,cc+dc]);
      }
    }
    return nb;
  };

  const handleClick=(r,c)=>{
    if(status==='lost'||status==='won') return;
    setBoard(prev=>{
      let nb=prev?prev.map(row=>row.map(cell=>({...cell}))):null;
      if(!nb||firstClick.current){
        nb=newBoard(r,c,rows,cols,mines);
        firstClick.current=false;
        setStatus('playing');
        setTime(0);
        clearInterval(timerRef.current);
        timerRef.current=setInterval(()=>setTime(t=>t+1),1000);
      }
      const cell=nb[r][c];
      if(cell.flagged||cell.revealed) return nb;
      if(cell.mine){
        // reveal all mines
        nb=nb.map(row=>row.map(cell=>cell.mine?{...cell,revealed:true}:cell));
        setStatus('lost');
        clearInterval(timerRef.current);
        return nb;
      }
      nb=reveal(nb,r,c,rows,cols);
      // check win
      const won=nb.every(row=>row.every(cell=>cell.revealed||cell.mine));
      if(won){ setStatus('won'); clearInterval(timerRef.current); }
      return nb;
    });
  };

  const handleRightClick=(e,r,c)=>{
    e.preventDefault();
    if(status==='lost'||status==='won') return;
    setBoard(prev=>{
      if(!prev) return prev;
      const nb=prev.map(row=>row.map(cell=>({...cell})));
      const cell=nb[r][c];
      if(cell.revealed) return nb;
      cell.flagged=!cell.flagged;
      setFlags(f=>cell.flagged?f+1:f-1);
      return nb;
    });
  };

  const restart=()=>{
    clearInterval(timerRef.current);
    setBoard(null); setStatus('idle'); setTime(0); setFlags(0);
    firstClick.current=true;
  };

  useEffect(()=>()=>clearInterval(timerRef.current),[]);
  useEffect(()=>{ restart(); },[preset]);

  const initBoard=Array.from({length:rows},()=>Array.from({length:cols},()=>({mine:false,revealed:false,flagged:false,adj:0})));
  const displayBoard=board||initBoard;

  const adjColors=['','#3b82f6','#22c55e','#ef4444','#7c3aed','#dc2626','#0891b2','#000','#6b7280'];

  const cellSize=preset==='hard'?20:preset==='medium'?24:32;

  return (
    <div className="flex flex-col items-center gap-3 w-full py-4">
      <div className="flex items-center gap-3 w-full max-w-2xl px-4">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">踩地雷</h2>
        <Button onClick={restart} variant="secondary"><RotateCcw size={16}/></Button>
      </div>
      <div className="flex gap-2 flex-wrap justify-center">
        {Object.keys(PRESETS).map(k=>(
          <button key={k} onClick={()=>setPreset(k)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${preset===k?'bg-blue-600 border-blue-400 text-white':'bg-slate-700 border-slate-600 text-slate-300'}`}>
            {k==='easy'?'簡單':k==='medium'?'中等':'困難'}
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <span className="text-red-400">💣 {mines-flags}</span>
        <span className="text-slate-400">⏱ {time}s</span>
        <span className={status==='won'?'text-yellow-400':status==='lost'?'text-red-400':'text-slate-400'}>
          {status==='won'?'勝利！':status==='lost'?'爆炸！':status==='playing'?'進行中':'點擊開始'}
        </span>
      </div>
      <div className="overflow-auto max-w-full border-2 border-slate-700 rounded-lg bg-slate-900 p-1">
        <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},${cellSize}px)`,gap:1}}>
          {displayBoard.flat().map((cell,i)=>{
            const r=Math.floor(i/cols),c=i%cols;
            return <button key={i}
              onClick={()=>handleClick(r,c)}
              onContextMenu={e=>handleRightClick(e,r,c)}
              style={{width:cellSize,height:cellSize,fontSize:cellSize*0.55,lineHeight:1}}
              className={`flex items-center justify-center rounded font-bold transition-colors select-none
                ${cell.revealed?(cell.mine?'bg-red-600':'bg-slate-700'):'bg-slate-600 hover:bg-slate-500 active:bg-slate-400'}`}>
              {cell.revealed&&!cell.mine&&(cell.adj>0?<span style={{color:adjColors[cell.adj]}}>{cell.adj}</span>:'')}
              {cell.revealed&&cell.mine&&'💣'}
              {!cell.revealed&&cell.flagged&&'🚩'}
            </button>;
          })}
        </div>
      </div>
      <p className="text-slate-500 text-xs">左鍵揭開 · 右鍵插旗 · 手機長按插旗</p>
    </div>
  );
};

// --- 太空射擊 ---
const SpaceShooter = ({ onBack }) => {
  const W=360, H=500;
  const canvasRef=useRef(null);
  const gs=useRef(null);
  const rafRef=useRef(null);
  const [ui,setUi]=useState(()=>({score:0,lives:3,status:'idle',hi:bestStorage.load('spaceshooter')}));

  const initGs=()=>({
    ship:{x:W/2,y:H-60,vx:0},
    bullets:[],enemies:[],particles:[],powerups:[],
    score:0,lives:3,tick:0,nextEnemy:40,cooldown:0,
    keys:{},tc:{left:false,right:false,fire:false},
    status:'playing',bossMode:false,boss:null,
  });

  const spawnEnemy=(g)=>{
    const types=['basic','fast','tough','zigzag'];
    const t=g.score>2000?types[Math.floor(Math.random()*types.length)]:g.score>500?types[Math.floor(Math.random()*3)]:types[Math.floor(Math.random()*2)];
    const configs={basic:{hp:1,spd:1.5,color:'#f87171',pts:10,w:22,h:16,shoot:200},fast:{hp:1,spd:3,color:'#fb923c',pts:15,w:18,h:12,shoot:300},tough:{hp:3,spd:1,color:'#a78bfa',pts:25,w:28,h:20,shoot:150},zigzag:{hp:2,spd:2,color:'#34d399',pts:20,w:20,h:16,shoot:400}};
    const c=configs[t];
    g.enemies.push({x:20+Math.random()*(W-40),y:-20,vx:t==='zigzag'?(Math.random()>0.5?1.5:-1.5):0,...c,type:t,hp:c.hp,maxHp:c.hp,shootTimer:Math.random()*c.shoot,eBullets:[]});
  };

  const draw=()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const g=gs.current;
    ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,W,H);
    // stars
    ctx.fillStyle='rgba(255,255,255,0.5)';
    for(let i=0;i<40;i++){ const si=(g.tick*0.3+i*137)%H; ctx.fillRect((i*73)%W,si,1.5,1.5); }

    // powerups
    g.powerups.forEach(p=>{ ctx.fillStyle=p.type==='shield'?'#60a5fa':'#fbbf24'; ctx.beginPath(); ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(p.type==='shield'?'S':'★',p.x,p.y); });

    // enemy bullets
    g.enemies.forEach(e=>e.eBullets.forEach(b=>{ ctx.fillStyle='#f87171'; ctx.beginPath(); ctx.arc(b.x,b.y,4,0,Math.PI*2); ctx.fill(); }));

    // enemies
    g.enemies.forEach(e=>{
      ctx.fillStyle=e.color;
      ctx.beginPath(); ctx.moveTo(e.x,e.y+e.h/2); ctx.lineTo(e.x-e.w/2,e.y-e.h/2); ctx.lineTo(e.x+e.w/2,e.y-e.h/2); ctx.fill();
      if(e.maxHp>1){ ctx.fillStyle='#374151'; ctx.fillRect(e.x-e.w/2,e.y-e.h/2-6,e.w,3); ctx.fillStyle=e.color; ctx.fillRect(e.x-e.w/2,e.y-e.h/2-6,e.w*(e.hp/e.maxHp),3); }
    });

    // boss
    if(g.boss){
      const b=g.boss;
      ctx.fillStyle='#dc2626';
      ctx.beginPath(); ctx.moveTo(b.x,b.y+30); ctx.lineTo(b.x-50,b.y-30); ctx.lineTo(b.x+50,b.y-30); ctx.fill();
      ctx.fillStyle='#fef2f2'; ctx.beginPath(); ctx.arc(b.x,b.y,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#374151'; ctx.fillRect(b.x-55,b.y-50,110,10);
      ctx.fillStyle='#ef4444'; ctx.fillRect(b.x-55,b.y-50,110*(b.hp/b.maxHp),10);
      b.eBullets.forEach(bl=>{ ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.arc(bl.x,bl.y,5,0,Math.PI*2); ctx.fill(); });
    }

    // player bullets
    g.bullets.forEach(b=>{ ctx.fillStyle='#22d3ee'; ctx.fillRect(b.x-3,b.y-10,6,14); });

    // ship
    const s=g.ship;
    ctx.fillStyle=g.shieldTime>0?'#60a5fa':'#e2e8f0';
    ctx.beginPath(); ctx.moveTo(s.x,s.y-22); ctx.lineTo(s.x-18,s.y+14); ctx.lineTo(s.x+18,s.y+14); ctx.fill();
    ctx.fillStyle='#22d3ee'; ctx.beginPath(); ctx.arc(s.x,s.y,5,0,Math.PI*2); ctx.fill();
    if(g.shieldTime>0){ ctx.strokeStyle='rgba(96,165,250,0.5)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(s.x,s.y,25,0,Math.PI*2); ctx.stroke(); }

    // particles
    g.particles.forEach(p=>{ ctx.globalAlpha=p.life/p.maxLife; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill(); }); ctx.globalAlpha=1;

    // HUD
    ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,W,26);
    ctx.fillStyle='#f8fafc'; ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`分: ${g.score}`,8,17);
    ctx.textAlign='right';
    ctx.fillText('❤'.repeat(g.lives),W-8,17);

    if(g.status==='dead'){ ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.font='bold 26px sans-serif'; ctx.textAlign='center'; ctx.fillText('遊戲結束',W/2,H/2-16); ctx.font='16px sans-serif'; ctx.fillText(`得分: ${g.score}`,W/2,H/2+14); }
  };

  const loop=useCallback(()=>{
    const g=gs.current;
    if(g.status==='dead'){draw();return;}
    g.tick++;
    const SPD=4;
    if(g.keys['ArrowLeft']||g.keys['KeyA']||g.tc.left) g.ship.x=Math.max(20,g.ship.x-SPD);
    if(g.keys['ArrowRight']||g.keys['KeyD']||g.tc.right) g.ship.x=Math.min(W-20,g.ship.x+SPD);
    g.ship.x+=g.ship.vx; g.ship.vx*=0.9;
    if(g.cooldown>0) g.cooldown--;
    if((g.keys['Space']||g.keys['KeyZ']||g.tc.fire)&&g.cooldown===0){
      g.bullets.push({x:g.ship.x,y:g.ship.y-24}); g.cooldown=12;
    }
    g.bullets.forEach(b=>b.y-=10); g.bullets=g.bullets.filter(b=>b.y>-10);

    // spawn enemies
    if(!g.bossMode){ g.nextEnemy--; if(g.nextEnemy<=0){ spawnEnemy(g); g.nextEnemy=Math.max(20,40-Math.floor(g.score/300)); } }

    // boss
    if(g.score>=3000&&!g.bossMode&&!g.boss){ g.bossMode=true; g.boss={x:W/2,y:80,vx:2,hp:100,maxHp:100,eBullets:[],shootTimer:0}; }
    if(g.boss){
      g.boss.x+=g.boss.vx;
      if(g.boss.x<60||g.boss.x>W-60) g.boss.vx*=-1;
      g.boss.shootTimer++;
      if(g.boss.shootTimer%40===0){ for(let a=-30;a<=30;a+=15) g.boss.eBullets.push({x:g.boss.x,y:g.boss.y+30,vx:Math.sin(a*Math.PI/180)*3,vy:3}); }
      g.boss.eBullets.forEach(b=>{b.x+=b.vx;b.y+=b.vy;});
      g.boss.eBullets=g.boss.eBullets.filter(b=>b.y<H+10);
      g.bullets.forEach(b=>{
        if(Math.hypot(b.x-g.boss.x,b.y-g.boss.y)<55){ b.dead=true; g.boss.hp--; g.score+=5; if(g.boss.hp<=0){ for(let i=0;i<20;i++) g.particles.push({x:g.boss.x,y:g.boss.y,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,r:6,color:'#ef4444',life:30,maxLife:30}); g.boss=null; g.bossMode=false; g.score+=1000; setUi(u=>({...u,score:g.score})); } }
      });
      // boss bullets hit player
      if(g.shieldTime<=0) g.boss&&g.boss.eBullets.forEach(b=>{
        if(Math.hypot(b.x-g.ship.x,b.y-g.ship.y)<22){ b.dead=true; g.lives--; setUi(u=>({...u,lives:g.lives})); if(g.lives<=0){g.status='dead';setUi(u=>({...u,status:'dead',hi:updateBest('spaceshooter',u.hi,g.score)}));} }
      });
      if(g.boss) g.boss.eBullets=g.boss.eBullets.filter(b=>!b.dead);
    }

    // move enemies
    g.enemies.forEach(e=>{
      e.y+=e.spd; e.x+=e.vx;
      if(e.x<10||e.x>W-10) e.vx*=-1;
      e.shootTimer++;
      if(e.shootTimer>=e.shoot){ e.shootTimer=0; e.eBullets.push({x:e.x,y:e.y+e.h/2,vy:4}); }
      e.eBullets.forEach(b=>b.y+=b.vy); e.eBullets=e.eBullets.filter(b=>b.y<H+10);
    });
    g.enemies=g.enemies.filter(e=>e.y<H+20);

    // bullet-enemy collision
    g.bullets.forEach(b=>{
      g.enemies.forEach(e=>{
        if(Math.abs(b.x-e.x)<e.w/2+3&&Math.abs(b.y-e.y)<e.h/2+7){ b.dead=true; e.hp--; if(e.hp<=0){ e.dead=true; g.score+=e.pts; setUi(u=>({...u,score:g.score})); for(let i=0;i<6;i++) g.particles.push({x:e.x,y:e.y,vx:(Math.random()-0.5)*5,vy:(Math.random()-0.5)*5,r:4,color:e.color,life:20,maxLife:20}); if(Math.random()<0.15) g.powerups.push({x:e.x,y:e.y,type:Math.random()<0.5?'shield':'score'}); } }
      });
    });
    g.bullets=g.bullets.filter(b=>!b.dead); g.enemies=g.enemies.filter(e=>!e.dead);

    // enemy bullets hit player
    if(g.shieldTime>0) g.shieldTime--; else {
      g.enemies.forEach(e=>e.eBullets.forEach(b=>{
        if(Math.hypot(b.x-g.ship.x,b.y-g.ship.y)<22){ b.dead=true; g.lives--; setUi(u=>({...u,lives:g.lives})); if(g.lives<=0){g.status='dead';setUi(u=>({...u,status:'dead',hi:updateBest('spaceshooter',u.hi,g.score)}));} }
      }));
      g.enemies.forEach(e=>e.eBullets=e.eBullets.filter(b=>!b.dead));
      // enemy reaches bottom
      g.enemies.forEach(e=>{ if(e.y>H-20&&!e.hitPlayer){ e.hitPlayer=true; g.lives--; e.dead=true; setUi(u=>({...u,lives:g.lives})); if(g.lives<=0){g.status='dead';setUi(u=>({...u,status:'dead',hi:updateBest('spaceshooter',u.hi,g.score)}));} } });
    }

    // powerups
    g.powerups.forEach(p=>{ p.y+=2; if(Math.hypot(p.x-g.ship.x,p.y-g.ship.y)<25){ p.collected=true; if(p.type==='shield') g.shieldTime=180; else{ g.score+=50; setUi(u=>({...u,score:g.score})); } } });
    g.powerups=g.powerups.filter(p=>!p.collected&&p.y<H+10);

    g.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;});
    g.particles=g.particles.filter(p=>p.life>0);

    if(g.status==='dead'){draw();return;}
    draw();
    rafRef.current=requestAnimationFrame(loop);
  },[]);

  const startGame=()=>{
    cancelAnimationFrame(rafRef.current);
    gs.current={...initGs(),shieldTime:0};
    setUi(u=>({...u,score:0,lives:3,status:'playing'}));
    rafRef.current=requestAnimationFrame(loop);
  };

  useEffect(()=>{
    const kd=e=>{if(gs.current)gs.current.keys[e.code]=true;if(e.code==='Space')e.preventDefault();};
    const ku=e=>{if(gs.current)gs.current.keys[e.code]=false;};
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(rafRef.current);};
  },[]);

  return (
    <div className="flex flex-col items-center gap-3 w-full py-4">
      <div className="flex items-center gap-3 w-full max-w-md px-4">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">太空射擊</h2>
        <span className="text-yellow-400 font-bold text-sm">最高: {ui.hi}</span>
      </div>
      <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden" style={{width:'100%',maxWidth:W}}>
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block',width:'100%'}}/>
        {ui.status==='idle'&&<div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <Button onClick={startGame}><Play size={18}/>開始</Button>
        </div>}
        {ui.status==='dead'&&<div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
          <Button onClick={startGame}><RotateCcw size={16}/>再試</Button>
          <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
        </div>}
      </div>
      {ui.status==='playing'&&<div className="flex gap-4 mt-1">
        <HoldBtn onStart={()=>gs.current&&(gs.current.tc.left=true)} onEnd={()=>gs.current&&(gs.current.tc.left=false)} className="w-24 h-12 text-xl">◀</HoldBtn>
        <HoldBtn onStart={()=>gs.current&&(gs.current.tc.fire=true)} onEnd={()=>gs.current&&(gs.current.tc.fire=false)} className="w-24 h-12 text-base font-bold bg-red-700 border-red-500">射擊</HoldBtn>
        <HoldBtn onStart={()=>gs.current&&(gs.current.tc.right=true)} onEnd={()=>gs.current&&(gs.current.tc.right=false)} className="w-24 h-12 text-xl">▶</HoldBtn>
      </div>}
      <p className="text-slate-500 text-xs">← → 移動 · 空白鍵射擊 · 3000 分挑戰 BOSS</p>
    </div>
  );
};

// --- 恐龍跑酷 ---
const DinoRun = ({ onBack }) => {
  const W=480, H=200, GY=160;
  const canvasRef=useRef(null);
  const gs=useRef(null);
  const rafRef=useRef(null);
  const [ui,setUi]=useState(()=>({score:0,status:'idle',hi:bestStorage.load('dinorun')}));

  const initGs=()=>({
    dino:{x:60,y:GY,vy:0,onGround:true,ducking:false,frame:0},
    obstacles:[], clouds:[],
    score:0, speed:5, tick:0, nextObs:80, status:'playing',
    keys:{},
  });

  const JUMP_VY=-14, GRAVITY=0.8;

  const draw=()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const g=gs.current;
    // sky
    ctx.fillStyle='#e0f2fe'; ctx.fillRect(0,0,W,H);
    // ground
    ctx.fillStyle='#854d0e'; ctx.fillRect(0,GY+40,W,4);
    ctx.fillStyle='#a16207'; ctx.fillRect(0,GY+44,W,H-GY-44);
    // clouds
    g.clouds.forEach(c=>{
      ctx.fillStyle='rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.ellipse(c.x,c.y,30,12,0,0,Math.PI*2); ctx.fill();
    });
    // obstacles
    g.obstacles.forEach(o=>{
      ctx.fillStyle='#166534';
      if(o.type==='cactus'){
        ctx.fillRect(o.x+8,o.y-20,8,40); // trunk
        ctx.fillRect(o.x,o.y-10,10,6);   // left arm
        ctx.fillRect(o.x+o.w-10,o.y-15,10,6); // right arm
      } else {
        // pterodactyl
        ctx.fillRect(o.x,o.y,o.w,14);
        ctx.beginPath(); ctx.moveTo(o.x+o.w/2,o.y); ctx.lineTo(o.x+o.w/2-10,o.y-16); ctx.lineTo(o.x+o.w/2+10,o.y-16); ctx.fill();
      }
    });
    // dino
    const d=g.dino;
    const dh=d.ducking?20:40;
    ctx.fillStyle='#292524';
    ctx.fillRect(d.x,d.y+40-dh,30,dh);
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(d.x+22,d.y+40-dh+5,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#292524';
    ctx.beginPath(); ctx.arc(d.x+23,d.y+40-dh+5,2,0,Math.PI*2); ctx.fill();
    // legs animation
    if(d.onGround){
      const lf=Math.floor(d.frame/8)%2;
      ctx.fillStyle='#292524';
      ctx.fillRect(d.x+6,d.y+40,8,lf?12:6);
      ctx.fillRect(d.x+16,d.y+40,8,lf?6:12);
    }
    // score
    ctx.fillStyle='#44403c'; ctx.font='bold 14px monospace'; ctx.textAlign='right';
    ctx.fillText(`${Math.floor(g.score)}`.padStart(5,'0'),W-8,20);
    if(g.status==='dead'){
      ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff'; ctx.font='bold 24px sans-serif'; ctx.textAlign='center';
      ctx.fillText('遊戲結束',W/2,H/2-10);
      ctx.font='14px sans-serif';
      ctx.fillText(`得分: ${Math.floor(g.score)}`,W/2,H/2+15);
    }
  };

  const loop=useCallback(()=>{
    const g=gs.current;
    if(g.status==='dead'){ draw(); return; }
    g.tick++; g.score+=g.speed*0.1;
    g.speed=5+Math.floor(g.score/500)*0.5;
    g.dino.frame++;
    // jump / duck
    const jump=g.keys['Space']||g.keys['ArrowUp']||g.keys['KeyW']||g.tc;
    const duck=g.keys['ArrowDown']||g.keys['KeyS'];
    if(jump&&g.dino.onGround){ g.dino.vy=JUMP_VY; g.dino.onGround=false; }
    g.dino.ducking=duck&&g.dino.onGround;
    g.dino.vy+=GRAVITY;
    g.dino.y+=g.dino.vy;
    if(g.dino.y>=GY){ g.dino.y=GY; g.dino.vy=0; g.dino.onGround=true; }
    // spawn obstacles
    g.nextObs--;
    if(g.nextObs<=0){
      const type=Math.random()<0.7?'cactus':'ptero';
      const oy=type==='ptero'?GY-(Math.random()<0.5?30:0):GY;
      g.obstacles.push({x:W+10,y:oy,w:type==='cactus'?24:40,type});
      g.nextObs=Math.floor(60/g.speed*10)+Math.random()*40;
    }
    g.obstacles.forEach(o=>o.x-=g.speed);
    g.obstacles=g.obstacles.filter(o=>o.x>-60);
    // clouds
    if(g.tick%120===0) g.clouds.push({x:W+30,y:20+Math.random()*40});
    g.clouds.forEach(c=>c.x-=1); g.clouds=g.clouds.filter(c=>c.x>-60);
    // collision
    const d=g.dino, dh=d.ducking?20:40;
    for(const o of g.obstacles){
      const oh=o.type==='cactus'?40:14;
      if(d.x+4<o.x+o.w-4&&d.x+26>o.x+4&&d.y+40-dh<o.y+oh&&d.y+40>o.y){
        g.status='dead';
        setUi(u=>({...u,score:Math.floor(g.score),status:'dead',hi:updateBest('dinorun',u.hi,Math.floor(g.score))}));
        draw(); return;
      }
    }
    setUi(u=>({...u,score:Math.floor(g.score)}));
    draw();
    rafRef.current=requestAnimationFrame(loop);
  },[]);

  const startGame=()=>{
    cancelAnimationFrame(rafRef.current);
    gs.current={...initGs(),tc:false};
    setUi(u=>({...u,score:0,status:'playing'}));
    rafRef.current=requestAnimationFrame(loop);
  };

  useEffect(()=>{
    const kd=e=>{if(gs.current)gs.current.keys[e.code]=true;};
    const ku=e=>{if(gs.current)gs.current.keys[e.code]=false;};
    window.addEventListener('keydown',kd); window.addEventListener('keyup',ku);
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(rafRef.current);};
  },[]);

  const handleTap=()=>{
    if(!gs.current||gs.current.status==='dead'){startGame();return;}
    const g=gs.current;
    if(g.dino.onGround){g.dino.vy=JUMP_VY;g.dino.onGround=false;}
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full py-4">
      <div className="flex items-center gap-3 w-full max-w-xl px-4">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">恐龍跑酷</h2>
        <span className="text-yellow-400 font-bold text-sm">最高: {ui.hi}</span>
      </div>
      <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden cursor-pointer" style={{width:'100%',maxWidth:W}} onClick={handleTap}>
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block',width:'100%'}}/>
        {ui.status==='idle'&&<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Button onClick={e=>{e.stopPropagation();startGame();}}><Play size={18}/>開始遊戲</Button>
        </div>}
      </div>
      <p className="text-slate-500 text-xs">空白鍵/↑ 跳 · ↓ 蹲 · 手機點擊跳</p>
    </div>
  );
};

// --- Flappy Bird ---
const FlappyBird = ({ onBack }) => {
  const W=320, H=480, GH=80, GAP=160, PIPE_W=52, BIRD_R=14;
  const canvasRef=useRef(null);
  const gs=useRef(null);
  const rafRef=useRef(null);
  const [ui,setUi]=useState(()=>({score:0,status:'idle',hi:bestStorage.load('flappybird')}));

  const initGs=()=>({
    bird:{x:80,y:H/2,vy:0},
    pipes:[], score:0, tick:0, nextPipe:80, status:'playing',
  });

  const FLAP=-9, GRAVITY=0.45;

  const draw=()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d');
    const g=gs.current;
    // sky gradient
    const grad=ctx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,'#7dd3fc'); grad.addColorStop(1,'#bae6fd');
    ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
    // ground
    ctx.fillStyle='#84cc16'; ctx.fillRect(0,H-GH,W,GH);
    ctx.fillStyle='#65a30d'; ctx.fillRect(0,H-GH,W,8);
    // pipes
    g.pipes.forEach(p=>{
      ctx.fillStyle='#16a34a';
      // top pipe
      ctx.fillRect(p.x,0,PIPE_W,p.topH);
      ctx.fillStyle='#15803d';
      ctx.fillRect(p.x-4,p.topH-20,PIPE_W+8,20);
      // bottom pipe
      const botY=p.topH+GAP;
      ctx.fillStyle='#16a34a';
      ctx.fillRect(p.x,botY,PIPE_W,H-GH-botY);
      ctx.fillStyle='#15803d';
      ctx.fillRect(p.x-4,botY,PIPE_W+8,20);
    });
    // bird
    const b=g.bird;
    ctx.save(); ctx.translate(b.x,b.y);
    ctx.rotate(Math.min(Math.max(b.vy*0.04,-0.5),1.2));
    ctx.fillStyle='#fbbf24'; ctx.beginPath(); ctx.ellipse(0,0,BIRD_R,BIRD_R-3,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f97316'; ctx.beginPath(); ctx.ellipse(BIRD_R-4,-2,6,4,0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-2,-4,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#1e293b'; ctx.beginPath(); ctx.arc(-1,-4,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
    // score
    ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.font='bold 32px sans-serif'; ctx.textAlign='center';
    ctx.fillText(g.score,W/2,50);
    if(g.status==='dead'){
      ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#fff'; ctx.font='bold 28px sans-serif';
      ctx.fillText('遊戲結束',W/2,H/2-20);
      ctx.font='18px sans-serif';
      ctx.fillText(`得分: ${g.score}`,W/2,H/2+15);
    }
  };

  const loop=useCallback(()=>{
    const g=gs.current;
    if(g.status==='dead'){draw();return;}
    g.tick++;
    g.bird.vy+=GRAVITY; g.bird.y+=g.bird.vy;
    // spawn pipes
    g.nextPipe--;
    if(g.nextPipe<=0){
      const topH=60+Math.random()*(H-GH-GAP-120);
      g.pipes.push({x:W+10,topH,scored:false});
      g.nextPipe=100;
    }
    g.pipes.forEach(p=>p.x-=3);
    g.pipes=g.pipes.filter(p=>p.x>-PIPE_W-10);
    // score
    g.pipes.forEach(p=>{
      if(!p.scored&&p.x+PIPE_W<g.bird.x){ p.scored=true; g.score++; setUi(u=>({...u,score:g.score})); }
    });
    // collision
    const b=g.bird;
    if(b.y-BIRD_R<0||b.y+BIRD_R>H-GH){
      g.status='dead'; setUi(u=>({...u,score:g.score,status:'dead',hi:updateBest('flappybird',u.hi,g.score)})); draw(); return;
    }
    for(const p of g.pipes){
      if(b.x+BIRD_R>p.x&&b.x-BIRD_R<p.x+PIPE_W){
        if(b.y-BIRD_R<p.topH||b.y+BIRD_R>p.topH+GAP){
          g.status='dead'; setUi(u=>({...u,score:g.score,status:'dead',hi:updateBest('flappybird',u.hi,g.score)})); draw(); return;
        }
      }
    }
    draw();
    rafRef.current=requestAnimationFrame(loop);
  },[]);

  const flap=()=>{
    if(!gs.current||gs.current.status==='dead'){startGame();return;}
    gs.current.bird.vy=FLAP;
  };

  const startGame=()=>{
    cancelAnimationFrame(rafRef.current);
    gs.current=initGs();
    setUi(u=>({...u,score:0,status:'playing'}));
    rafRef.current=requestAnimationFrame(loop);
  };

  useEffect(()=>{
    const kd=e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();flap();}};
    window.addEventListener('keydown',kd);
    return()=>{window.removeEventListener('keydown',kd);cancelAnimationFrame(rafRef.current);};
  },[]);

  return (
    <div className="flex flex-col items-center gap-3 w-full py-4">
      <div className="flex items-center gap-3 w-full max-w-sm px-4">
        <Button onClick={onBack} variant="outline"><Home size={16}/></Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">Flappy Bird</h2>
        <span className="text-yellow-400 font-bold text-sm">最高: {ui.hi}</span>
      </div>
      <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden cursor-pointer" style={{width:'100%',maxWidth:W}}
        onClick={flap} onTouchStart={e=>{e.preventDefault();flap();}}>
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block',width:'100%'}}/>
        {ui.status==='idle'&&<div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <Button onClick={e=>{e.stopPropagation();startGame();}}><Play size={18}/>開始</Button>
        </div>}
      </div>
      <p className="text-slate-500 text-xs">空白鍵 / 點擊 讓小鳥飛翔</p>
    </div>
  );
};

// --- 塔防遊戲 ---
const TowerDefense = ({ onBack }) => {
  const canvasRef = useRef(null);
  const gs = useRef(null);
  const animRef = useRef(null);
  const [ui, setUi] = useState({ gold:100, lives:20, wave:0, status:'idle', selected:'arrow' });

  const CELL = 48, COLS = 11, ROWS = 9;
  const W = CELL * COLS, H = CELL * ROWS;
  // path cells (col, row)
  const PATH = [
    {c:0,r:1},{c:1,r:1},{c:2,r:1},{c:3,r:1},{c:4,r:1},{c:4,r:2},{c:4,r:3},{c:4,r:4},
    {c:3,r:4},{c:2,r:4},{c:1,r:4},{c:0,r:4},{c:0,r:5},{c:0,r:6},{c:0,r:7},
    {c:1,r:7},{c:2,r:7},{c:3,r:7},{c:4,r:7},{c:5,r:7},{c:6,r:7},{c:6,r:6},
    {c:6,r:5},{c:6,r:4},{c:7,r:4},{c:8,r:4},{c:9,r:4},{c:10,r:4}
  ];
  const pathSet = new Set(PATH.map(p=>`${p.c},${p.r}`));
  // path as pixel waypoints (center of each cell)
  const WAYPTS = PATH.map(p=>({x:p.c*CELL+CELL/2, y:p.r*CELL+CELL/2}));

  const TOWERS = {
    arrow: {name:'弓箭手', cost:50, color:'#60a5fa', range:2.5, dmg:15, rate:60, proj:'arrow'},
    cannon:{name:'砲塔',   cost:100,color:'#f87171', range:2.0, dmg:50, rate:120,proj:'cannon',aoe:CELL*0.8},
    rapid: {name:'機槍',   cost:75, color:'#34d399', range:2.0, dmg:8,  rate:20, proj:'rapid'},
    ice:   {name:'冰塔',   cost:90, color:'#a78bfa', range:2.5, dmg:5,  rate:80, proj:'ice', slow:0.4},
  };

  const WAVES = [
    [{type:'basic',n:8,interval:60}],
    [{type:'basic',n:10,interval:50},{type:'fast',n:3,interval:80}],
    [{type:'fast',n:8,interval:45},{type:'tank',n:2,interval:100}],
    [{type:'basic',n:12,interval:40},{type:'fast',n:6,interval:50},{type:'tank',n:3,interval:90}],
    [{type:'tank',n:6,interval:80},{type:'fast',n:10,interval:40}],
    [{type:'tank',n:5,interval:70},{type:'basic',n:15,interval:35},{type:'fast',n:8,interval:40}],
    [{type:'boss',n:1,interval:1},{type:'tank',n:8,interval:70}],
    [{type:'boss',n:2,interval:200},{type:'fast',n:15,interval:30},{type:'tank',n:10,interval:60}],
  ];

  const ENEMY_TYPES = {
    basic:{hp:80, spd:0.8, color:'#ef4444', reward:10, r:10},
    fast: {hp:50, spd:1.6, color:'#f97316', reward:15, r:8},
    tank: {hp:250,spd:0.5, color:'#8b5cf6', reward:25, r:13},
    boss: {hp:800,spd:0.3, color:'#dc2626', reward:100,r:18},
  };

  const initGs = () => ({
    towers:[], enemies:[], projectiles:[], particles:[],
    gold:100, lives:20, wave:0, tick:0, spawnQueue:[],
    spawnTimer:0, waveActive:false, status:'idle'
  });

  useEffect(() => {
    gs.current = initGs();
    const canvas = canvasRef.current;
    canvas.width = W; canvas.height = H;
    draw();
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const g = gs.current;
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0,0,W,H);

    // grid
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
      const isPath = pathSet.has(`${c},${r}`);
      ctx.fillStyle = isPath ? '#78716c' : '#334155';
      ctx.fillRect(c*CELL+1, r*CELL+1, CELL-2, CELL-2);
    }
    // path start/end
    ctx.fillStyle='#22c55e'; ctx.fillRect(0,CELL,4,CELL);
    ctx.fillStyle='#ef4444'; ctx.fillRect(W-4,CELL*4,4,CELL);

    // towers
    g.towers.forEach(t=>{
      const td = TOWERS[t.type];
      ctx.fillStyle=td.color;
      ctx.beginPath(); ctx.arc(t.x,t.y,14,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(t.type==='arrow'?'弓':t.type==='cannon'?'砲':t.type==='rapid'?'機':t.type==='ice'?'冰':'?',t.x,t.y);
    });

    // enemies
    g.enemies.forEach(e=>{
      const et = ENEMY_TYPES[e.type];
      ctx.fillStyle=et.color;
      ctx.beginPath(); ctx.arc(e.x,e.y,et.r,0,Math.PI*2); ctx.fill();
      // hp bar
      const bw=et.r*2+4;
      ctx.fillStyle='#374151'; ctx.fillRect(e.x-bw/2,e.y-et.r-8,bw,4);
      ctx.fillStyle='#22c55e'; ctx.fillRect(e.x-bw/2,e.y-et.r-8,bw*(e.hp/e.maxHp),4);
      if (e.slow>0) { ctx.strokeStyle='#a78bfa'; ctx.lineWidth=2; ctx.stroke(); }
    });

    // projectiles
    g.projectiles.forEach(p=>{
      ctx.fillStyle = p.type==='ice'?'#a78bfa':p.type==='cannon'?'#f87171':p.type==='rapid'?'#34d399':'#60a5fa';
      ctx.beginPath(); ctx.arc(p.x,p.y,p.type==='cannon'?6:3,0,Math.PI*2); ctx.fill();
    });

    // particles
    g.particles.forEach(p=>{
      ctx.globalAlpha=p.life/p.maxLife;
      ctx.fillStyle=p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;

    // UI overlay (gold, lives, wave)
    ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.fillRect(0,0,W,28);
    ctx.fillStyle='#fcd34d'; ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
    ctx.fillText(`金:${g.gold}  命:${g.lives}  波:${g.wave}/${WAVES.length}`,6,18);
  };

  const tick = useCallback(()=>{
    const g = gs.current;
    if (g.status==='gameover'||g.status==='win') { draw(); return; }
    g.tick++;

    // spawning
    if (g.waveActive && g.spawnQueue.length>0) {
      g.spawnTimer++;
      const next = g.spawnQueue[0];
      if (g.spawnTimer >= next.interval) {
        g.spawnTimer=0;
        const et = ENEMY_TYPES[next.type];
        g.enemies.push({
          id: Math.random(), type:next.type,
          x:WAYPTS[0].x, y:WAYPTS[0].y,
          hp:et.hp, maxHp:et.hp, spd:et.spd,
          waypt:0, slow:0, slowTimer:0,
        });
        g.spawnQueue.shift();
      }
    } else if (g.waveActive && g.spawnQueue.length===0 && g.enemies.length===0) {
      g.waveActive=false;
      if (g.wave>=WAVES.length) { g.status='win'; setUi(u=>({...u,status:'win'})); return; }
      g.gold+=30;
      setUi(u=>({...u,gold:g.gold,status:'idle'}));
    }

    // move enemies
    g.enemies.forEach(e=>{
      if (e.slowTimer>0) e.slowTimer--;
      else e.slow=0;
      const spd = e.slow>0 ? e.spd*e.slow : e.spd;
      if (e.waypt>=WAYPTS.length-1) {
        g.lives--;
        e.dead=true;
        if (g.lives<=0) { g.status='gameover'; setUi(u=>({...u,lives:0,status:'gameover'})); }
        return;
      }
      const wp = WAYPTS[e.waypt+1];
      const dx=wp.x-e.x, dy=wp.y-e.y, dist=Math.hypot(dx,dy);
      if (dist<spd) { e.x=wp.x; e.y=wp.y; e.waypt++; }
      else { e.x+=dx/dist*spd; e.y+=dy/dist*spd; }
    });
    g.enemies = g.enemies.filter(e=>!e.dead);

    // towers shoot
    g.towers.forEach(t=>{
      const td = TOWERS[t.type];
      t.cooldown = (t.cooldown||0)-1;
      if (t.cooldown>0) return;
      const range = td.range*CELL;
      const target = g.enemies.find(e=>Math.hypot(e.x-t.x,e.y-t.y)<range);
      if (!target) return;
      t.cooldown=td.rate;
      g.projectiles.push({x:t.x,y:t.y,tx:target.id,type:td.proj,dmg:td.dmg,spd:5,aoe:td.aoe,slow:td.slow});
    });

    // move projectiles
    g.projectiles.forEach(p=>{
      const target = g.enemies.find(e=>e.id===p.tx);
      if (!target) { p.dead=true; return; }
      const dx=target.x-p.x, dy=target.y-p.y, dist=Math.hypot(dx,dy);
      if (dist<p.spd+target.r) {
        if (p.aoe) {
          g.enemies.forEach(e=>{ if(Math.hypot(e.x-target.x,e.y-target.y)<p.aoe){e.hp-=p.dmg;} });
          for(let i=0;i<8;i++) g.particles.push({x:target.x,y:target.y,vx:(Math.random()-0.5)*3,vy:(Math.random()-0.5)*3,r:4,color:'#f87171',life:20,maxLife:20});
        } else {
          target.hp -= p.dmg;
          if (p.slow) { target.slow=p.slow; target.slowTimer=120; }
        }
        if (target.hp<=0) {
          target.dead=true;
          g.gold+=ENEMY_TYPES[target.type].reward;
          setUi(u=>({...u,gold:g.gold}));
          for(let i=0;i<5;i++) g.particles.push({x:target.x,y:target.y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,r:3,color:ENEMY_TYPES[target.type].color,life:15,maxLife:15});
        }
        p.dead=true;
      } else { p.x+=dx/dist*p.spd; p.y+=dy/dist*p.spd; }
    });
    g.projectiles = g.projectiles.filter(p=>!p.dead);
    g.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;});
    g.particles = g.particles.filter(p=>p.life>0);

    draw();
    if (g.status==='playing'||g.status==='idle') animRef.current=requestAnimationFrame(tick);
  }, []);

  useEffect(()=>{
    animRef.current = requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(animRef.current);
  },[tick]);

  const handleCanvasClick = (e) => {
    const g = gs.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = W / rect.width, scaleY = H / rect.height;
    const mx = (e.clientX-rect.left)*scaleX, my = (e.clientY-rect.top)*scaleY;
    const c = Math.floor(mx/CELL), r = Math.floor(my/CELL);
    if (pathSet.has(`${c},${r}`)) return;
    if (c<0||c>=COLS||r<0||r>=ROWS) return;
    const td = TOWERS[ui.selected];
    if (!td||g.gold<td.cost) return;
    if (g.towers.find(t=>t.c===c&&t.r===r)) return;
    g.towers.push({c,r,x:c*CELL+CELL/2,y:r*CELL+CELL/2,type:ui.selected,cooldown:0});
    g.gold-=td.cost;
    if (g.status==='idle') g.status='playing';
    setUi(u=>({...u,gold:g.gold,status:g.status}));
  };

  const startWave = () => {
    const g = gs.current;
    if (g.waveActive||g.wave>=WAVES.length) return;
    const waveGroups = WAVES[g.wave];
    g.spawnQueue=[];
    waveGroups.forEach(grp=>{ for(let i=0;i<grp.n;i++) g.spawnQueue.push({type:grp.type,interval:grp.interval}); });
    g.spawnQueue.sort((a,b)=>a.interval-b.interval);
    g.waveActive=true; g.spawnTimer=0; g.wave++;
    g.status='playing';
    setUi(u=>({...u,wave:g.wave,status:'playing'}));
    cancelAnimationFrame(animRef.current);
    animRef.current=requestAnimationFrame(tick);
  };

  const restart = () => {
    cancelAnimationFrame(animRef.current);
    gs.current=initGs();
    setUi({gold:100,lives:20,wave:0,status:'idle',selected:'arrow'});
    animRef.current=requestAnimationFrame(tick);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 w-full">
        <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
        <h2 className="text-xl font-bold text-white flex-1 text-center">塔防遊戲</h2>
        <Button onClick={restart} variant="outline"><RotateCcw size={16}/>重置</Button>
      </div>

      <div className="flex gap-2 flex-wrap justify-center">
        {Object.entries(TOWERS).map(([k,t])=>(
          <button key={k} onClick={()=>setUi(u=>({...u,selected:k}))}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-all ${ui.selected===k?'bg-blue-600 border-blue-400 text-white':'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-400'}`}>
            {t.name} <span className="text-yellow-400">{t.cost}g</span>
          </button>
        ))}
        {ui.status==='idle'&&<button onClick={startWave} className="px-4 py-1.5 rounded-lg text-sm font-bold bg-green-600 text-white hover:bg-green-500 border border-green-400">
          {ui.wave===0?'開始':` 第 ${ui.wave+1} 波`}
        </button>}
      </div>

      <div className="relative border-2 border-slate-600 rounded-lg overflow-hidden" style={{width:'100%',maxWidth:W}}>
        <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full cursor-pointer" style={{display:'block',imageRendering:'pixelated'}} />
      </div>

      <p className="text-slate-400 text-xs text-center">點擊空格放置塔 · 路徑上不可放置 · 擊殺敵人獲得金幣</p>

      {ui.status==='gameover'&&<Modal show title="基地淪陷！" message={`撐到第 ${ui.wave} 波`} onConfirm={restart} confirmText="再試一次" extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>}/>}
      {ui.status==='win'&&<Modal show title="守衛成功！" message="全部 8 波敵人已擊退！" onConfirm={restart} confirmText="再玩一次" extraButtons={<Button onClick={onBack} variant="outline" className="w-full">回大廳</Button>}/>}
    </div>
  );
};

// --- 地下城卡牌 ---
const CARD_DEFS = {
  strike:    {name:'打擊',  type:'A', cost:1, dmg:6,   desc:'造成 6 傷害'},
  defend:    {name:'格擋',  type:'D', cost:1, blk:5,   desc:'獲得 5 格擋'},
  bash:      {name:'重擊',  type:'A', cost:2, dmg:8, vuln:2, desc:'8 傷害，施予易傷 2'},
  iron_wave: {name:'鐵波',  type:'A', cost:1, dmg:5, blk:5,  desc:'5 傷害 + 5 格擋'},
  inflame:   {name:'怒火',  type:'P', cost:1, str:2,   desc:'獲得 2 力量'},
  twin:      {name:'連擊',  type:'A', cost:1, dmg:5, times:2, desc:'造成 5×2 傷害'},
  shrug:     {name:'無視',  type:'D', cost:1, blk:4, draw:1,  desc:'4 格擋 + 摸 1 牌'},
  pommel:    {name:'擊頭',  type:'A', cost:1, dmg:9, draw:1,  desc:'9 傷害 + 摸 1 牌'},
  reaper:    {name:'收割',  type:'A', cost:2, dmg:4, heal:1,  desc:'4 傷害並回血 4'},
  offering:  {name:'奉獻',  type:'P', cost:0, energy:2,hp:-6, desc:'失去 6HP，+2 能量'},
  heavy:     {name:'重砍',  type:'A', cost:2, dmg:14,  desc:'造成 14 傷害'},
  whirlwind: {name:'旋風',  type:'A', cost:-1, dmg:5,  desc:'消耗所有能量，各造 5 傷害'},
};

const ENEMIES = [
  {name:'哥布林', hp:50,  maxHp:50,  atk:6,  pattern:['atk','atk','def'],       reward:['iron_wave','inflame']},
  {name:'骷髏兵',hp:70,  maxHp:70,  atk:8,  pattern:['atk','def','atk','atk'],  reward:['twin','pommel']},
  {name:'石像鬼', hp:90,  maxHp:90,  atk:10, pattern:['def','atk','atk','def'],  reward:['shrug','heavy']},
  {name:'暗影刺客',hp:80, maxHp:80,  atk:13, pattern:['atk','atk','atk','def'], reward:['reaper','offering']},
  {name:'惡魔',   hp:110, maxHp:110, atk:12, pattern:['def','atk','def','atk'],  reward:['whirlwind','heavy']},
  {name:'魔王',   hp:200, maxHp:200, atk:15, pattern:['atk','def','atk','atk','str'], reward:[]},
];

const DungeonCard = ({ onBack }) => {
  const shuffle = (arr) => { for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; };

  const newGame = () => {
    const deck = [
      ...Array(5).fill('strike'), ...Array(4).fill('defend'), 'bash'
    ];
    return {
      floor:0, phase:'combat', hp:80, maxHp:80, block:0, energy:3, maxEnergy:3,
      str:0, vuln:0, weak:0,
      deck: shuffle([...deck]),
      hand:[], discard:[], exhaust:[],
      enemy:{...ENEMIES[0]}, eBlock:0, eVuln:0, eWeak:0,
      eTurnIdx:0, log:[], rewardCards:[], selectReward:false,
    };
  };

  const drawCards = (state, n=5) => {
    let {deck, hand, discard} = state;
    hand = [...hand];
    deck = [...deck];
    discard = [...discard];
    for(let i=0;i<n;i++){
      if(deck.length===0){ deck=shuffle([...discard]); discard=[]; }
      if(deck.length>0) hand.push(deck.shift());
    }
    return {...state, deck, hand, discard};
  };

  const [gs, setGs] = useState(()=>drawCards(newGame(),5));

  const endTurn = (s) => {
    // enemy turn
    let ns = {...s, discard:[...s.discard,...s.hand], hand:[], block:0};
    const e = ns.enemy;
    const pattern = e.pattern;
    const action = pattern[ns.eTurnIdx % pattern.length];
    ns.eTurnIdx++;
    let dmg = 0;
    if (action==='atk') {
      dmg = e.atk + (e.str||0);
      if (ns.eVuln>0) dmg = Math.floor(dmg*1.5);
      dmg = Math.max(0, dmg - ns.block);
      ns.block = Math.max(0, ns.block - e.atk);
      ns.hp -= dmg;
      ns.log = [`${e.name} 攻擊 ${dmg}`, ...ns.log.slice(0,3)];
    } else if (action==='def') {
      ns.eBlock = (ns.eBlock||0) + 8;
      ns.log = [`${e.name} 防禦 +8`, ...ns.log.slice(0,3)];
    } else if (action==='str') {
      e.str = (e.str||0)+3;
      ns.log = [`${e.name} 力量 +3`, ...ns.log.slice(0,3)];
    }
    if (ns.eVuln>0) ns.eVuln--;
    if (ns.eWeak>0) ns.eWeak--;
    if (ns.vuln>0) ns.vuln--;
    if (ns.weak>0) ns.weak--;
    ns.energy = ns.maxEnergy;
    ns = drawCards(ns, 5);
    if (ns.hp<=0) ns.phase='dead';
    return ns;
  };

  const playCard = (idx) => {
    setGs(prev=>{
      const card = prev.hand[idx];
      const cd = CARD_DEFS[card];
      if (!cd) return prev;
      const cost = cd.cost===-1 ? prev.energy : cd.cost;
      if (cd.cost!==-1 && prev.energy < cost) return prev;

      let ns = {...prev, hand:[...prev.hand], discard:[...prev.discard], enemy:{...prev.enemy}};
      ns.hand.splice(idx,1);
      if (cd.cost===-1) { ns.energy=0; } else { ns.energy -= cost; }

      const times = cd.times||1;
      for (let t=0;t<times;t++) {
        if (cd.dmg) {
          let dmg = cd.dmg + (ns.str||0);
          if (ns.weak>0) dmg = Math.floor(dmg*0.75);
          if (ns.enemy.vuln>0) dmg = Math.floor(dmg*1.5);
          if (cd.cost===-1) dmg *= ns.energy+cost;
          const actual = Math.max(0, dmg - (ns.eBlock||0));
          ns.eBlock = Math.max(0,(ns.eBlock||0)-dmg);
          ns.enemy.hp -= actual;
          ns.log = [`你對${ns.enemy.name}造成${actual}傷害`,...ns.log.slice(0,3)];
        }
      }
      if (cd.blk) ns.block += cd.blk;
      if (cd.str) ns.str = (ns.str||0)+cd.str;
      if (cd.vuln) ns.enemy.vuln = (ns.enemy.vuln||0)+cd.vuln;
      if (cd.draw) { ns = drawCards(ns, cd.draw); }
      if (cd.energy) ns.energy = Math.min(ns.maxEnergy, ns.energy+cd.energy);
      if (cd.hp) ns.hp = Math.max(0, Math.min(ns.maxHp, ns.hp+cd.hp));
      if (cd.heal) ns.hp = Math.min(ns.maxHp, ns.hp+cd.heal*times);

      if (cd.cost!==-1) ns.discard.push(card);

      if (ns.enemy.hp<=0) {
        const floor = ns.floor;
        if (floor>=5) { ns.phase='win'; return ns; }
        ns.phase='reward';
        ns.rewardCards = ENEMIES[floor].reward;
        ns.selectReward=true;
      }
      return ns;
    });
  };

  const pickReward = (card) => {
    setGs(prev=>{
      if (!card) {
        // skip reward
        return startNextFloor(prev);
      }
      const ns = {...prev, discard:[...prev.discard, card]};
      return startNextFloor(ns);
    });
  };

  const startNextFloor = (s) => {
    const nextFloor = s.floor+1;
    const enemy = {...ENEMIES[nextFloor], vuln:0, eBlock:0, str:0};
    let ns = {...s, floor:nextFloor, phase:'combat', enemy, eBlock:0, eVuln:0, eWeak:0, eTurnIdx:0, block:0, energy:s.maxEnergy, log:[], selectReward:false, rewardCards:[]};
    // small heal between floors
    ns.hp = Math.min(ns.maxHp, ns.hp+10);
    ns = drawCards(ns,5);
    return ns;
  };

  const g = gs;
  const eData = g.enemy;
  const nextAction = eData.pattern[g.eTurnIdx % eData.pattern.length];

  const typeColor = {A:'bg-red-700/80',D:'bg-blue-700/80',P:'bg-purple-700/80'};

  if (g.phase==='dead') return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto p-4">
      <Button onClick={onBack} variant="outline" className="self-start"><Home size={16}/>大廳</Button>
      <div className="bg-slate-800 rounded-2xl p-8 text-center border border-red-500/30">
        <div className="text-5xl mb-4">💀</div>
        <h3 className="text-2xl font-bold text-red-400">你已陣亡</h3>
        <p className="text-slate-400 mt-2">到達第 {g.floor+1} 層</p>
        <Button onClick={()=>setGs(drawCards(newGame(),5))} className="mt-6 w-full">再試一次</Button>
      </div>
    </div>
  );

  if (g.phase==='win') return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto p-4">
      <Button onClick={onBack} variant="outline" className="self-start"><Home size={16}/>大廳</Button>
      <div className="bg-slate-800 rounded-2xl p-8 text-center border border-yellow-500/30">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-bold text-yellow-400">征服地下城！</h3>
        <p className="text-slate-400 mt-2">擊敗了所有 6 個敵人</p>
        <Button onClick={()=>setGs(drawCards(newGame(),5))} className="mt-6 w-full">再挑戰</Button>
      </div>
    </div>
  );

  if (g.phase==='reward') return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto p-4">
      <Button onClick={onBack} variant="outline" className="self-start"><Home size={16}/>大廳</Button>
      <h2 className="text-xl font-bold text-yellow-400">選擇獎勵卡牌</h2>
      <div className="flex gap-3 flex-wrap justify-center">
        {g.rewardCards.map(c=>{
          const cd = CARD_DEFS[c];
          return <button key={c} onClick={()=>pickReward(c)}
            className={`${typeColor[cd.type]||'bg-slate-700'} w-28 h-40 rounded-xl p-3 flex flex-col items-center gap-1 border-2 border-transparent hover:border-yellow-400 transition-all`}>
            <span className="text-xs text-slate-300">{cd.cost===-1?'X':cd.cost} 能</span>
            <span className="font-bold text-white text-sm mt-1">{cd.name}</span>
            <span className="text-xs text-slate-300 text-center mt-auto">{cd.desc}</span>
          </button>;
        })}
        <button onClick={()=>pickReward(null)} className="bg-slate-700 w-28 h-40 rounded-xl p-3 flex flex-col items-center justify-center border-2 border-transparent hover:border-slate-400 transition-all text-slate-400 text-sm">跳過</button>
      </div>
      <p className="text-slate-400 text-xs">回復 10 HP → {Math.min(g.maxHp, g.hp+10)}/{g.maxHp}</p>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto p-2">
      <div className="flex items-center gap-3 w-full">
        <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
        <h2 className="text-lg font-bold text-white flex-1 text-center">地下城卡牌 - 第 {g.floor+1} 層</h2>
      </div>

      {/* Enemy */}
      <div className="w-full bg-slate-800 rounded-xl p-3 border border-slate-700">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-red-300">{eData.name} {eData.vuln>0&&<span className="text-xs text-orange-300">易傷{eData.vuln}</span>}</span>
          <span className="text-xs text-slate-400">意圖: {nextAction==='atk'?`⚔${eData.atk+(eData.str||0)}`:nextAction==='def'?'🛡+8':'💪+3'}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 mb-1">
          <div className="bg-red-500 h-3 rounded-full transition-all" style={{width:`${Math.max(0,eData.hp/eData.maxHp)*100}%`}}/>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>HP {eData.hp}/{eData.maxHp}</span>
          {g.eBlock>0&&<span className="text-blue-300">🛡{g.eBlock}</span>}
        </div>
      </div>

      {/* Player status */}
      <div className="w-full bg-slate-800 rounded-xl p-3 border border-slate-700">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white font-bold">玩家 {g.vuln>0&&<span className="text-xs text-orange-300">易傷{g.vuln}</span>} {g.str>0&&<span className="text-xs text-red-300">力量+{g.str}</span>}</span>
          <span className="text-yellow-400 font-bold">{g.energy}/{g.maxEnergy} 能量</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 mb-1">
          <div className="bg-green-500 h-3 rounded-full transition-all" style={{width:`${g.hp/g.maxHp*100}%`}}/>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>HP {g.hp}/{g.maxHp}</span>
          {g.block>0&&<span className="text-blue-300">🛡{g.block}</span>}
          <span>牌庫{g.deck.length} 棄牌{g.discard.length}</span>
        </div>
      </div>

      {/* Log */}
      {g.log.length>0&&<div className="text-xs text-slate-400 w-full text-center">{g.log[0]}</div>}

      {/* Hand */}
      <div className="flex gap-2 flex-wrap justify-center w-full">
        {g.hand.map((c,i)=>{
          const cd=CARD_DEFS[c]||{name:c,cost:1,desc:'',type:'A'};
          const canPlay = cd.cost===-1 ? true : g.energy>=cd.cost;
          return <button key={i} onClick={()=>canPlay&&playCard(i)}
            className={`${typeColor[cd.type]||'bg-slate-700'} w-24 h-36 rounded-xl p-2 flex flex-col items-center border-2 transition-all text-white ${canPlay?'hover:scale-110 hover:border-yellow-400 border-transparent cursor-pointer':'opacity-40 border-transparent cursor-not-allowed'}`}>
            <span className="text-xs font-bold self-start text-yellow-300">{cd.cost===-1?'X':cd.cost}</span>
            <span className="font-bold text-sm text-center mt-1">{cd.name}</span>
            <span className="text-xs text-slate-300 text-center mt-auto leading-tight">{cd.desc}</span>
          </button>;
        })}
      </div>

      <Button onClick={()=>setGs(prev=>endTurn(prev))} className="w-full max-w-xs">結束回合</Button>
    </div>
  );
};

// --- 五子棋 ---
const Gomoku = ({ onBack }) => {
  const SIZE = 15;
  const [board, setBoard] = useState(() => Array.from({length: SIZE}, () => Array(SIZE).fill(null)));
  const [turn, setTurn] = useState('black');
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  const checkWin = (b, r, c, p) => {
    for (const [dr, dc] of [[0,1],[1,0],[1,1],[1,-1]]) {
      const line = [[r, c]];
      for (const sign of [1, -1]) {
        let nr = r + dr * sign, nc = c + dc * sign;
        while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && b[nr][nc] === p) {
          line.push([nr, nc]); nr += dr * sign; nc += dc * sign;
        }
      }
      if (line.length >= 5) return line;
    }
    return null;
  };

  const place = (r, c) => {
    if (winner || board[r][c]) return;
    const nb = board.map(row => [...row]);
    nb[r][c] = turn;
    const mc = moveCount + 1;
    setBoard(nb); setMoveCount(mc);
    const line = checkWin(nb, r, c, turn);
    if (line) setWinner({ player: turn, line });
    else if (mc === SIZE * SIZE) setWinner({ draw: true });
    else setTurn(turn === 'black' ? 'white' : 'black');
  };

  const reset = () => { setBoard(Array.from({length: SIZE}, () => Array(SIZE).fill(null))); setTurn('black'); setWinner(null); setMoveCount(0); };
  const lineSet = new Set((winner?.line || []).map(([r, c]) => `${r},${c}`));

  return (
    <div className="flex flex-col items-center py-6 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CircleDot className="text-amber-400"/>五子棋</h2>
        <Button onClick={reset} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>
      <div className="text-base font-bold text-white mb-3 bg-slate-800/50 px-4 py-1 rounded-full border border-slate-700/50">
        {winner?.draw ? '平手！' : winner ? `${winner.player === 'black' ? '⚫ 黑子' : '⚪ 白子'} 獲勝！` :
          <>輪到: {turn === 'black' ? '⚫ 黑子' : '⚪ 白子'}</>}
      </div>
      <div className="bg-amber-700 p-1.5 rounded-lg shadow-2xl">
        <div className="grid" style={{gridTemplateColumns:`repeat(${SIZE}, minmax(0, 1fr))`, gap:1, width:'min(92vw, 480px)'}}>
          {board.flat().map((cell, idx) => {
            const r = Math.floor(idx / SIZE), c = idx % SIZE;
            const hit = lineSet.has(`${r},${c}`);
            return (
              <button key={idx} onClick={() => place(r, c)} disabled={!!winner || !!cell}
                className="aspect-square bg-amber-600 hover:bg-amber-500 flex items-center justify-center transition-colors touch-manipulation">
                {cell && <span className={`rounded-full ${cell === 'black' ? 'bg-slate-900' : 'bg-slate-100'} ${hit ? 'ring-2 ring-red-500' : ''}`} style={{width:'85%', height:'85%'}}/>}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-slate-500 mt-3 text-xs">橫/豎/斜連 5 顆即獲勝</p>
    </div>
  );
};

// --- 15 數字推盤 ---
const FifteenPuzzle = ({ onBack }) => {
  const SIZE = 4, TOTAL = SIZE * SIZE;
  const isWin = arr => arr.every((v, i) => v === (i + 1) % TOTAL);

  const shuffle = () => {
    const arr = Array.from({length: TOTAL}, (_, i) => (i + 1) % TOTAL);
    let blank = TOTAL - 1;
    for (let step = 0; step < 250; step++) {
      const r = Math.floor(blank/SIZE), c = blank%SIZE;
      const nbrs = [];
      if (r > 0) nbrs.push(blank - SIZE);
      if (r < SIZE-1) nbrs.push(blank + SIZE);
      if (c > 0) nbrs.push(blank - 1);
      if (c < SIZE-1) nbrs.push(blank + 1);
      const pick = nbrs[Math.floor(Math.random()*nbrs.length)];
      [arr[blank], arr[pick]] = [arr[pick], arr[blank]];
      blank = pick;
    }
    return arr;
  };

  const [tiles, setTiles] = useState(shuffle);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(() => bestStorage.load('fifteen'));
  const won = isWin(tiles);

  const tap = i => {
    if (won) return;
    const blank = tiles.indexOf(0);
    const r1 = Math.floor(blank/SIZE), c1 = blank%SIZE;
    const r2 = Math.floor(i/SIZE), c2 = i%SIZE;
    if (Math.abs(r1-r2) + Math.abs(c1-c2) !== 1) return;
    const nt = [...tiles];
    [nt[blank], nt[i]] = [nt[i], nt[blank]];
    const nm = moves + 1;
    setTiles(nt); setMoves(nm);
    if (isWin(nt) && (best === 0 || nm < best)) { bestStorage.save('fifteen', nm); setBest(nm); }
  };

  const reset = () => { setTiles(shuffle()); setMoves(0); };

  return (
    <div className="flex flex-col items-center py-6 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Hash className="text-indigo-400"/>數字推盤</h2>
        <Button onClick={reset} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>
      <div className="flex gap-4 mb-4">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center"><div className="text-slate-400 text-xs">步數</div><div className="text-2xl font-mono font-bold text-indigo-400">{moves}</div></div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center"><div className="text-slate-400 text-xs">最佳</div><div className="text-2xl font-mono font-bold text-yellow-400">{best || '—'}</div></div>
      </div>
      <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
        <div className="grid grid-cols-4 gap-2" style={{width:'min(85vw, 360px)'}}>
          {tiles.map((v, i) => (
            <button key={i} onClick={() => tap(i)} disabled={v === 0}
              className={`aspect-square rounded-lg text-2xl sm:text-3xl font-bold transition-all touch-manipulation ${v === 0 ? 'bg-transparent' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 active:scale-95 shadow-md'}`}>
              {v || ''}
            </button>
          ))}
        </div>
      </div>
      <p className="text-slate-500 mt-3 text-xs">點擊空格旁的數字滑動，按順序排到 1-15</p>
      <Modal isOpen={won} title="🎉 完成！" message={`總步數：${moves}${best && moves <= best ? '\n🏆 最佳記錄！' : ''}`} onConfirm={reset} confirmText="再玩一次" />
    </div>
  );
};

// --- 反應力測試 ---
const ReactionTest = ({ onBack }) => {
  const [phase, setPhase] = useState('idle');
  const [result, setResult] = useState(0);
  const [best, setBest] = useState(() => bestStorage.load('reaction'));
  const timerRef = useRef(null);
  const startRef = useRef(0);

  const begin = () => {
    setPhase('wait');
    const delay = 1000 + Math.random() * 3000;
    timerRef.current = setTimeout(() => { setPhase('go'); startRef.current = performance.now(); }, delay);
  };

  const click = () => {
    if (phase === 'idle' || phase === 'result' || phase === 'early') return begin();
    if (phase === 'wait') { clearTimeout(timerRef.current); setPhase('early'); return; }
    if (phase === 'go') {
      const ms = Math.round(performance.now() - startRef.current);
      setResult(ms);
      if (best === 0 || ms < best) { bestStorage.save('reaction', ms); setBest(ms); }
      setPhase('result');
    }
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const cfg = {
    idle:   { bg:'bg-blue-600',   msg:'點擊開始',      sub:'畫面變綠色時盡快點擊' },
    wait:   { bg:'bg-red-600',    msg:'等待中...',     sub:'看到綠色再點！' },
    go:     { bg:'bg-green-500',  msg:'點！',          sub:'' },
    result: { bg:'bg-blue-600',   msg:`${result} ms`,  sub: best && result <= best ? '🏆 新記錄！點擊再測一次' : '點擊再測一次' },
    early:  { bg:'bg-orange-500', msg:'太早了！',      sub:'點擊重新嘗試' },
  }[phase];

  return (
    <div className="flex flex-col items-center py-6 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Timer className="text-yellow-400"/>反應力測試</h2>
        <div className="w-10"/>
      </div>
      <div className="text-slate-400 mb-3 text-sm">最佳: {best ? `${best} ms` : '—'}</div>
      <button onClick={click}
        className={`${cfg.bg} transition-colors rounded-2xl flex flex-col items-center justify-center text-white font-bold shadow-2xl select-none touch-manipulation active:scale-95`}
        style={{width:'min(90vw, 420px)', height:'min(90vw, 420px)'}}>
        <div className="text-4xl sm:text-5xl mb-2">{cfg.msg}</div>
        {cfg.sub && <div className="text-sm sm:text-base opacity-90 px-4 text-center">{cfg.sub}</div>}
      </button>
    </div>
  );
};

// --- 剪刀石頭布 ---
const RPS = ({ onBack }) => {
  const CHOICES = [
    { id:'rock', emoji:'✊', name:'石頭' },
    { id:'paper', emoji:'✋', name:'布' },
    { id:'scissors', emoji:'✌️', name:'剪刀' },
  ];
  const BEATS = { rock:'scissors', paper:'rock', scissors:'paper' };

  const [player, setPlayer] = useState(null);
  const [cpu, setCpu] = useState(null);
  const [result, setResult] = useState('');
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [draws, setDraws] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => bestStorage.load('rps'));

  const play = choice => {
    const cpuPick = CHOICES[Math.floor(Math.random() * 3)];
    setPlayer(choice); setCpu(cpuPick);
    if (choice.id === cpuPick.id) { setDraws(d => d + 1); setResult('draw'); }
    else if (BEATS[choice.id] === cpuPick.id) {
      setWins(w => w + 1);
      setStreak(s => { const ns = s + 1; if (ns > best) { bestStorage.save('rps', ns); setBest(ns); } return ns; });
      setResult('win');
    } else { setLosses(l => l + 1); setStreak(0); setResult('lose'); }
  };

  const reset = () => { setPlayer(null); setCpu(null); setResult(''); setWins(0); setLosses(0); setDraws(0); setStreak(0); };

  const resText = { win:'你贏了！', lose:'你輸了', draw:'平手' }[result];
  const resColor = { win:'text-green-400', lose:'text-red-400', draw:'text-slate-300' }[result];

  return (
    <div className="flex flex-col items-center py-6 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Hand className="text-pink-400"/>剪刀石頭布</h2>
        <Button onClick={reset} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-6 w-full max-w-md px-4">
        {[
          {label:'勝', val:wins, color:'text-green-400'},
          {label:'敗', val:losses, color:'text-red-400'},
          {label:'和', val:draws, color:'text-slate-300'},
          {label:'連勝', val:`${streak}/${best}`, color:'text-yellow-400'},
        ].map(s => (
          <div key={s.label} className="bg-slate-800 px-2 py-2 rounded-lg border border-slate-700 text-center">
            <div className="text-slate-400 text-xs">{s.label}</div>
            <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6 min-h-[120px]">
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-2">你</div>
          <div className="text-6xl sm:text-7xl">{player?.emoji || '❔'}</div>
        </div>
        <div className={`text-xl sm:text-2xl font-bold ${resColor}`}>{result ? resText : 'VS'}</div>
        <div className="text-center">
          <div className="text-xs text-slate-400 mb-2">CPU</div>
          <div className="text-6xl sm:text-7xl">{cpu?.emoji || '❔'}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-md px-4">
        {CHOICES.map(c => (
          <button key={c.id} onClick={() => play(c)}
            className="bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 rounded-2xl py-4 flex flex-col items-center gap-1 transition-all active:scale-95 touch-manipulation">
            <span className="text-5xl">{c.emoji}</span>
            <span className="text-slate-300 text-sm">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- 別踩白塊 Piano Tiles ---
const PianoTiles = ({ onBack }) => {
  const W = 320, H = 480, COLS = 4, TILE_H = 120;
  const canvasRef = useRef(null);
  const gs = useRef(null);
  const rafRef = useRef(null);
  const [ui, setUi] = useState(() => ({ score: 0, status: 'idle', hi: bestStorage.load('pianotiles') }));

  const initGs = () => {
    const tiles = [];
    for (let i = 0; i < 6; i++) tiles.push({ col: Math.floor(Math.random() * COLS), y: H - (i+1) * TILE_H, hit: false });
    return { tiles, score: 0, speed: 3, status: 'playing' };
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const g = gs.current;
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1;
    for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i*W/COLS, 0); ctx.lineTo(i*W/COLS, H); ctx.stroke(); }
    if (g) {
      g.tiles.forEach(t => {
        if (t.hit) return;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(t.col * W/COLS + 2, t.y, W/COLS - 4, TILE_H - 4);
      });
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(0, H - 3, W, 3);
    }
  };

  const loop = useCallback(() => {
    const g = gs.current;
    if (!g || g.status !== 'playing') { draw(); return; }
    g.tiles.forEach(t => { t.y += g.speed; });
    const missed = g.tiles.find(t => !t.hit && t.y >= H);
    if (missed) {
      g.status = 'dead';
      setUi(u => ({ ...u, score: g.score, status: 'dead', hi: updateBest('pianotiles', u.hi, g.score) }));
      draw(); return;
    }
    g.tiles = g.tiles.filter(t => t.y < H + TILE_H);
    while (g.tiles.length < 6) {
      const highest = g.tiles.reduce((min, t) => Math.min(min, t.y), H);
      g.tiles.push({ col: Math.floor(Math.random() * COLS), y: highest - TILE_H, hit: false });
    }
    draw();
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const tap = (clientX, clientY) => {
    const g = gs.current;
    if (!g || g.status !== 'playing') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) * W / rect.width;
    const y = (clientY - rect.top) * H / rect.height;
    const col = Math.floor(x / (W / COLS));
    const hit = g.tiles.find(t => !t.hit && t.col === col && y >= t.y && y <= t.y + TILE_H);
    if (hit) {
      hit.hit = true;
      g.score++;
      g.speed = Math.min(12, 3 + g.score * 0.08);
      setUi(u => ({ ...u, score: g.score }));
    } else {
      g.status = 'dead';
      setUi(u => ({ ...u, score: g.score, status: 'dead', hi: updateBest('pianotiles', u.hi, g.score) }));
    }
  };

  const start = () => {
    cancelAnimationFrame(rafRef.current);
    gs.current = initGs();
    setUi(u => ({ ...u, score: 0, status: 'playing' }));
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return (
    <div className="flex flex-col items-center py-6 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18}/></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Music className="text-fuchsia-400"/>別踩白塊</h2>
        <Button onClick={start} variant="secondary" className="!px-3"><RotateCcw size={18}/></Button>
      </div>
      <div className="flex gap-4 mb-3">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center"><div className="text-slate-400 text-xs">分數</div><div className="text-2xl font-mono font-bold text-fuchsia-400">{ui.score}</div></div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center"><div className="text-slate-400 text-xs">最高</div><div className="text-2xl font-mono font-bold text-yellow-400">{ui.hi}</div></div>
      </div>
      <div className="relative border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl" style={{width:'min(90vw,320px)', aspectRatio:'320/480', touchAction:'none'}}>
        <canvas ref={canvasRef} width={W} height={H} style={{display:'block', width:'100%', height:'100%'}}
          onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; tap(t.clientX, t.clientY); }}
          onMouseDown={e => tap(e.clientX, e.clientY)}/>
        {ui.status === 'idle' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
            <p className="text-slate-300 text-sm text-center px-4">點擊下移的黑色方塊<br/>點到白色區即失敗</p>
            <Button onClick={start}><Play size={18}/>開始遊戲</Button>
          </div>
        )}
        {ui.status === 'dead' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
            <p className="text-2xl font-bold text-red-400">GAME OVER</p>
            <p className="text-slate-300">分數 {ui.score}</p>
            <Button onClick={start}><RotateCcw size={18}/>再試一次</Button>
            <Button onClick={onBack} variant="outline"><Home size={16}/>大廳</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- 背景音樂 ---
const MUSIC_SEQ = [
  523,659,784,880,1047,880,784,659,
  523,659,784,880, 784,659,523,440,
  523,784,880,784, 659,523,440,523,
  659,880,1047,880,784,659,523,523,
];
const MUSIC_BEAT = 0.1875; // 8th note @ BPM 160

const BgMusic = () => {
  const [on, setOn] = useState(false);
  const st = useRef({ ctx: null, timer: null, active: false });

  const loop = () => {
    const { ctx, active } = st.current;
    if (!ctx || !active) return;
    let t = ctx.currentTime + 0.05;
    MUSIC_SEQ.forEach(freq => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'square'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.055, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + MUSIC_BEAT * 0.82);
      o.start(t); o.stop(t + MUSIC_BEAT);
      t += MUSIC_BEAT;
    });
    // 提前 0.6 秒重排下一輪，讓音符之間不留靜默（overlap schedule 防止小段 gap）
    st.current.timer = setTimeout(loop, (MUSIC_SEQ.length * MUSIC_BEAT - 0.6) * 1000);
  };

  const toggle = () => {
    if (st.current.active) {
      st.current.active = false;
      clearTimeout(st.current.timer);
      st.current.ctx?.close(); st.current.ctx = null;
      setOn(false);
    } else {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      st.current = { ctx, timer: null, active: true };
      setOn(true);
      loop();
    }
  };

  useEffect(() => () => { clearTimeout(st.current.timer); st.current.ctx?.close(); }, []);

  return (
    <button onClick={toggle} title={on ? '關閉音樂' : '開啟背景音樂'}
      className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-slate-800/90 border border-slate-600 rounded-full flex items-center justify-center text-xl hover:bg-slate-700 active:scale-90 transition-all shadow-xl backdrop-blur-sm select-none">
      {on ? '🔊' : '🔇'}
    </button>
  );
};

// --- 主應用 ---

const App = () => {
  const [activeGame, setActiveGame] = useState(null);

  const games = [
    { id:'matchthree',  title:'三消遊戲',      desc:'點選相鄰寶石交換，消除 3 個以上！連鎖有加成。',      icon:<Grid3x3 size={40} className="text-pink-400"/>,  color:'from-pink-500/20 to-rose-500/10 border-pink-500/30',    badge:'1P', hot:true },
    { id:'fruitninja',  title:'切水果',        desc:'滑動切開水果！連切 COMBO 加分，漏掉水果扣命。',      icon:<Zap size={40} className="text-green-400"/>,    color:'from-green-500/20 to-teal-500/10 border-green-500/30',  badge:'1P', hot:true },
    { id:'tetris',      title:'俄羅斯方塊',   desc:'歷久彌新的神作！消行得分，節奏越來越快。支援手機。',  icon:<Layers size={40} className="text-cyan-400"/>,  color:'from-cyan-500/20 to-teal-500/10 border-cyan-500/30',    badge:'1P', hot:true },
    { id:'game2048',    title:'2048',          desc:'滑動合併數字，達到 2048！支援鍵盤與手機滑動。',       icon:<Grid3x3 size={40} className="text-orange-400"/>,color:'from-orange-500/20 to-yellow-500/10 border-orange-500/30',badge:'1P', hot:true },
    { id:'minesweeper', title:'踩地雷',        desc:'三種難度！右鍵插旗，找出所有地雷。經典益智遊戲。',   icon:<Target size={40} className="text-red-400"/>,   color:'from-red-500/20 to-rose-500/10 border-red-500/30',       badge:'1P', hot:true },
    { id:'spaceshooter',title:'太空射擊',      desc:'單人射擊！消滅外星艦隊，打到 3000 分挑戰 BOSS。',    icon:<Rocket size={40} className="text-blue-400"/>,  color:'from-blue-500/20 to-indigo-500/10 border-blue-500/30',  badge:'1P', hot:true },
    { id:'dinorun',     title:'恐龍跑酷',      desc:'跳過仙人掌、躲避飛鳥！越跑越快的無盡跑酷。',         icon:<Zap size={40} className="text-lime-400"/>,     color:'from-lime-500/20 to-green-500/10 border-lime-500/30',    badge:'1P', hot:true },
    { id:'flappybird',  title:'Flappy Bird',   desc:'點擊讓小鳥飛翔，穿越管道！手感極佳的虐心遊戲。',     icon:<Rocket size={40} className="text-yellow-400"/>,color:'from-yellow-500/20 to-amber-500/10 border-yellow-500/30',badge:'1P', hot:true },
    { id:'towerdefense',title:'塔防遊戲',      desc:'策略防守！擺放砲塔抵禦 8 波入侵，基地不失才算勝利。', icon:<Shield size={40} className="text-emerald-400"/>,color:'from-emerald-500/20 to-green-500/10 border-emerald-500/30', badge:'1P' },
    { id:'dungeoncard', title:'地下城卡牌',   desc:'類殺戮尖塔！用手牌戰鬥，擊敗 6 個敵人奪取勝利。', icon:<Layers size={40} className="text-violet-400"/>, color:'from-violet-500/20 to-purple-500/10 border-violet-500/30', badge:'1P' },
    { id:'fpracing',   title:'第一人稱賽車', desc:'偽3D視角！閃避前方車輛，3條命用完即結束。',    icon:<Car size={40} className="text-orange-400"/>,   color:'from-orange-500/20 to-red-500/10 border-orange-500/30', badge:'1P' },
    { id:'racing',     title:'俯視賽車',      desc:'支援單人/雙人競技，多種難度。持壓按鈕移動。',    icon:<Car size={40} className="text-red-500"/>,        color:'from-red-500/20 to-orange-500/10 border-red-500/30',    badge:'1-2P' },
    { id:'pong',        title:'乒乓球',        desc:'經典桌球！單人挑戰 CPU 或雙人同樂。',            icon:<CircleDot size={40} className="text-cyan-400"/>,  color:'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',     badge:'1-2P' },
    { id:'connectfour', title:'四子棋',        desc:'策略對戰！先在棋盤上連接 4 個棋子者獲勝。',      icon:<Swords size={40} className="text-blue-400"/>,    color:'from-blue-500/20 to-indigo-500/10 border-blue-500/30',   badge:'2P' },
    { id:'snake2p',     title:'雙人貪吃蛇',   desc:'同屏雙蛇對決！碰牆或撞到對方蛇身即落敗。',      icon:<Ghost size={40} className="text-teal-400"/>,     color:'from-teal-500/20 to-green-500/10 border-teal-500/30',    badge:'2P' },
    { id:'spacebattle', title:'太空對戰',      desc:'P1 vs P2 太空射擊！先打掉對方全部 HP 獲勝。',   icon:<Rocket size={40} className="text-indigo-400"/>,  color:'from-indigo-500/20 to-purple-500/10 border-indigo-500/30', badge:'2P' },
    { id:'snake',      title:'貪吃蛇',        desc:'滑動畫面或方向鍵控制，支援手機手勢。',            icon:<Ghost size={40} className="text-green-400"/>,   color:'from-green-500/20 to-emerald-500/10 border-green-500/30', badge:'1P' },
    { id:'breakout',   title:'打磚塊',        desc:'彈球破磚！清除全部磚塊即過關。',                 icon:<Zap size={40} className="text-yellow-400"/>,    color:'from-yellow-500/20 to-orange-500/10 border-yellow-500/30', badge:'1P' },
    { id:'whackamole', title:'打地鼠',        desc:'30 秒限時！用力敲打地鼠，手機超好玩。',           icon:<Target size={40} className="text-amber-400"/>,  color:'from-amber-500/20 to-yellow-500/10 border-amber-500/30', badge:'1P' },
    { id:'memory',     title:'記憶翻牌',      desc:'點擊翻牌配對，考驗短期記憶。',                   icon:<Brain size={40} className="text-purple-400"/>,  color:'from-purple-500/20 to-pink-500/10 border-purple-500/30', badge:'1P' },
    { id:'tictactoe',  title:'井字遊戲',      desc:'兩人輪流落子，連線即獲勝。',                     icon:<Grid3x3 size={40} className="text-blue-400"/>,  color:'from-blue-500/20 to-cyan-500/10 border-blue-500/30',    badge:'2P' },
    { id:'pianotiles', title:'別踩白塊',      desc:'點擊下落的黑磚！越快速度越快，踩白即失敗。',     icon:<Music size={40} className="text-fuchsia-400"/>, color:'from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/30', badge:'1P', hot:true },
    { id:'reaction',   title:'反應力測試',   desc:'畫面變綠時盡快點擊！個人最佳反應時間紀錄。',     icon:<Timer size={40} className="text-yellow-400"/>,  color:'from-yellow-500/20 to-amber-500/10 border-yellow-500/30', badge:'1P', hot:true },
    { id:'fifteen',    title:'15 數字推盤',  desc:'經典推盤益智！把 1-15 按順序排好，步數越少越厲害。', icon:<Hash size={40} className="text-indigo-400"/>,   color:'from-indigo-500/20 to-purple-500/10 border-indigo-500/30', badge:'1P', hot:true },
    { id:'rps',        title:'剪刀石頭布',   desc:'對戰 CPU 考人品！連勝次數會永久記錄。',          icon:<Hand size={40} className="text-pink-400"/>,     color:'from-pink-500/20 to-rose-500/10 border-pink-500/30',    badge:'1P', hot:true },
    { id:'gomoku',     title:'五子棋',        desc:'15×15 雙人對戰，橫豎斜連 5 顆即勝利。',          icon:<CircleDot size={40} className="text-amber-400"/>,color:'from-amber-500/20 to-yellow-500/10 border-amber-500/30', badge:'2P', hot:true },
  ];

  const renderGame = () => {
    const back = () => setActiveGame(null);
    switch (activeGame) {
      case 'matchthree':   return <MatchThree onBack={back} />;
      case 'fruitninja':   return <FruitNinja onBack={back} />;
      case 'tetris':       return <TetrisGame onBack={back} />;
      case 'game2048':     return <Game2048Wrapper onBack={back} />;
      case 'minesweeper':  return <Minesweeper onBack={back} />;
      case 'spaceshooter': return <SpaceShooter onBack={back} />;
      case 'dinorun':      return <DinoRun onBack={back} />;
      case 'flappybird':   return <FlappyBird onBack={back} />;
      case 'towerdefense': return <TowerDefense onBack={back} />;
      case 'dungeoncard':  return <DungeonCard onBack={back} />;
      case 'fpracing':   return <FPRacingGame onBack={back} />;
      case 'racing':     return <RacingGame onBack={back} />;
      case 'pong':        return <PongGame onBack={back} />;
      case 'connectfour': return <ConnectFour onBack={back} />;
      case 'snake2p':     return <Snake2P onBack={back} />;
      case 'spacebattle': return <SpaceBattle onBack={back} />;
      case 'snake':      return <SnakeGame onBack={back} />;
      case 'breakout':   return <BreakoutGame onBack={back} />;
      case 'whackamole': return <WhackAMole onBack={back} />;
      case 'memory':     return <MemoryGame onBack={back} />;
      case 'tictactoe':  return <TicTacToe onBack={back} />;
      case 'pianotiles': return <PianoTiles onBack={back} />;
      case 'reaction':   return <ReactionTest onBack={back} />;
      case 'fifteen':    return <FifteenPuzzle onBack={back} />;
      case 'rps':        return <RPS onBack={back} />;
      case 'gomoku':     return <Gomoku onBack={back} />;
      default: return null;
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveGame(null)}>
            <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-lg">
              <Gamepad2 size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">GameBox</h1>
          </div>
          <span className="text-sm font-medium text-slate-400">v{APP_VERSION} · {games.length} 款遊戲</span>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-[calc(100vh-80px)]">
        {activeGame ? (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            <GameErrorBoundary key={activeGame} onBack={() => setActiveGame(null)}>
              {renderGame()}
            </GameErrorBoundary>
          </div>
        ) : (
          <div className="w-full">
            <div className="text-center mb-10 py-8">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                準備好 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">開始玩樂</span> 了嗎？
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">電腦 · 手機均可遊玩，持壓按鈕比點擊更順手！</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {games.map(g => (
                <div key={g.id} className={`group relative bg-slate-800 rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20 ${g.color}`}>
                  <div className="absolute top-3 right-3 flex gap-1">
                    {g.hot && <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-500 text-white">NEW</span>}
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-700 text-slate-400">{g.badge}</span>
                  </div>
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">{g.icon}</div>
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-xl w-fit border border-slate-700/50 group-hover:scale-110 transition-transform duration-300">{g.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{g.title}</h3>
                  <p className="text-slate-400 text-sm mb-5 min-h-[2.5rem]">{g.desc}</p>
                  <Button onClick={() => setActiveGame(g.id)} className="w-full"><Play size={18} /> 開始遊戲</Button>
                </div>
              ))}
              <div className="bg-slate-800/50 border border-dashed border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-60">
                <Trophy size={40} className="text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-500">更多遊戲</h3>
                <p className="text-slate-600 text-sm mt-1">持續新增中...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm w-full">
        <p>&copy; {new Date().getFullYear()} GameBox Studio. Enjoy your time!</p>
      </footer>

      <BgMusic />

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default App;
