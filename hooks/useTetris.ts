
import { useState, useEffect, useCallback, useRef } from 'react';
import { COLS, ROWS, SHAPES, Point, SHIP_NAMES } from '../constants';

export const useTetris = () => {
  const [grid, setGrid] = useState<string[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill('')));
  const [activePiece, setActivePiece] = useState<{ pos: Point; shape: number[][]; color: string } | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const isValidMove = (pos: Point, shape: number[][], currentGrid: string[][]) => {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
          if (newY >= 0 && currentGrid[newY][newX]) return false;
        }
      }
    }
    return true;
  };

  const lockPiece = useCallback((piece: { pos: Point; shape: number[][]; color: string }, currentGrid: string[][]) => {
    const newGrid = currentGrid.map(row => [...row]);
    let outOfBounds = false;

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const gridY = piece.pos.y + y;
          const gridX = piece.pos.x + x;
          if (gridY < 0) {
            outOfBounds = true;
          } else {
            newGrid[gridY][gridX] = piece.color;
          }
        }
      });
    });

    if (outOfBounds) {
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
      setScore(s => s + gain);
      
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
    setActivePiece(null);
  }, [level]);

  const spawnPiece = useCallback(() => {
    const randomIdx = Math.floor(Math.random() * SHAPES.length);
    const piece = SHAPES[randomIdx];
    const newPos = { x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: -1 };
    
    // Se o spawn básico já colidir, game over imediato
    if (!isValidMove(newPos, piece.shape, grid)) {
      setGameOver(true);
      return null;
    }
    return { pos: newPos, shape: piece.shape, color: piece.color };
  }, [grid]);

  const moveDown = useCallback((isManual = false) => {
    if (!activePiece || gameOver) return;
    const nextPos = { ...activePiece.pos, y: activePiece.pos.y + 1 };
    
    if (isValidMove(nextPos, activePiece.shape, grid)) {
      setActivePiece(prev => prev ? { ...prev, pos: nextPos } : null);
      if (isManual) setScore(s => s + 1);
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
    setScore(s => s + (dropDist * 2));
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
    const dropInterval = Math.max(70, 850 * Math.pow(0.72, level - 1));

    if (deltaTime > dropInterval) {
      moveDown();
      lastTimeRef.current = time;
    }
    gameLoopRef.current = requestAnimationFrame(update);
  }, [moveDown, level, gameOver]);

  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
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
