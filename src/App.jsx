import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, Home, Trophy, Gamepad2, Grid3x3, Ghost, Brain, Car, Zap, Target, CircleDot, Swords, Rocket } from 'lucide-react';

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
  const [best, setBest] = useState(0);
  const [paused, setPaused] = useState(true);
  const touch = useRef(null);

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
        const head = { x: prev[0].x + dir.x, y: prev[0].y + dir.y };
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID || prev.some(s => s.x === head.x && s.y === head.y)) {
          setGameOver(true); setPaused(true);
          setBest(b => Math.max(b, score));
          return prev;
        }
        const ns = [head, ...prev];
        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          let nf;
          do { nf = { x: Math.floor(Math.random()*GRID), y: Math.floor(Math.random()*GRID) }; }
          while (ns.some(s => s.x === nf.x && s.y === nf.y));
          setFood(nf);
        } else ns.pop();
        return ns;
      });
    }, SPEED);
    return () => clearInterval(t);
  }, [dir, paused, gameOver, food, score]);

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
              <div className="absolute text-4xl z-10" style={{left:gs.current.p1.x, top:GH-CH-10}}>
                🏎️{mode===2&&<div className="absolute -top-6 left-0 text-xs font-bold text-blue-300 bg-black/50 px-1 rounded">P1</div>}
              </div>
            )}
            {mode===2 && gs.current.p2.alive && (
              <div className="absolute text-4xl z-10" style={{left:gs.current.p2.x, top:GH-CH-10}}>
                🚙<div className="absolute -top-6 left-0 text-xs font-bold text-red-300 bg-black/50 px-1 rounded">P2</div>
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
  const [best, setBest] = useState(0);
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
          setBest(b => Math.max(b, scoreRef.current));
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

  const gs = useRef({
    ball: {x:W/2,y:H-70,vx:3,vy:-4}, pad:{x:W/2-PW/2},
    bricks: [], lives:3, score:0, frameId:null, keys:{},
    tc: {left:false,right:false},
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
    s.ball = {x:W/2,y:H-70,vx:3*(Math.random()>0.5?1:-1),vy:-4};
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
      s.ball = {x:W/2,y:H-70,vx:3*(Math.random()>0.5?1:-1),vy:-4};
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
      <div className="flex gap-4 mb-4">
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">得分</div>
          <div className="text-2xl font-mono font-bold text-yellow-400">{score}</div>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-center">
          <div className="text-slate-400 text-xs">生命</div>
          <div className="text-xl">{Array.from({length: lives}).map((_, i) => <span key={i}>❤️</span>)}</div>
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

// --- 主應用 ---

const App = () => {
  const [activeGame, setActiveGame] = useState(null);

  const games = [
    { id:'fpracing',   title:'第一人稱賽車', desc:'偽3D視角！閃避前方車輛，3條命用完即結束。',    icon:<Car size={40} className="text-orange-400"/>,   color:'from-orange-500/20 to-red-500/10 border-orange-500/30', badge:'1P', hot:true },
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
  ];

  const renderGame = () => {
    const back = () => setActiveGame(null);
    switch (activeGame) {
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
          <span className="text-sm font-medium text-slate-400">v2.1 · {games.length} 款遊戲</span>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-[calc(100vh-80px)]">
        {activeGame ? (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
            {renderGame()}
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
