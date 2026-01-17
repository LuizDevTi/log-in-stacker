
export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 24;

export const LOGIN_COLORS = {
  blue: '#00529B',
  orange: '#F58220',
  lightBlue: '#00A4E4',
  gray: '#4D4D4D',
  white: '#FFFFFF'
};

export const SHIP_NAMES = [
  "Log-In Endurance",
  "Log-In Experience",
  "Log-In Evolution",
  "Log-In Pantanal",
  "Log-In Jacarandá",
  "Log-In Resiliente",
  "Log-In Jatobá",
  "Log-In Polaris"
];

export type Point = { x: number; y: number };

export const SHAPES = [
  { shape: [[1, 1, 1, 1]], color: '#00529B' }, // I
  { shape: [[1, 1], [1, 1]], color: '#F58220' }, // O
  { shape: [[0, 1, 0], [1, 1, 1]], color: '#00A4E4' }, // T
  { shape: [[1, 0, 0], [1, 1, 1]], color: '#4D4D4D' }, // L
  { shape: [[0, 0, 1], [1, 1, 1]], color: '#00529B' }, // J
  { shape: [[0, 1, 1], [1, 1, 0]], color: '#F58220' }, // S
  { shape: [[1, 1, 0], [0, 1, 1]], color: '#00A4E4' }  // Z
];
