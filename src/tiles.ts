import type { TileDefinition, TileTypeId, Direction, Rotation } from './types';
import { DIRECTIONS } from './types';

export const TILE_DEFS: Record<TileTypeId, TileDefinition> = {
  straight: {
    id: 'straight',
    label: 'Gerade',
    edges: ['top', 'bottom'],
    connections: [['top', 'bottom']],
    isCity: false,
  },
  curve: {
    id: 'curve',
    label: 'Kurve',
    edges: ['top', 'right'],
    connections: [['top', 'right']],
    isCity: false,
  },
  switch: {
    id: 'switch',
    label: 'Weiche',
    edges: ['top', 'right', 'bottom'],
    connections: [['top', 'bottom'], ['top', 'right'], ['bottom', 'right']],
    isCity: false,
  },
  triangle: {
    id: 'triangle',
    label: 'Dreieck',
    edges: ['top', 'right', 'bottom'],
    connections: [['top', 'right'], ['right', 'bottom'], ['top', 'bottom']],
    isCity: false,
  },
  crossing: {
    id: 'crossing',
    label: 'Kreuzung',
    edges: ['top', 'right', 'bottom', 'left'],
    connections: [['top', 'bottom'], ['right', 'left']],
    isCity: false,
  },
  city1: {
    id: 'city1',
    label: 'Stadt (1)',
    edges: ['bottom'],
    connections: [],
    isCity: true,
  },
  city2: {
    id: 'city2',
    label: 'Stadt (2)',
    edges: ['top', 'bottom'],
    connections: [['top', 'bottom']],
    isCity: true,
  },
};

export const PLACEABLE_TYPES: TileTypeId[] = [
  'straight', 'curve', 'switch', 'triangle', 'crossing',
];

/** Rotate a direction clockwise by `steps` 90° increments */
export function rotateDirection(dir: Direction, steps: Rotation): Direction {
  const idx = DIRECTIONS.indexOf(dir);
  return DIRECTIONS[(idx + steps) % 4];
}

/** Get the edges of a tile after rotation */
export function getRotatedEdges(typeId: TileTypeId, rotation: Rotation): Direction[] {
  const def = TILE_DEFS[typeId];
  return def.edges.map(e => rotateDirection(e, rotation));
}

/** Get the internal connections of a tile after rotation */
export function getRotatedConnections(typeId: TileTypeId, rotation: Rotation): [Direction, Direction][] {
  const def = TILE_DEFS[typeId];
  return def.connections.map(([a, b]) => [
    rotateDirection(a, rotation),
    rotateDirection(b, rotation),
  ]);
}

/** Check if a tile has a track on a given edge (after rotation) */
export function hasTrackOnEdge(typeId: TileTypeId, rotation: Rotation, dir: Direction): boolean {
  return getRotatedEdges(typeId, rotation).includes(dir);
}
