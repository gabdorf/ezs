import type { Cell, TileTypeId, Rotation } from './types';
import { GRID_SIZE, CELL_SIZE } from './types';
import { TILE_DEFS } from './tiles';
import { getTile } from './grid';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HALF = CELL_SIZE / 2;

/** Cache for fetched SVG contents (innerHTML string per tile type) */
const svgCache = new Map<TileTypeId, string>();

/** Preload all tile SVGs so rendering is synchronous */
export async function preloadTileSvgs(): Promise<void> {
  const types: TileTypeId[] = ['straight', 'curve', 'switch', 'triangle', 'crossing', 'city1', 'city2'];
  await Promise.all(types.map(async (typeId) => {
    const resp = await fetch(`/tiles/${typeId}.svg`);
    const text = await resp.text();
    // Extract the inner content of the <svg> tag
    const match = text.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    svgCache.set(typeId, match ? match[1] : '');
  }));
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
  return el;
}

/** Insert the cached SVG content for a tile, rotated around center */
function drawTile(g: SVGGElement, typeId: TileTypeId, rotation: Rotation): void {
  const content = svgCache.get(typeId);
  if (!content) return;

  const inner = createSvgElement('g');
  if (rotation !== 0) {
    inner.setAttribute('transform', `rotate(${rotation * 90}, ${HALF}, ${HALF})`);
  }
  inner.innerHTML = content;
  g.appendChild(inner);
}

export function createBoardSvg(
  grid: Cell[][],
  onCellClick: (x: number, y: number) => void,
  conflicts: Set<string>,
  selectedType: TileTypeId | null,
): SVGSVGElement {
  const totalSize = GRID_SIZE * CELL_SIZE;
  const svg = createSvgElement('svg', {
    width: totalSize, height: totalSize,
    viewBox: `0 0 ${totalSize} ${totalSize}`,
  });

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const g = createSvgElement('g', {
        transform: `translate(${x * CELL_SIZE}, ${y * CELL_SIZE})`,
      });
      g.style.cursor = 'pointer';

      const tile = getTile(grid, x, y);
      const hasConflict = conflicts.has(`${x},${y}`);

      // Cell background
      let fill = '#e8e8e0';
      if (tile && TILE_DEFS[tile.typeId].isCity) {
        fill = '#f5e6cc';
      } else if (tile) {
        fill = '#d4d4c8';
      } else if (selectedType) {
        fill = '#e8e8d8';
      }
      if (hasConflict) {
        fill = '#f5c6c6';
      }

      const bg = createSvgElement('rect', {
        x: 0.5, y: 0.5, width: CELL_SIZE - 1, height: CELL_SIZE - 1,
        fill, stroke: '#aaa', 'stroke-width': 1, rx: 3,
      });
      g.appendChild(bg);

      // Hover effect for empty cells
      if (!tile) {
        bg.addEventListener('mouseenter', () => bg.setAttribute('fill', '#d0d0c0'));
        bg.addEventListener('mouseleave', () => bg.setAttribute('fill', fill));
      }

      // Draw tile content
      if (tile) {
        drawTile(g, tile.typeId, tile.rotation);
      }

      g.addEventListener('click', () => onCellClick(x, y));
      svg.appendChild(g);
    }
  }

  return svg;
}

/** Render a small preview tile for the palette */
export function createTilePreview(typeId: TileTypeId, rotation: Rotation, size: number = 50): SVGSVGElement {
  const svg = createSvgElement('svg', {
    width: size, height: size,
    viewBox: `0 0 ${CELL_SIZE} ${CELL_SIZE}`,
  });

  const bg = createSvgElement('rect', {
    x: 0.5, y: 0.5, width: CELL_SIZE - 1, height: CELL_SIZE - 1,
    fill: '#d4d4c8', stroke: '#aaa', 'stroke-width': 1, rx: 3,
  });
  svg.appendChild(bg);

  const g = createSvgElement('g');
  drawTile(g, typeId, rotation);
  svg.appendChild(g);

  return svg;
}
