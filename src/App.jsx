import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Home, Trophy, Gamepad2, Grid3x3, Ghost, Brain, Car } from 'lucide-react';

/**
 * GameBox v1.5.1 - 緊急修復版
 * 1. 修正 Grid3X3 -> Grid3x3 (大小寫錯誤導致崩潰)
 * 2. 清理未使用的圖標引用
 */

// --- 共用組件 ---

const Button = ({ onClick, children, className = "", variant = "primary", disabled = false }) => {
  const baseStyle = "px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95 flex items-center justify-center gap-2 select-none touch-manipulation";
  const variants = {
    primary: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/50 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed",
    secondary: "bg-slate-700 text-white hover:bg-slate-600 shadow-md disabled:opacity-50",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-red-500/30 disabled:opacity-50",
    success: "bg-green-500 text-white hover:bg-green-600 shadow-green-500/30 disabled:opacity-50",
    outline: "border-2 border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white disabled:opacity-50",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Modal = ({ isOpen, title, message, onConfirm, confirmText = "確定", extraButtons }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-200 px-4">
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 max-w-sm w-full shadow-2xl transform scale-100">
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

const ScoreBoard = ({ score, bestScore, label = "得分" }) => (
  <div className="flex gap-4 mb-4 text-white">
    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
      <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">{label}</span>
      <span className="text-2xl font-mono font-bold text-blue-400">{score}</span>
    </div>
    {bestScore !== undefined && (
      <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
        <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block">最高分</span>
        <span className="text-2xl font-mono font-bold text-yellow-400">{bestScore}</span>
      </div>
    )}
  </div>
);

// --- 遊戲 1: 井字遊戲 (Tic-Tac-Toe) ---

const TicTacToe = ({ onBack }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleClick = (i) => {
    if (winner || board[i]) return;
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    
    const winResult = calculateWinner(newBoard);
    if (winResult) {
      setWinner(winResult);
    } else if (!newBoard.includes(null)) {
      setWinner({ winner: 'Draw' });
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full py-10 w-full">
      <div className="flex justify-between w-full max-w-md items-center mb-6 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Grid3x3 className="text-blue-400" /> 井字遊戲</h2>
        <Button onClick={resetGame} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>

      <div className="bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-700">
        <div className="grid grid-cols-3 gap-2">
          {board.map((square, i) => {
            const isWinningSquare = winner?.line?.includes(i);
            return (
              <button
                key={i}
                className={`w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl font-bold rounded-xl flex items-center justify-center transition-all duration-200 touch-manipulation
                  ${!square && !winner ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-700'}
                  ${square === 'X' ? 'text-blue-400' : 'text-pink-400'}
                  ${isWinningSquare ? 'bg-green-500/20 ring-2 ring-green-500' : ''}
                `}
                onClick={() => handleClick(i)}
                disabled={!!winner || !!square}
              >
                {square}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-xl font-bold text-white bg-slate-800/50 px-6 py-3 rounded-full backdrop-blur-sm border border-slate-700/50">
        {winner ? (
          winner.winner === 'Draw' ? <span className="text-slate-300">平手！再來一局吧</span> : 
          <span className="text-green-400">🎉 玩家 {winner.winner} 獲勝！</span>
        ) : (
          <span>輪到: <span className={xIsNext ? 'text-blue-400' : 'text-pink-400'}>{xIsNext ? 'X' : 'O'}</span></span>
        )}
      </div>
    </div>
  );
};

// --- 遊戲 2: 貪吃蛇 (Snake) ---

const SnakeGame = ({ onBack }) => {
  const GRID_SIZE = 20;
  const SPEED = 150;
  
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [direction, setDirection] = useState({ x: 0, y: 0 }); 
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      // 防止方向鍵捲動網頁
      if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      switch(e.key) {
        case 'ArrowUp': if(direction.y === 0) { setDirection({x: 0, y: -1}); setIsPaused(false); } break;
        case 'ArrowDown': if(direction.y === 0) { setDirection({x: 0, y: 1}); setIsPaused(false); } break;
        case 'ArrowLeft': if(direction.x === 0) { setDirection({x: -1, y: 0}); setIsPaused(false); } break;
        case 'ArrowRight': if(direction.x === 0) { setDirection({x: 1, y: 0}); setIsPaused(false); } break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameOver]);

  useEffect(() => {
    if (isPaused || gameOver) return;

    const moveSnake = setInterval(() => {
      setSnake(prevSnake => {
        const newHead = {
          x: prevSnake[0].x + direction.x,
          y: prevSnake[0].y + direction.y
        };

        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          handleGameOver();
          return prevSnake;
        }

        if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          generateFood(newSnake);
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, SPEED);

    return () => clearInterval(moveSnake);
  }, [direction, isPaused, gameOver, food]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsPaused(true);
    if (score > highScore) setHighScore(score);
  };

  const generateFood = (currentSnake) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) break;
    }
    setFood(newFood);
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection({ x: 0, y: 0 });
    setScore(0);
    setGameOver(false);
    setIsPaused(true);
    generateFood([{ x: 10, y: 10 }]);
  };

  const handleControl = (dir) => {
    if (gameOver) return;
    if (dir === 'UP' && direction.y === 0) { setDirection({x: 0, y: -1}); setIsPaused(false); }
    if (dir === 'DOWN' && direction.y === 0) { setDirection({x: 0, y: 1}); setIsPaused(false); }
    if (dir === 'LEFT' && direction.x === 0) { setDirection({x: -1, y: 0}); setIsPaused(false); }
    if (dir === 'RIGHT' && direction.x === 0) { setDirection({x: 1, y: 0}); setIsPaused(false); }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Ghost className="text-green-400" /> 貪吃蛇</h2>
        <Button onClick={resetGame} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>

      <ScoreBoard score={score} bestScore={highScore} />

      <div 
        className="relative bg-slate-900 border-2 border-slate-700 rounded-lg overflow-hidden shadow-2xl touch-none"
        style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
      >
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)` }}>
          {snake.map((segment, i) => (
            <div 
              key={`${segment.x}-${segment.y}`}
              className={`${i === 0 ? 'bg-green-400 z-10 rounded-sm' : 'bg-green-600 rounded-sm'} border-[0.5px] border-slate-900/20`}
              style={{ gridColumnStart: segment.x + 1, gridRowStart: segment.y + 1 }}
            />
          ))}
          <div 
            className="bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]"
            style={{ gridColumnStart: food.x + 1, gridRowStart: food.y + 1 }}
          />
        </div>

        {(isPaused && !gameOver && direction.x === 0 && direction.y === 0) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
            <div className="text-center">
              <p className="text-white text-xl font-bold mb-4">按方向鍵或按鈕開始</p>
              <div className="animate-bounce text-slate-300"><Gamepad2 size={32} className="mx-auto"/></div>
            </div>
          </div>
        )}

        <Modal 
          isOpen={gameOver} 
          title="遊戲結束" 
          message={`你的得分是 ${score} 分！`}
          onConfirm={resetGame}
          confirmText="再玩一次"
        />
      </div>

      {/* 觸控控制器 - 支援手機觸控，防止縮放 */}
      <div className="mt-6 grid grid-cols-3 gap-2 w-48 select-none touch-manipulation">
        <div />
        <Button onClick={() => handleControl('UP')} variant="secondary" className="h-12 !p-0 flex items-center justify-center active:bg-slate-500">⬆️</Button>
        <div />
        <Button onClick={() => handleControl('LEFT')} variant="secondary" className="h-12 !p-0 flex items-center justify-center active:bg-slate-500">⬅️</Button>
        <Button onClick={() => handleControl('DOWN')} variant="secondary" className="h-12 !p-0 flex items-center justify-center active:bg-slate-500">⬇️</Button>
        <Button onClick={() => handleControl('RIGHT')} variant="secondary" className="h-12 !p-0 flex items-center justify-center active:bg-slate-500">➡️</Button>
      </div>
      <p className="hidden sm:block text-slate-400 mt-4 text-sm">使用鍵盤方向鍵控制移動</p>
    </div>
  );
};

// --- 遊戲 3: 記憶翻牌 (Memory Match) ---

const MemoryGame = ({ onBack }) => {
  const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
  const [cards, setCards] = useState([]);
  const [turns, setTurns] = useState(0);
  const [choiceOne, setChoiceOne] = useState(null);
  const [choiceTwo, setChoiceTwo] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [isWon, setIsWon] = useState(false);

  const shuffleCards = () => {
    const shuffledCards = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji) => ({ emoji, id: Math.random(), matched: false }));
    
    setChoiceOne(null);
    setChoiceTwo(null);
    setCards(shuffledCards);
    setTurns(0);
    setIsWon(false);
    setDisabled(false);
  };

  useEffect(() => {
    shuffleCards();
  }, []);

  const handleChoice = (card) => {
    choiceOne ? setChoiceTwo(card) : setChoiceOne(card);
  };

  useEffect(() => {
    if (choiceOne && choiceTwo) {
      setDisabled(true);
      if (choiceOne.emoji === choiceTwo.emoji) {
        setCards(prevCards => prevCards.map(card => card.emoji === choiceOne.emoji ? { ...card, matched: true } : card));
        resetTurn();
      } else {
        setTimeout(() => resetTurn(), 800);
      }
    }
  }, [choiceOne, choiceTwo]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.matched)) {
      setTimeout(() => setIsWon(true), 500);
    }
  }, [cards]);

  const resetTurn = () => {
    setChoiceOne(null);
    setChoiceTwo(null);
    setTurns(prevTurns => prevTurns + 1);
    setDisabled(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl py-10">
      <div className="flex justify-between w-full items-center mb-6 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Brain className="text-purple-400" /> 記憶翻牌</h2>
        <Button onClick={shuffleCards} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>

      <div className="bg-slate-800 px-6 py-2 rounded-full mb-6 border border-slate-700">
        <span className="text-slate-400 font-bold">回合數: </span>
        <span className="text-white text-xl font-mono">{turns}</span>
      </div>

      <div className="grid grid-cols-4 gap-3 sm:gap-4 p-4">
        {cards.map(card => (
          <div 
            key={card.id} 
            className="relative w-16 h-16 sm:w-20 sm:h-20 cursor-pointer perspective-1000 touch-manipulation"
            onClick={() => {
              if (!disabled && !card.matched && card !== choiceOne) {
                handleChoice(card);
              }
            }}
          >
            <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${(card === choiceOne || card === choiceTwo || card.matched) ? 'rotate-y-180' : ''}`}>
              <div className="absolute w-full h-full bg-slate-700 rounded-xl border-2 border-slate-600 flex items-center justify-center backface-hidden shadow-lg hover:bg-slate-600">
                <span className="text-2xl">❓</span>
              </div>
              <div className={`absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center rotate-y-180 backface-hidden shadow-lg border-2 ${card.matched ? 'border-yellow-400' : 'border-purple-300'}`}>
                <span className="text-3xl sm:text-4xl">{card.emoji}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isWon}
        title="恭喜過關！"
        message={`你用了 ${turns} 個回合完成了遊戲。`}
        onConfirm={shuffleCards}
        confirmText="再玩一次"
      />
    </div>
  );
};

// --- 遊戲 4: 賽車 (Racing Game) ---

const RacingGame = ({ onBack }) => {
  const [gameStatus, setGameStatus] = useState('menu'); 
  const [mode, setMode] = useState(1); 
  const [difficulty, setDifficulty] = useState('normal'); // easy, normal, hard
  const [score, setScore] = useState(0);
  const [winner, setWinner] = useState(null);
  
  // 遊戲參數
  const GAME_WIDTH = 360;
  const GAME_HEIGHT = 500;
  const CAR_WIDTH = 30;
  const CAR_HEIGHT = 50;
  
  // 難度設定
  const DIFFICULTY_SETTINGS = {
    easy: { speed: 2, spawnRate: 0.015, playerSpeed: 4 },
    normal: { speed: 3.5, spawnRate: 0.02, playerSpeed: 5 },
    hard: { speed: 6, spawnRate: 0.035, playerSpeed: 6 }
  };
  
  const gameStateRef = useRef({
    p1: { x: 100, alive: true },
    p2: { x: 230, alive: true },
    obstacles: [],
    speed: 3,
    score: 0,
    frameId: null,
    keysPressed: {}
  });

  useEffect(() => {
    const handleKeyDown = (e) => gameStateRef.current.keysPressed[e.code] = true;
    const handleKeyUp = (e) => gameStateRef.current.keysPressed[e.code] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setScore(0);
    setWinner(null);
    setGameStatus('playing');
    
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    // 初始化位置 - 確保在各自跑道
    const p1StartX = selectedMode === 1 ? GAME_WIDTH/2 - CAR_WIDTH/2 : GAME_WIDTH/4 - CAR_WIDTH/2;
    const p2StartX = 3 * GAME_WIDTH/4 - CAR_WIDTH/2;

    gameStateRef.current = {
      p1: { x: p1StartX, alive: true },
      p2: { x: p2StartX, alive: true },
      obstacles: [],
      speed: settings.speed,
      score: 0,
      frameId: null,
      keysPressed: {},
      settings: settings // 儲存設定供 loop 使用
    };

    gameLoop();
  };

  const gameLoop = () => {
    const state = gameStateRef.current;
    const { playerSpeed } = state.settings;
    
    // 1. 移動玩家 (含邊界檢查)
    // 單人模式：全螢幕 | 雙人模式：P1 左半，P2 右半
    const halfWidth = GAME_WIDTH / 2;

    // P1 Controls
    if (state.p1.alive) {
      if (state.keysPressed['KeyA'] || state.keysPressed['ArrowLeft']) { // P1 也可以用方向鍵（單人時）
        if (mode === 1) { // 單人邊界
          if (state.p1.x > 0) state.p1.x -= playerSpeed;
        } else { // 雙人 P1 邊界 (左半)
           // 這裡 ArrowLeft 只對 P2 有效，所以要分離
           if (state.keysPressed['KeyA'] && state.p1.x > 0) state.p1.x -= playerSpeed;
        }
      }
      if (state.keysPressed['KeyD'] || state.keysPressed['ArrowRight']) {
         if (mode === 1) {
          if (state.p1.x < GAME_WIDTH - CAR_WIDTH) state.p1.x += playerSpeed;
         } else {
           if (state.keysPressed['KeyD'] && state.p1.x < halfWidth - CAR_WIDTH - 2) state.p1.x += playerSpeed;
         }
      }
    }

    // P2 Controls (僅雙人)
    if (mode === 2 && state.p2.alive) {
      if (state.keysPressed['ArrowLeft'] && state.p2.x > halfWidth + 2) state.p2.x -= playerSpeed;
      if (state.keysPressed['ArrowRight'] && state.p2.x < GAME_WIDTH - CAR_WIDTH) state.p2.x += playerSpeed;
    }

    // 2. 生成障礙物
    if (Math.random() < state.settings.spawnRate + (state.score * 0.00005)) {
      const obstacleWidth = 40;
      state.obstacles.push({
        id: Math.random(),
        x: Math.random() * (GAME_WIDTH - obstacleWidth),
        y: -50,
        width: obstacleWidth,
        height: 40,
        type: Math.random() > 0.5 ? '🪨' : '🚧'
      });
    }

    state.obstacles.forEach(obs => obs.y += state.speed);
    
    const remainingObstacles = state.obstacles.filter(obs => obs.y < GAME_HEIGHT);
    if (state.obstacles.length > remainingObstacles.length) {
      state.score += 10;
      setScore(state.score);
      // 隨時間微幅加速
      if (state.score % 200 === 0) state.speed += 0.2;
    }
    state.obstacles = remainingObstacles;

    // 3. 碰撞檢測
    const checkCollision = (player) => {
      const playerRect = { x: player.x + 8, y: GAME_HEIGHT - CAR_HEIGHT - 5, w: CAR_WIDTH - 16, h: CAR_HEIGHT - 10 }; 
      
      for (let obs of state.obstacles) {
        const obsRect = { x: obs.x + 5, y: obs.y + 5, w: obs.width - 10, h: obs.height - 10 };
        if (
          playerRect.x < obsRect.x + obsRect.w &&
          playerRect.x + playerRect.w > obsRect.x &&
          playerRect.y < obsRect.y + obsRect.h &&
          playerRect.y + playerRect.h > obsRect.y
        ) {
          return true;
        }
      }
      return false;
    };

    if (state.p1.alive && checkCollision(state.p1)) state.p1.alive = false;
    if (mode === 2 && state.p2.alive && checkCollision(state.p2)) state.p2.alive = false;

    // 4. 遊戲結束判斷
    if (mode === 1) {
      if (!state.p1.alive) {
        setWinner('GAME_OVER');
        setGameStatus('gameover');
        cancelAnimationFrame(state.frameId);
        return;
      }
    } else {
      if (!state.p1.alive && !state.p2.alive) {
        setWinner('DRAW');
        setGameStatus('gameover');
        cancelAnimationFrame(state.frameId);
        return;
      } else if (!state.p1.alive) {
        setWinner('P2');
        setGameStatus('gameover');
        cancelAnimationFrame(state.frameId);
        return;
      } else if (!state.p2.alive) {
        setWinner('P1');
        setGameStatus('gameover');
        cancelAnimationFrame(state.frameId);
        return;
      }
    }

    setDummyState(prev => prev + 1);
    state.frameId = requestAnimationFrame(gameLoop);
  };

  const [dummyState, setDummyState] = useState(0); 

  useEffect(() => {
    return () => cancelAnimationFrame(gameStateRef.current.frameId);
  }, []);

  // 觸控邏輯更新 (支援雙人)
  const handleTouch = (zone) => {
    // zone: 'p1-left', 'p1-right', 'p2-left', 'p2-right'
    const state = gameStateRef.current;
    const moveAmount = 25;
    const halfWidth = GAME_WIDTH / 2;

    if (mode === 1 && state.p1.alive) {
       // 單人全螢幕
       if ((zone === 'p1-left' || zone === 'p2-left') && state.p1.x > 0) state.p1.x -= moveAmount;
       if ((zone === 'p1-right' || zone === 'p2-right') && state.p1.x < GAME_WIDTH - CAR_WIDTH) state.p1.x += moveAmount;
    } else {
       // 雙人分區
       if (state.p1.alive) {
          if (zone === 'p1-left' && state.p1.x > 0) state.p1.x -= moveAmount;
          if (zone === 'p1-right' && state.p1.x < halfWidth - CAR_WIDTH - 2) state.p1.x += moveAmount;
       }
       if (state.p2.alive) {
          if (zone === 'p2-left' && state.p2.x > halfWidth + 2) state.p2.x -= moveAmount;
          if (zone === 'p2-right' && state.p2.x < GAME_WIDTH - CAR_WIDTH) state.p2.x += moveAmount;
       }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full py-10">
      <div className="flex justify-between w-full max-w-md items-center mb-4 px-4">
        <Button onClick={onBack} variant="outline" className="!px-3"><Home size={18} /></Button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Car className="text-red-500" /> 激速賽車</h2>
        <Button onClick={() => setGameStatus('menu')} variant="secondary" className="!px-3"><RotateCcw size={18} /></Button>
      </div>

      <ScoreBoard score={score} label={mode === 2 ? "生存分數" : "得分"} />

      <div 
        className="relative bg-slate-800 border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl touch-none"
        style={{ width: 'min(95vw, 360px)', height: 'min(80vh, 500px)' }}
      >
        {/* 道路背景 */}
        <div className="absolute inset-0 bg-slate-600 flex justify-center">
           {/* 中線 */}
           <div className="h-full w-2 bg-dashed border-r-2 border-l-2 border-slate-400 opacity-30" style={{ borderStyle: 'dashed' }}></div>
           {/* 雙人模式的分隔線 */}
           {mode === 2 && <div className="absolute h-full w-[2px] bg-yellow-400 z-0 opacity-50"></div>}
           <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent h-20"></div>
        </div>

        {/* 遊戲物件 */}
        {gameStatus !== 'menu' && (
          <>
            {gameStateRef.current.obstacles.map(obs => (
              <div 
                key={obs.id}
                className="absolute flex items-center justify-center text-3xl z-10"
                style={{ left: obs.x, top: obs.y, width: obs.width, height: obs.height }}
              >
                {obs.type}
              </div>
            ))}

            {gameStateRef.current.p1.alive && (
              <div 
                className="absolute text-4xl transition-transform z-10"
                style={{ left: gameStateRef.current.p1.x, top: GAME_HEIGHT - CAR_HEIGHT - 10 }}
              >
                🏎️
                {mode === 2 && <div className="absolute -top-6 left-0 text-xs font-bold text-blue-300 bg-black/50 px-1 rounded">P1</div>}
              </div>
            )}

            {mode === 2 && gameStateRef.current.p2.alive && (
              <div 
                className="absolute text-4xl transition-transform z-10"
                style={{ left: gameStateRef.current.p2.x, top: GAME_HEIGHT - CAR_HEIGHT - 10 }}
              >
                🚙
                <div className="absolute -top-6 left-0 text-xs font-bold text-red-300 bg-black/50 px-1 rounded">P2</div>
              </div>
            )}
          </>
        )}

        {/* 選單 Menu */}
        {gameStatus === 'menu' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 z-20">
             <div className="text-center mb-6">
               <h3 className="text-3xl font-bold text-white mb-2 italic transform -skew-x-12">TURBO RACING</h3>
             </div>

             {/* 難度選擇 */}
             <div className="w-full mb-6">
               <p className="text-slate-400 text-sm mb-2 text-center">選擇難度</p>
               <div className="grid grid-cols-3 gap-2">
                 {['easy', 'normal', 'hard'].map(diff => (
                   <button 
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`p-2 rounded-lg text-sm font-bold capitalize transition-all ${difficulty === diff ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-400'}`}
                   >
                     {diff === 'easy' ? '簡單' : diff === 'normal' ? '普通' : '困難'}
                   </button>
                 ))}
               </div>
             </div>
             
             <div className="w-full space-y-3">
                <button onClick={() => startGame(1)} className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold flex items-center justify-between group">
                   <div className="flex items-center gap-2">
                     <span className="bg-white/20 p-2 rounded-lg">👤</span>
                     <span>單人挑戰</span>
                   </div>
                   <Play size={18}/>
                </button>

                <button onClick={() => startGame(2)} className="w-full bg-red-600 hover:bg-red-500 text-white p-3 rounded-xl font-bold flex items-center justify-between group">
                   <div className="flex items-center gap-2">
                     <span className="bg-white/20 p-2 rounded-lg">👥</span>
                     <span>雙人對決</span>
                   </div>
                   <Play size={18}/>
                </button>
             </div>
          </div>
        )}

        {/* 觸控區域 - 支援雙人觸控 */}
        {gameStatus === 'playing' && (
           <div className="absolute inset-0 z-30 flex">
              {/* 左半邊 P1 */}
              <div className="w-1/2 h-full flex border-r border-white/5">
                <div className="w-1/2 h-full active:bg-blue-500/10" onTouchStart={(e) => { e.preventDefault(); handleTouch('p1-left'); }} onClick={() => handleTouch('p1-left')}></div>
                <div className="w-1/2 h-full active:bg-blue-500/10" onTouchStart={(e) => { e.preventDefault(); handleTouch('p1-right'); }} onClick={() => handleTouch('p1-right')}></div>
              </div>
              {/* 右半邊 P2 */}
              <div className="w-1/2 h-full flex">
                <div className="w-1/2 h-full active:bg-red-500/10" onTouchStart={(e) => { e.preventDefault(); handleTouch('p2-left'); }} onClick={() => handleTouch('p2-left')}></div>
                <div className="w-1/2 h-full active:bg-red-500/10" onTouchStart={(e) => { e.preventDefault(); handleTouch('p2-right'); }} onClick={() => handleTouch('p2-right')}></div>
              </div>
           </div>
        )}
      </div>

      <div className="mt-4 text-center text-slate-500 text-xs w-full max-w-sm px-4">
         {mode === 2 ? "觸控說明：左半螢幕控制 P1，右半螢幕控制 P2" : "點擊螢幕左/右兩側即可移動"}
      </div>

      <Modal 
        isOpen={gameStatus === 'gameover'} 
        title={winner === 'GAME_OVER' ? "💥 發生車禍！" : "🏆 比賽結束"}
        message={
          winner === 'GAME_OVER' ? `難度：${difficulty === 'easy' ? '簡單' : difficulty === 'normal' ? '普通' : '困難'}\n得分：${score}` :
          winner === 'DRAW' ? "兩敗俱傷！這是個平局。" :
          `恭喜 ${winner === 'P1' ? '玩家 1 (藍車)' : '玩家 2 (紅車)'} 獲勝！\n堅持了 ${score} 分`
        }
        onConfirm={() => setGameStatus('menu')}
        confirmText="回主選單"
        extraButtons={
           <Button onClick={() => startGame(mode)} variant="secondary" className="w-full">再玩一次</Button>
        }
      />
    </div>
  );
};

// --- 主應用與大廳 (Lobby) ---

const App = () => {
  const [activeGame, setActiveGame] = useState(null);

  const games = [
    {
      id: 'racing',
      title: '激速賽車',
      description: '支援單人/雙人競技，多種難度可選。觸控與鍵盤皆可遊玩。',
      icon: <Car size={40} className="text-red-500" />,
      color: 'from-red-500/20 to-orange-500/10 border-red-500/30'
    },
    {
      id: 'snake',
      title: '貪吃蛇',
      description: '經典遊戲，支援手機虛擬按鍵控制。',
      icon: <Ghost size={40} className="text-green-400" />,
      color: 'from-green-500/20 to-emerald-500/10 border-green-500/30'
    },
    {
      id: 'tictactoe',
      title: '井字遊戲',
      description: '經典的 OX 棋局，支援觸控操作。',
      icon: <Grid3x3 size={40} className="text-blue-400" />,
      color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30'
    },
    {
      id: 'memory',
      title: '記憶翻牌',
      description: '點擊翻牌，考驗你的短期記憶。',
      icon: <Brain size={40} className="text-purple-400" />,
      color: 'from-purple-500/20 to-pink-500/10 border-purple-500/30'
    }
  ];

  const renderGame = () => {
    switch (activeGame) {
      case 'snake': return <SnakeGame onBack={() => setActiveGame(null)} />;
      case 'tictactoe': return <TicTacToe onBack={() => setActiveGame(null)} />;
      case 'memory': return <MemoryGame onBack={() => setActiveGame(null)} />;
      case 'racing': return <RacingGame onBack={() => setActiveGame(null)} />;
      default: return null;
    }
  };

  return (
    // 修正：這裡是最外層的容器，使用 w-full 和 overflow-x-hidden
    <div className="w-full min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 頂部導航列 */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40 w-full">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => setActiveGame(null)}>
            <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-lg">
              <Gamepad2 size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 cursor-pointer">
              GameBox
            </h1>
          </div>
          <div className="flex gap-4 text-sm font-medium text-slate-400">
             <span>v1.5.1</span>
          </div>
        </div>
      </header>

      {/* 內容區域 */}
      <main className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col items-center min-h-[calc(100vh-80px)]">
        {activeGame ? (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderGame()}
          </div>
        ) : (
          <div className="w-full">
            <div className="text-center mb-12 py-10">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                準備好 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">開始玩樂</span> 了嗎？
              </h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                選擇一款遊戲，立即開始挑戰。不需要下載，打開即玩！
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {games.map((game) => (
                <div 
                  key={game.id}
                  className={`group relative bg-slate-800 rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-900/20 ${game.color}`}
                >
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                    {game.icon}
                  </div>
                  
                  <div className="mb-4 p-3 bg-slate-900/50 rounded-xl w-fit border border-slate-700/50 group-hover:scale-110 transition-transform duration-300">
                    {game.icon}
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 h-10">{game.description}</p>

                  <Button 
                    onClick={() => setActiveGame(game.id)} 
                    className="w-full group-hover:bg-blue-600"
                  >
                    <Play size={18} /> 開始遊戲
                  </Button>
                </div>
              ))}
              
              {/* Coming Soon Card */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center opacity-70 border-dashed">
                <Trophy size={40} className="text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-500">更多遊戲</h3>
                <p className="text-slate-600 text-sm">敬請期待...</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-auto py-6 text-center text-slate-500 text-sm w-full">
        <p>&copy; {new Date().getFullYear()} GameBox Studio. Enjoy your time!</p>
      </footer>

      {/* CSS 補充：3D 翻轉效果 */}
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