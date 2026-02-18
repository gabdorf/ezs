import type { Cell, TileTypeId, Rotation } from './types';
import { TILE_DEFS } from './tiles';
import { PLACEABLE_TYPES } from './tiles';
import { placeTile, removeTile, getTile } from './grid';
import { validateGrid } from './validation';
import { createBoardSvg, createTilePreview } from './renderer';
import { generateLevel } from './generator';

interface GameState {
  grid: Cell[][];
  selectedType: TileTypeId | null;
  currentRotation: Rotation;
  message: string;
  won: boolean;
}

let state: GameState = {
  grid: generateLevel(),
  selectedType: null,
  currentRotation: 0,
  message: 'Wähle ein Plättchen und klicke auf das Spielfeld.',
  won: false,
};

let appEl: HTMLElement;

function render(): void {
  appEl.innerHTML = '';

  // Header
  const header = document.createElement('h1');
  header.textContent = 'Schienen-Puzzle';
  appEl.appendChild(header);

  // Main layout
  const layout = document.createElement('div');
  layout.className = 'layout';
  appEl.appendChild(layout);

  // Sidebar: tile palette
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  layout.appendChild(sidebar);

  const paletteTitle = document.createElement('h3');
  paletteTitle.textContent = 'Plättchen';
  sidebar.appendChild(paletteTitle);

  for (const typeId of PLACEABLE_TYPES) {
    const def = TILE_DEFS[typeId];
    const btn = document.createElement('button');
    btn.className = 'tile-btn' + (state.selectedType === typeId ? ' selected' : '');
    btn.title = def.label;

    const preview = createTilePreview(typeId, typeId === state.selectedType ? state.currentRotation : 0);
    btn.appendChild(preview);

    const label = document.createElement('span');
    label.textContent = def.label;
    btn.appendChild(label);

    btn.addEventListener('click', () => {
      if (state.won) return;
      state.selectedType = state.selectedType === typeId ? null : typeId;
      if (state.selectedType === typeId) state.currentRotation = 0;
      render();
    });

    sidebar.appendChild(btn);
  }

  // Rotation button
  const rotateBtn = document.createElement('button');
  rotateBtn.className = 'rotate-btn';
  rotateBtn.textContent = '↻ Drehen (R)';
  rotateBtn.disabled = !state.selectedType;
  rotateBtn.addEventListener('click', () => {
    if (state.selectedType) {
      state.currentRotation = ((state.currentRotation + 1) % 4) as Rotation;
      render();
    }
  });
  sidebar.appendChild(rotateBtn);

  // Board area
  const boardArea = document.createElement('div');
  boardArea.className = 'board-area';
  layout.appendChild(boardArea);

  // Compute conflicts for display
  const { conflicts } = validateGrid(state.grid);
  const conflictCells = new Set<string>();
  for (const c of conflicts) {
    conflictCells.add(`${c.x},${c.y}`);
  }

  const svg = createBoardSvg(state.grid, onCellClick, conflictCells, state.selectedType);
  boardArea.appendChild(svg);

  // Bottom bar
  const bottomBar = document.createElement('div');
  bottomBar.className = 'bottom-bar';
  appEl.appendChild(bottomBar);

  // Check button
  const checkBtn = document.createElement('button');
  checkBtn.className = 'check-btn';
  checkBtn.textContent = '✓ Prüfen';
  checkBtn.addEventListener('click', onCheck);
  bottomBar.appendChild(checkBtn);

  // New game button
  const newBtn = document.createElement('button');
  newBtn.className = 'new-btn';
  newBtn.textContent = '↺ Neues Spiel';
  newBtn.addEventListener('click', () => {
    state = {
      grid: generateLevel(),
      selectedType: null,
      currentRotation: 0,
      message: 'Wähle ein Plättchen und klicke auf das Spielfeld.',
      won: false,
    };
    render();
  });
  bottomBar.appendChild(newBtn);

  // Message
  const msg = document.createElement('div');
  msg.className = 'message' + (state.won ? ' won' : '');
  msg.textContent = state.message;
  bottomBar.appendChild(msg);
}

function onCellClick(x: number, y: number): void {
  if (state.won) return;

  const existing = getTile(state.grid, x, y);

  // If clicking a city, do nothing
  if (existing && TILE_DEFS[existing.typeId].isCity) {
    state.message = 'Städte können nicht verschoben werden.';
    render();
    return;
  }

  // If cell has a player tile, remove it
  if (existing) {
    removeTile(state.grid, x, y);
    state.message = 'Plättchen entfernt.';
    render();
    return;
  }

  // If a tile type is selected, place it
  if (state.selectedType) {
    placeTile(state.grid, x, y, state.selectedType, state.currentRotation);
    state.message = `${TILE_DEFS[state.selectedType].label} platziert.`;
    render();
    return;
  }

  state.message = 'Wähle zuerst ein Plättchen aus.';
  render();
}

function onCheck(): void {
  const result = validateGrid(state.grid);
  if (result.valid) {
    state.message = 'Gewonnen! Alle Städte sind verbunden!';
    state.won = true;
  } else if (result.conflicts.length > 0) {
    state.message = `${result.conflicts.length / 2} Kantenkonflikte gefunden. Rot markierte Zellen prüfen.`;
  } else if (!result.connected) {
    state.message = 'Keine Konflikte, aber die Städte sind noch nicht alle verbunden.';
  }
  render();
}

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'r' || e.key === 'R') {
    if (state.selectedType && !state.won) {
      state.currentRotation = ((state.currentRotation + 1) % 4) as Rotation;
      render();
    }
  }
}

export function initUI(el: HTMLElement): void {
  appEl = el;
  document.addEventListener('keydown', onKeyDown);
  render();
}
