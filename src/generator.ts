import type { Cell, Rotation, TileTypeId } from './types';
import { GRID_SIZE, NEIGHBOR_OFFSET } from './types';
import { getRotatedEdges } from './tiles';
import { createGrid, placeTile, isInBounds } from './grid';

/** Get rotations where all track exits point inward (not off the grid edge) */
function getValidRotations(x: number, y: number, typeId: TileTypeId): Rotation[] {
  const valid: Rotation[] = [];
  for (const rot of [0, 1, 2, 3] as Rotation[]) {
    const edges = getRotatedEdges(typeId, rot);
    const allInward = edges.every(dir => {
      const { dx, dy } = NEIGHBOR_OFFSET[dir];
      return isInBounds(x + dx, y + dy);
    });
    if (allInward) valid.push(rot);
  }
  return valid;
}

/** Check if two positions are adjacent (share an edge) */
function areAdjacent(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx + dy) === 1;
}

/** Place 3 random cities on the grid with valid orientations */
export function generateLevel(): Cell[][] {
  const grid = createGrid();

  // Pick 3 positions that are not adjacent to each other
  const positions: { x: number; y: number }[] = [];
  let attempts = 0;
  while (positions.length < 3 && attempts < 200) {
    attempts++;
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);

    // Must not overlap or be adjacent to existing cities
    if (positions.some(p => (p.x === x && p.y === y) || areAdjacent(p, { x, y }))) {
      continue;
    }

    // Must have at least one valid rotation for city1 or city2
    const c1Rots = getValidRotations(x, y, 'city1');
    const c2Rots = getValidRotations(x, y, 'city2');
    if (c1Rots.length === 0 && c2Rots.length === 0) continue;

    positions.push({ x, y });
  }

  for (const pos of positions) {
    // Pick a city type that has valid rotations at this position
    const c1Rots = getValidRotations(pos.x, pos.y, 'city1');
    const c2Rots = getValidRotations(pos.x, pos.y, 'city2');

    let typeId: TileTypeId;
    let rotation: Rotation;

    if (c1Rots.length > 0 && c2Rots.length > 0) {
      // Both work, pick randomly
      if (Math.random() < 0.5) {
        typeId = 'city1';
        rotation = c1Rots[Math.floor(Math.random() * c1Rots.length)];
      } else {
        typeId = 'city2';
        rotation = c2Rots[Math.floor(Math.random() * c2Rots.length)];
      }
    } else if (c1Rots.length > 0) {
      typeId = 'city1';
      rotation = c1Rots[Math.floor(Math.random() * c1Rots.length)];
    } else {
      typeId = 'city2';
      rotation = c2Rots[Math.floor(Math.random() * c2Rots.length)];
    }

    placeTile(grid, pos.x, pos.y, typeId, rotation);
  }

  return grid;
}
