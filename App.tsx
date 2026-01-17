
import React, { useMemo, useEffect } from 'react';
import { useTetris } from './hooks/useTetris.ts';
import { COLS, ROWS, BLOCK_SIZE, Point, SHIP_NAMES } from './constants.ts';
import ContainerBlock from './components/ContainerBlock.tsx';

const App: React.FC = () => {
  const { 
    grid, 
    activePiece, 
    score, 
    level, 
    linesClearedTotal,
    gameOver, 
    reset, 
    moveLeft, 
    moveRight, 
    moveDown, 
    handleRotate, 
    hardDrop 
  } = useTetris();

  useEffect(() => {
    if (gameOver && window.parent) {
      window.parent.postMessage({ type: 'LOG_IN_GAME_SCORE', score, level, ship: SHIP_NAMES[level-1] }, '*');
    }
  }, [gameOver, score, level]);

  const dynamicBlockSize = useMemo(() => {
    if (typeof window === 'undefined') return BLOCK_SIZE;
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const availableHeight = vh - 260; 
    const sizeByHeight = Math.floor(availableHeight / ROWS);
    const sizeByWidth = Math.floor((vw - 30) / COLS);
    return Math.min(sizeByHeight, sizeByWidth, BLOCK_SIZE);
  }, []);

  const getGhostPosition = (): Point | null => {
    if (!activePiece) return null;
    let ghostY = activePiece.pos.y;
    const isValid = (y: number) => {
      for (let row = 0; row < activePiece.shape.length; row++) {
        for (let col = 0; col < activePiece.shape[row].length; col++) {
          if (activePiece.shape[row][col]) {
            const newY = y + row;
            const newX = activePiece.pos.x + col;
            if (newY >= ROWS || (newY >= 0 && grid[newY][newX])) return false;
          }
        }
      }
      return true;
    };
    while (isValid(ghostY + 1)) ghostY++;
    return { x: activePiece.pos.x, y: ghostY };
  };

  const ghostPos = getGhostPosition();
  const levelProgress = (linesClearedTotal % 10) * 10;
  const currentShipName = SHIP_NAMES[Math.min(level - 1, SHIP_NAMES.length - 1)];

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-slate-900 text-white select-none overflow-hidden font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,#00529b22_0%,transparent_50%)] pointer-events-none" />

      <header className="w-full py-2 flex flex-col items-center z-10 shrink-0">
        <div className="bg-white px-3 py-1 rounded-full shadow-lg flex items-center scale-75 sm:scale-90 transition-transform">
          <span className="text-[#00529B] font-extrabold text-base tracking-tighter">Log-In</span>
          <span className="mx-2 h-3 w-[1px] bg-slate-200"></span>
          <span className="text-[#F58220] font-bold text-[8px] tracking-widest uppercase">Operação de Navios</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full overflow-hidden px-2">
        <div className="relative shrink-0">
          <div className="absolute -top-6 left-0 right-0 flex justify-center">
             <div className="bg-slate-800/80 backdrop-blur px-3 py-0.5 rounded-t-lg border-x border-t border-slate-600 text-[9px] font-bold text-[#F58220] uppercase tracking-widest">
                Embarcação: {currentShipName.replace('Log-In ', '')}
             </div>
          </div>

          <div 
            className="bg-slate-950/90 backdrop-blur-sm border-x-4 border-b-4 border-slate-700 rounded-b-xl shadow-2xl relative overflow-hidden"
            style={{ 
              width: COLS * dynamicBlockSize + 8, 
              height: ROWS * dynamicBlockSize + 4,
              borderColor: '#334155'
            }}
          >
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundSize: `${dynamicBlockSize}px ${dynamicBlockSize}px`, backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)' }} />

            {grid.map((row, y) => row.map((color, x) => (
              color ? (
                <div key={`fixed-${x}-${y}`} style={{ position: 'absolute', top: y * dynamicBlockSize, left: x * dynamicBlockSize }}>
                  <ContainerBlock color={color} size={dynamicBlockSize} />
                </div>
              ) : null
            )))}

            {activePiece && ghostPos && !gameOver && (
              <div className="absolute top-0 left-0 pointer-events-none">
                 {activePiece.shape.map((row, y) => row.map((value, x) => (
                     value ? (
                       <div key={`ghost-${x}-${y}`} style={{ position: 'absolute', top: (ghostPos.y + y) * dynamicBlockSize, left: (ghostPos.x + x) * dynamicBlockSize }}>
                         <ContainerBlock color={activePiece.color} size={dynamicBlockSize} isGhost={true} />
                       </div>
                     ) : null
                 )))}
              </div>
            )}

            {activePiece && !gameOver && (
              <div className="absolute top-0 left-0 pointer-events-none">
                 {activePiece.shape.map((row, y) => row.map((value, x) => (
                     value ? (
                       <div key={`active-${x}-${y}`} style={{ position: 'absolute', top: (activePiece.pos.y + y) * dynamicBlockSize, left: (activePiece.pos.x + x) * dynamicBlockSize }}>
                         <ContainerBlock color={activePiece.color} size={dynamicBlockSize} />
                       </div>
                     ) : null
                 )))}
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center z-50 p-4 text-center animate-in zoom-in duration-300">
                 <div className="text-[#F58220] font-black text-xl mb-1 italic uppercase tracking-tighter">Porto Interrompido</div>
                 <p className="text-slate-400 text-[10px] mb-4 uppercase font-bold">Capacidade máxima atingida</p>
                 
                 <div className="bg-slate-800 p-3 rounded-xl mb-6 w-48 border-2 border-slate-700 shadow-2xl">
                   <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Carga no {currentShipName.replace('Log-In ', '')}</div>
                   <div className="text-2xl font-black text-white">{score.toLocaleString()}</div>
                   <div className="text-[8px] text-[#F58220] mt-2 font-bold">NÍVEL FINAL: {level}</div>
                 </div>
                 
                 <button onClick={reset} className="bg-[#00529B] hover:bg-blue-600 text-white px-8 py-3 rounded-full font-black text-[10px] tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,82,155,0.4)] uppercase">
                   Reiniciar Logística
                 </button>
              </div>
            )}
          </div>

          <div 
            className="h-10 bg-slate-800 rounded-b-3xl relative -mt-1 shadow-2xl border-t-2 border-slate-600 flex flex-col items-center justify-center overflow-hidden"
            style={{ width: COLS * dynamicBlockSize + 16, marginLeft: '-4px' }}
          >
             <div className="absolute top-0 left-0 w-full h-[2px] bg-white/5"></div>
             <span className="text-white/40 font-black tracking-widest text-[9px] uppercase">{currentShipName}</span>
             <span className="text-white/10 text-[6px] uppercase font-bold">Terminal Portuário Log-In</span>
             <div className="absolute bottom-0 left-0 h-1 bg-[#00529B] w-full opacity-50"></div>
          </div>
        </div>
      </main>

      <footer className="w-full bg-slate-900/95 border-t border-slate-800 p-3 shrink-0 z-20">
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between items-end mb-3 px-1">
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">Score Operacional</span>
              <span className="font-black text-xl leading-none text-white">{score.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-end w-32">
              <div className="flex justify-between w-full mb-1">
                <span className="text-[7px] text-[#F58220] uppercase font-bold truncate pr-2">NÍVEL {level}</span>
                <span className="text-[7px] text-slate-500 font-bold whitespace-nowrap">{linesClearedTotal} LINHAS</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div 
                  className="h-full bg-gradient-to-r from-[#F58220] to-[#ffab66] transition-all duration-300 shadow-[0_0_8px_rgba(245,130,32,0.5)]" 
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            <button onPointerDown={(e) => { e.preventDefault(); moveLeft(); }} className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center border-b-4 border-slate-950 transition-all active:translate-y-0.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button onPointerDown={(e) => { e.preventDefault(); handleRotate(); }} className="h-14 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-xl flex items-center justify-center border-b-4 border-slate-950 transition-all active:translate-y-0.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
            </button>
            <button onPointerDown={(e) => { e.preventDefault(); moveRight(); }} className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center border-b-4 border-slate-950 transition-all active:translate-y-0.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button onPointerDown={(e) => { e.preventDefault(); moveDown(); }} className="h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center border-b-4 border-slate-950 transition-all active:translate-y-0.5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <button onPointerDown={(e) => { e.preventDefault(); hardDrop(); }} className="h-14 bg-[#F58220] hover:bg-[#ff953f] active:bg-[#e67610] rounded-xl flex items-center justify-center border-b-4 border-[#a3530c] transition-all active:translate-y-0.5 shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><path d="M7 13l5 5 5-5M7 6l5 5 5-5"/></svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
