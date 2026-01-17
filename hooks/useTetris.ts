
import { useState, useEffect, useCallback, useRef } from 'react';
import { COLS, ROWS, SHAPES, Point, SHIP_NAMES } from '../constants';

export const useTetris = () => {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<{ pos: Point; shape: number[][]; color: string } | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const isValidMove = (pos: Point, shape: number[][], currentGrid: string[][]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          // Verifica limites laterais e fundo
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return false;
          }
          // Verifica colisão com blocos já existentes
          if (newY >= 0 && currentGrid[newY][newX]) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const spawnPiece = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * SHAPES.length);
    const piece = SHAPES[randomIdx];
    // Tenta spawnar um pouco acima ou no topo
    const startY = 0;
    const newPos = { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: startY };
    
    if (!isValidMove(newPos, piece.shape, grid)) {
      setGameOver(true);
      return null;
    }
    return { pos: newPos, shape: piece.shape, color: piece.color };
  }, [grid]);

  const lockPiece = useCallback((currentPiece: { pos: Point; shape: number[][]; color: string }, currentGrid: string[][]) => {
    const newGrid = currentGrid.map(row => [...row]);
    let hitTop = false;

    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const gridY = currentPiece.pos.y + y;
          const gridX = currentPiece.pos.x + x;
          if (gridY >= 0) {
            newGrid[gridY][gridX] = currentPiece.color;
          } else {
            // Se travou acima do topo visível
            hitTop = true;
          }
        }
      });
    });

    if (hitTop) {
      setGameOver(true);
      return;
    }

    let linesInThisTurn = 0;
    const filteredGrid = newGrid.filter(row => {
      const isFull = row.every(cell => cell !== '');
      if (isFull) linesInThisTurn++;
      return !isFull;
    });

    if (linesInThisTurn > 0) {
      const linePoints = [0, 100, 300, 500, 800];
      const gain = linePoints[linesInThisTurn] * level;
      setScore(prev => prev + gain);
      
      setLinesClearedTotal(prev => {
        const newTotal = prev + linesInThisTurn;
        const newLevel = Math.min(SHIP_NAMES.length, Math.floor(newTotal / 10) + 1);
        if (newLevel > level) setLevel(newLevel);
        return newTotal;
      });
    }

    while (filteredGrid.length < ROWS) {
      filteredGrid.unshift(Array(COLS).fill(''));
    }

    setGrid(filteredGrid);
    setActivePiece(null); // Força spawn de nova peça no próximo tick/effect
  }, [level]);

  const moveDown = useCallback((isManual = false) => {
    if (!activePiece || gameOver) return;
    const nextPos = { ...activePiece.pos, y: activePiece.pos.y + 1 };
    if (isValidMove(nextPos, activePiece.shape, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
      if (isManual) setScore(prev => prev + 1);
    } else {
      lockPiece(activePiece, grid);
    }
  }, [activePiece, grid, lockPiece, gameOver]);

  const hardDrop = useCallback(() => {
    if (!activePiece || gameOver) return;
    let currentY = activePiece.pos.y;
    let dropDist = 0;
    
    while (isValidMove({ ...activePiece.pos, y: currentY + 1 }, activePiece.shape, grid)) {
      currentY++;
      dropDist++;
    }
    
    const finalPiece = { ...activePiece, pos: { ...activePiece.pos, y: currentY } };
    setScore(prev => prev + (dropDist * 2));
    lockPiece(finalPiece, grid);
  }, [activePiece, grid, gameOver, lockPiece]);

  const moveLeft = useCallback(() => {
    if (!activePiece || gameOver) return;
    const nextPos = { ...activePiece.pos, x: activePiece.pos.x - 1 };
    if (isValidMove(nextPos, activePiece.shape, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
    }
  }, [activePiece, grid, gameOver]);

  const moveRight = useCallback(() => {
    if (!activePiece || gameOver) return;
    const nextPos = { ...activePiece.pos, x: activePiece.pos.x + 1 };
    if (isValidMove(nextPos, activePiece.shape, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
    }
  }, [activePiece, grid, gameOver]);

  const handleRotate = useCallback(() => {
    if (!activePiece || gameOver) return;
    const rotated = activePiece.shape[0].map((_, i) => activePiece.shape.map(row => row[i]).reverse());
    if (isValidMove(activePiece.pos, rotated, grid)) {
      setActivePiece(prev => prev ? { ...prev, shape: rotated } : null);
    } else {
      // Tenta um "wall kick" simples para facilitar rotação perto de bordas
      const kicks = [{x: -1, y: 0}, {x: 1, y: 0}, {x: 0, y: -1}];
      for (const kick of kicks) {
        const kickedPos = { x: activePiece.pos.x + kick.x, y: activePiece.pos.y + kick.y };
        if (isValidMove(kickedPos, rotated, grid)) {
          setActivePiece(prev => prev ? { ...prev, shape: rotated, pos: kickedPos } : null);
          return;
        }
      }
    }
  }, [activePiece, grid, gameOver]);

  useEffect(() => {
    if (!activePiece && !gameOver) {
      const next = spawnPiece();
      if (next) setActivePiece(next);
    }
  }, [activePiece, gameOver, spawnPiece]);

  const update = useCallback((time: number) => {
    if (gameOver) return;
    const deltaTime = time - lastTimeRef.current;
    // Aceleração mais agressiva a cada nível
    const dropInterval = Math.max(70, 850 * Math.pow(0.75, level - 1));

    if (deltaTime > dropInterval) {
      moveDown();
      lastTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(update);
  }, [moveDown, level, gameOver]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [update]);

  const reset = () => {
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
    setScore(0);
    setLevel(1);
    setLinesClearedTotal(0);
    setGameOver(false);
    setActivePiece(null);
    lastTimeRef.current = performance.now();
  };

  return { grid, activePiece, score, level, linesClearedTotal, gameOver, reset, moveLeft, moveRight, moveDown: () => moveDown(true), handleRotate, hardDrop };
};
