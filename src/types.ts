export type Direction = 'top' | 'right' | 'bottom' | 'left';

export const DIRECTIONS: Direction[] = ['top', 'right', 'bottom', 'left'];

export const OPPOSITE: Record<Direction, Direction> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
};

export const NEIGHBOR_OFFSET: Record<Direction, { dx: number; dy: number }> = {
  top: { dx: 0, dy: -1 },
  right: { dx: 1, dy: 0 },
  bottom: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
};

export type TileTypeId =
  | 'straight'
  | 'curve'
  | 'switch'
  | 'triangle'
  | 'crossing'
  | 'city1'
  | 'city2';

/** Which edges have tracks at rotation 0, and which internal connections exist */
export interface TileDefinition {
  id: TileTypeId;
  label: string;
  edges: Direction[];
  /** Pairs of connected edges (internal routing) */
  connections: [Direction, Direction][];
  isCity: boolean;
}

export type Rotation = 0 | 1 | 2 | 3; // 0=0°, 1=90°, 2=180°, 3=270°

export interface PlacedTile {
  typeId: TileTypeId;
  rotation: Rotation;
}

export interface Cell {
  tile: PlacedTile | null;
}

export const GRID_SIZE = 5;
export const CELL_SIZE = 90;
export const TRACK_WIDTH = 6;
