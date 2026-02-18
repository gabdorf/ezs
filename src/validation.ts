import type { Cell, Direction } from './types';
import { GRID_SIZE, DIRECTIONS, OPPOSITE, NEIGHBOR_OFFSET } from './types';
import { TILE_DEFS, getRotatedConnections, hasTrackOnEdge } from './tiles';
import { getTile, isInBounds } from './grid';

/** Node in the connectivity graph: a specific edge of a specific cell */
interface EdgeNode {
  x: number;
  y: number;
  dir: Direction;
}

function edgeKey(node: EdgeNode): string {
  return `${node.x},${node.y},${node.dir}`;
}

function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

/**
 * Check if all cities are connected via internal track routing.
 * Returns true if all cities can reach each other.
 */
export function checkConnectivity(grid: Cell[][]): { connected: boolean; reachableCities: string[] } {
  // Find all cities
  const cities: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = getTile(grid, x, y);
      if (tile && TILE_DEFS[tile.typeId].isCity) {
        cities.push({ x, y });
      }
    }
  }

  if (cities.length < 2) return { connected: true, reachableCities: cities.map(c => cellKey(c.x, c.y)) };

  // BFS from the first city through the edge-connection graph
  const startCity = cities[0];
  const visited = new Set<string>();
  const queue: EdgeNode[] = [];

  // Seed: add all track edges of the start city
  const startTile = getTile(grid, startCity.x, startCity.y)!;
  const startConnections = getRotatedConnections(startTile.typeId, startTile.rotation);
  const startEdges = new Set<Direction>();
  for (const [a, b] of startConnections) {
    startEdges.add(a);
    startEdges.add(b);
  }
  // For city1 (single edge, no connections array), add the single edge too
  if (TILE_DEFS[startTile.typeId].id === 'city1') {
    const def = TILE_DEFS[startTile.typeId];
    for (const e of def.edges) {
      const rotated = DIRECTIONS[(DIRECTIONS.indexOf(e) + startTile.rotation) % 4];
      startEdges.add(rotated);
    }
  }

  for (const dir of startEdges) {
    const key = edgeKey({ x: startCity.x, y: startCity.y, dir });
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({ x: startCity.x, y: startCity.y, dir });
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;

    // 1. Internal connections: from this edge, which other edges of the same tile can we reach?
    const tile = getTile(grid, current.x, current.y);
    if (!tile) continue;

    const connections = getRotatedConnections(tile.typeId, tile.rotation);
    for (const [a, b] of connections) {
      let next: Direction | null = null;
      if (a === current.dir) next = b;
      if (b === current.dir) next = a;
      if (next) {
        const node: EdgeNode = { x: current.x, y: current.y, dir: next };
        const key = edgeKey(node);
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(node);
        }
      }
    }

    // 2. External connection: cross to the neighbor tile's opposite edge
    const { dx, dy } = NEIGHBOR_OFFSET[current.dir];
    const nx = current.x + dx;
    const ny = current.y + dy;
    if (isInBounds(nx, ny)) {
      const neighborTile = getTile(grid, nx, ny);
      if (neighborTile) {
        const oppositeDir = OPPOSITE[current.dir];
        if (hasTrackOnEdge(neighborTile.typeId, neighborTile.rotation, oppositeDir)) {
          const node: EdgeNode = { x: nx, y: ny, dir: oppositeDir };
          const key = edgeKey(node);
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(node);
          }
        }
      }
    }
  }

  // Check which cities were reached
  const reachableCities: string[] = [];
  for (const city of cities) {
    const cityTile = getTile(grid, city.x, city.y)!;
    const cityDef = TILE_DEFS[cityTile.typeId];
    // A city is reached if any of its track edges was visited
    const cityEdges = cityDef.edges.map(
      e => DIRECTIONS[(DIRECTIONS.indexOf(e) + cityTile.rotation) % 4]
    );
    const reached = cityEdges.some(dir => visited.has(edgeKey({ x: city.x, y: city.y, dir })));
    if (reached) {
      reachableCities.push(cellKey(city.x, city.y));
    }
  }

  return {
    connected: reachableCities.length === cities.length,
    reachableCities,
  };
}

/** Full validation: no edge conflicts AND all cities connected */
export function validateGrid(grid: Cell[][]): { valid: boolean; conflicts: { x: number; y: number; dir: Direction }[]; connected: boolean } {
  const conflicts: { x: number; y: number; dir: Direction }[] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const tile = getTile(grid, x, y);
      if (!tile) continue;
      for (const dir of DIRECTIONS) {
        const { dx, dy } = NEIGHBOR_OFFSET[dir];
        const nx = x + dx;
        const ny = y + dy;
        if (!isInBounds(nx, ny)) continue;
        const neighbor = getTile(grid, nx, ny);
        if (!neighbor) continue;
        const myTrack = hasTrackOnEdge(tile.typeId, tile.rotation, dir);
        const neighborTrack = hasTrackOnEdge(neighbor.typeId, neighbor.rotation, OPPOSITE[dir]);
        if (myTrack !== neighborTrack) {
          conflicts.push({ x, y, dir });
        }
      }
    }
  }

  const { connected } = checkConnectivity(grid);
  return { valid: conflicts.length === 0 && connected, conflicts, connected };
}
