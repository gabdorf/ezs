import type { Cell, Rotation, TileTypeId } from './types';
import { GRID_SIZE } from './types';
import { createGrid, placeTile } from './grid';

/** Place 3 random cities on the grid */
export function generateLevel(): Cell[][] {
  const grid = createGrid();

  // Pick 3 unique random positions
  const positions: { x: number; y: number }[] = [];
  while (positions.length < 3) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!positions.some(p => p.x === x && p.y === y)) {
      positions.push({ x, y });
    }
  }

  for (const pos of positions) {
    // Randomly choose city1 or city2
    const typeId: TileTypeId = Math.random() < 0.5 ? 'city1' : 'city2';
    // Random rotation
    const rotation = Math.floor(Math.random() * 4) as Rotation;
    placeTile(grid, pos.x, pos.y, typeId, rotation);
  }

  return grid;
}
