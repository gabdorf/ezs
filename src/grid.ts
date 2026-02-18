import type { Cell, PlacedTile, Direction, Rotation, TileTypeId } from './types';
import { GRID_SIZE, DIRECTIONS, NEIGHBOR_OFFSET, OPPOSITE } from './types';
import { hasTrackOnEdge } from './tiles';

export function createGrid(): Cell[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ tile: null }))
  );
}

export function placeTile(grid: Cell[][], x: number, y: number, typeId: TileTypeId, rotation: Rotation): void {
  grid[y][x].tile = { typeId, rotation };
}

export function removeTile(grid: Cell[][], x: number, y: number): void {
  grid[y][x].tile = null;
}

export function getTile(grid: Cell[][], x: number, y: number): PlacedTile | null {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null;
  return grid[y][x].tile;
}

export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

export function getNeighborCoords(x: number, y: number, dir: Direction): { nx: number; ny: number } | null {
  const { dx, dy } = NEIGHBOR_OFFSET[dir];
  const nx = x + dx;
  const ny = y + dy;
  return isInBounds(nx, ny) ? { nx, ny } : null;
}

/** Check if placing a tile at (x,y) would violate edge rules with placed neighbors */
export function checkEdgeConflicts(grid: Cell[][], x: number, y: number, typeId: TileTypeId, rotation: Rotation): Direction[] {
  const conflicts: Direction[] = [];
  for (const dir of DIRECTIONS) {
    const neighbor = getNeighborCoords(x, y, dir);
    if (!neighbor) continue;
    const neighborTile = getTile(grid, neighbor.nx, neighbor.ny);
    if (!neighborTile) continue;

    const myTrack = hasTrackOnEdge(typeId, rotation, dir);
    const neighborTrack = hasTrackOnEdge(neighborTile.typeId, neighborTile.rotation, OPPOSITE[dir]);

    if (myTrack !== neighborTrack) {
      conflicts.push(dir);
    }
  }
  return conflicts;
}

/** Get all edge conflicts in the entire grid */
export function getAllConflicts(grid: Cell[][]): { x: number; y: number; dir: Direction }[] {
  const conflicts: { x: number; y: number; dir: Direction }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = getTile(grid, x, y);
      if (!tile) continue;
      for (const dir of DIRECTIONS) {
        const neighbor = getNeighborCoords(x, y, dir);
        if (!neighbor) continue;
        const neighborTile = getTile(grid, neighbor.nx, neighbor.ny);
        if (!neighborTile) continue;
        const myTrack = hasTrackOnEdge(tile.typeId, tile.rotation, dir);
        const neighborTrack = hasTrackOnEdge(neighborTile.typeId, neighborTile.rotation, OPPOSITE[dir]);
        if (myTrack !== neighborTrack) {
          conflicts.push({ x, y, dir });
        }
      }
    }
  }
  return conflicts;
}
