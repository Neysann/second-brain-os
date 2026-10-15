// ===================================================================
// Syntropy Stylus — helpers purs (géométrie, rendu, export, formes)
// Tout est exprimé en coordonnées "monde" (surface infinie).
// ===================================================================
import type { InkStroke, InkDocument, InkBackground, InkPaperColor } from '@/types';
import katex from 'katex';

export const BG_COLOR = '#09090b'; // zinc-950
export const HIGHLIGHT_ALPHA = 0.38;
export const GRID = 32;

export const PAPER_COLORS: Record<InkPaperColor, { bg: string; line: string; dot: string; name: string }> = {
  dark: { bg: '#09090b', line: 'rgba(255,255,255,0.08)', dot: 'rgba(255,255,255,0.22)', name: 'Noir Pur (OLED)' },
  white: { bg: '#ffffff', line: 'rgba(0,0,0,0.07)', dot: 'rgba(0,0,0,0.20)', name: 'Blanc Pur' },
  sepia: { bg: '#fbf0d9', line: 'rgba(120,53,15,0.10)', dot: 'rgba(120,53,15,0.22)', name: 'Jauni / Crème (Confort)' },
  slate: { bg: '#1e293b', line: 'rgba(255,255,255,0.08)', dot: 'rgba(255,255,255,0.22)', name: 'Ardoise Sombre' },
};

/** Renvoie la couleur de base optimale du stylo (Noir sur feuille claire, Blanc sur feuille sombre) */
export function getDefaultPenColor(paper: InkPaperColor): string {
  return paper === 'white' || paper === 'sepia' ? '#18181b' : '#ffffff';
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PathLike {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  closePath(): void;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function safeColor(c: string): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : '#ffffff';
}

// -------------------------------------------------------------------
// Géométrie
// -------------------------------------------------------------------
export function distPointToSegment(
  px: number, py: number, ax: number, ay: number, bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function pointInPolygon(x: number, y: number, poly: number[]): boolean {
  let inside = false;
  const n = poly.length / 2;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i * 2], yi = poly[i * 2 + 1];
    const xj = poly[j * 2], yj = poly[j * 2 + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function strokeBounds(s: InkStroke): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < s.points.length; i += 3) {
    const x = s.points[i], y = s.points[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const pad = s.width * 0.8;
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

export function docBounds(doc: InkDocument): Bounds | null {
  if (doc.strokes.length === 0 && (!doc.latexBlocks || doc.latexBlocks.length === 0)) return null;
  let b: Bounds | null = null;
  for (const s of doc.strokes) {
    if (s.points.length < 3) continue;
    const sb = strokeBounds(s);
    b = b
      ? {
          minX: Math.min(b.minX, sb.minX),
          minY: Math.min(b.minY, sb.minY),
          maxX: Math.max(b.maxX, sb.maxX),
          maxY: Math.max(b.maxY, sb.maxY),
        }
      : sb;
  }
  if (doc.latexBlocks && doc.latexBlocks.length > 0) {
    for (const lb of doc.latexBlocks) {
      const padW = 200;
      const padH = 80;
      const blockBounds: Bounds = {
        minX: lb.x,
        minY: lb.y,
        maxX: lb.x + padW,
        maxY: lb.y + padH,
      };
      b = b
        ? {
            minX: Math.min(b.minX, blockBounds.minX),
            minY: Math.min(b.minY, blockBounds.minY),
            maxX: Math.max(b.maxX, blockBounds.maxX),
            maxY: Math.max(b.maxY, blockBounds.maxY),
          }
        : blockBounds;
    }
  }
  return b;
}

export function boundsIntersect(a: Bounds, b: Bounds): boolean {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

/** Ramer-Douglas-Peucker itératif. `stride` = 2 (xy) ou 3 (xyp). Retourne les indices conservés. */
function rdpKeep(arr: number[], stride: number, eps: number): Uint8Array {
  const n = Math.floor(arr.length / stride);
  const keep = new Uint8Array(n);
  if (n === 0) return keep;
  keep[0] = 1;
  keep[n - 1] = 1;
  const stack: [number, number][] = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = distPointToSegment(
        arr[i * stride], arr[i * stride + 1],
        arr[a * stride], arr[a * stride + 1],
        arr[b * stride], arr[b * stride + 1]
      );
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx > 0 && maxD > eps) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return keep;
}

/** Simplifie un tracé [x,y,p,...] en conservant les variations de pression. */
export function simplifyStroke(points: number[], eps = 0.4): number[] {
  const n = points.length / 3;
  if (n <= 2) return points.slice();
  const keep = rdpKeep(points, 3, eps);
  let lastP = points[2];
  for (let i = 1; i < n; i++) {
    const p = points[i * 3 + 2];
    if (keep[i]) lastP = p;
    else if (Math.abs(p - lastP) > 0.12) {
      keep[i] = 1;
      lastP = p;
    }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (keep[i]) out.push(points[i * 3], points[i * 3 + 1], Math.round(points[i * 3 + 2] * 100) / 100);
  }
  return out;
}

/** Insère des points intermédiaires pour que l'espacement ≤ maxStep. */
export function densify(points: number[], maxStep: number): number[] {
  const n = points.length / 3;
  if (n < 2) return points.slice();
  const out: number[] = [points[0], points[1], points[2]];
  for (let i = 1; i < n; i++) {
    const x0 = points[(i - 1) * 3], y0 = points[(i - 1) * 3 + 1], p0 = points[(i - 1) * 3 + 2];
    const x1 = points[i * 3], y1 = points[i * 3 + 1], p1 = points[i * 3 + 2];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const k = Math.ceil(d / maxStep);
    for (let j = 1; j <= k; j++) {
      const t = j / k;
      out.push(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, p0 + (p1 - p0) * t);
    }
  }
  return out;
}

function densifyXY(xy: number[], maxStep: number, pressure = 0.6): number[] {
  const p3: number[] = [];
  for (let i = 0; i < xy.length; i += 2) p3.push(xy[i], xy[i + 1], pressure);
  return densify(p3, maxStep);
}

function resampleXY(xy: number[], count: number): number[] {
  const n = xy.length / 2;
  if (n < 2) return xy.slice();
  const cum: number[] = [0];
  for (let i = 1; i < n; i++) {
    cum.push(cum[i - 1] + Math.hypot(xy[i * 2] - xy[(i - 1) * 2], xy[i * 2 + 1] - xy[(i - 1) * 2 + 1]));
  }
  const total = cum[n - 1];
  const out: number[] = [];
  let seg = 1;
  for (let k = 0; k < count; k++) {
    const target = (total * k) / (count - 1);
    while (seg < n - 1 && cum[seg] < target) seg++;
    const segLen = cum[seg] - cum[seg - 1] || 1;
    const t = (target - cum[seg - 1]) / segLen;
    out.push(
      xy[(seg - 1) * 2] + (xy[seg * 2] - xy[(seg - 1) * 2]) * t,
      xy[(seg - 1) * 2 + 1] + (xy[seg * 2 + 1] - xy[(seg - 1) * 2 + 1]) * t
    );
  }
  return out;
}

// -------------------------------------------------------------------
// Gomme
// -------------------------------------------------------------------
function eraseReach(s: InkStroke, r: number): number {
  return r + s.width * 0.35;
}

export function strokeHitsCircle(s: InkStroke, cx: number, cy: number, r: number): boolean {
  const reach = eraseReach(s, r);
  const b = strokeBounds(s);
  if (cx < b.minX - reach || cx > b.maxX + reach || cy < b.minY - reach || cy > b.maxY + reach) return false;
  const n = s.points.length / 3;
  if (n === 1) return Math.hypot(s.points[0] - cx, s.points[1] - cy) <= reach;
  for (let i = 1; i < n; i++) {
    const d = distPointToSegment(
      cx, cy,
      s.points[(i - 1) * 3], s.points[(i - 1) * 3 + 1],
      s.points[i * 3], s.points[i * 3 + 1]
    );
    if (d <= reach) return true;
  }
  return false;
}

/** Gomme par pixel : renvoie les morceaux restants, ou null si le tracé n'est pas touché. */
export function splitStrokeByCircle(s: InkStroke, cx: number, cy: number, r: number): InkStroke[] | null {
  if (!strokeHitsCircle(s, cx, cy, r)) return null;
  const reach = eraseReach(s, r);
  const dense = densify(s.points, Math.max(0.8, reach * 0.5));
  const pieces: InkStroke[] = [];
  let run: number[] = [];
  const flush = () => {
    if (run.length >= 3) {
      let pts = run;
      if (pts.length === 3) pts = [pts[0], pts[1], pts[2], pts[0], pts[1], pts[2]];
      pieces.push({ ...s, id: uid(), points: simplifyStroke(pts, 0.35) });
    }
    run = [];
  };
  for (let i = 0; i < dense.length; i += 3) {
    const inside = Math.hypot(dense[i] - cx, dense[i + 1] - cy) <= reach;
    if (inside) flush();
    else run.push(dense[i], dense[i + 1], dense[i + 2]);
  }
  flush();
  return pieces;
}

// -------------------------------------------------------------------
// Rendu des tracés
// -------------------------------------------------------------------
function traceSmooth(p: PathLike, xy: number[], moveFirst: boolean) {
  const n = xy.length / 2;
  if (n === 0) return;
  if (moveFirst) p.moveTo(xy[0], xy[1]);
  else p.lineTo(xy[0], xy[1]);
  if (n === 1) return;
  if (n === 2) {
    p.lineTo(xy[2], xy[3]);
    return;
  }
  for (let i = 1; i < n - 1; i++) {
    const mx = (xy[i * 2] + xy[i * 2 + 2]) / 2;
    const my = (xy[i * 2 + 1] + xy[i * 2 + 3]) / 2;
    p.quadraticCurveTo(xy[i * 2], xy[i * 2 + 1], mx, my);
  }
  p.lineTo(xy[n * 2 - 2], xy[n * 2 - 1]);
}

function toXY(points: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < points.length; i += 3) out.push(points[i], points[i + 1]);
  return out;
}

function reversePairs(xy: number[]): number[] {
  const out: number[] = [];
  for (let i = xy.length - 2; i >= 0; i -= 2) out.push(xy[i], xy[i + 1]);
  return out;
}

interface FountainGeometry {
  left: number[];
  right: number[];
  caps: [number, number, number][];
}

function fountainGeometry(s: InkStroke): FountainGeometry {
  const n = s.points.length / 3;
  let w: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = Math.max(0, Math.min(1, s.points[i * 3 + 2]));
    w.push(s.width * (0.3 + 1.2 * p));
  }
  // lissage de la largeur (2 passes)
  for (let pass = 0; pass < 2; pass++) {
    const w2 = w.slice();
    for (let i = 1; i < n - 1; i++) w2[i] = (w[i - 1] + 2 * w[i] + w[i + 1]) / 4;
    w = w2;
  }
  const left: number[] = [];
  const right: number[] = [];
  let nx = 0, ny = 1;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(n - 1, i + 1);
    const tx = s.points[b * 3] - s.points[a * 3];
    const ty = s.points[b * 3 + 1] - s.points[a * 3 + 1];
    const l = Math.hypot(tx, ty);
    if (l > 1e-6) {
      nx = -ty / l;
      ny = tx / l;
    }
    const x = s.points[i * 3], y = s.points[i * 3 + 1];
    left.push(x + (nx * w[i]) / 2, y + (ny * w[i]) / 2);
    right.push(x - (nx * w[i]) / 2, y - (ny * w[i]) / 2);
  }
  const caps: [number, number, number][] = [
    [s.points[0], s.points[1], w[0] / 2],
    [s.points[(n - 1) * 3], s.points[(n - 1) * 3 + 1], w[n - 1] / 2],
  ];
  return { left, right, caps };
}

function tracePolygon(p: PathLike, g: FountainGeometry) {
  traceSmooth(p, g.left, true);
  traceSmooth(p, reversePairs(g.right), false);
  p.closePath();
}

export function drawStroke(ctx: CanvasRenderingContext2D, s: InkStroke) {
  const n = s.points.length / 3;
  if (n < 1) return;
  ctx.save();
  if (s.tool === 'fountain') {
    const g = fountainGeometry(s);
    ctx.fillStyle = s.color;
    if (n > 1) {
      ctx.beginPath();
      tracePolygon(ctx, g);
      ctx.fill();
    }
    for (const [cx, cy, r] of g.caps) {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    if (s.tool === 'highlighter') ctx.globalAlpha = HIGHLIGHT_ALPHA;
    if (n === 1) {
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.points[0], s.points[1], s.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      traceSmooth(ctx, toXY(s.points), true);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Dessine le fond dans l'espace monde (le contexte porte déjà la transformation de vue). */
export function drawBackgroundWorld(
  ctx: CanvasRenderingContext2D, bg: InkBackground, r: Bounds, pxScale: number, paper: InkPaperColor = 'dark'
) {
  const p = PAPER_COLORS[paper] || PAPER_COLORS.dark;
  ctx.fillStyle = p.bg;
  ctx.fillRect(r.minX, r.minY, r.maxX - r.minX, r.maxY - r.minY);
  if (bg === 'dark') return;
  let step = GRID;
  const minPx = bg === 'dots' ? 14 : 12;
  while (step * pxScale < minPx) step *= 2;
  const x0 = Math.floor(r.minX / step) * step;
  const y0 = Math.floor(r.minY / step) * step;
  if (bg === 'lined') {
    ctx.fillStyle = p.line;
    const t = 1 / pxScale;
    for (let y = y0; y <= r.maxY; y += step) ctx.fillRect(r.minX, y, r.maxX - r.minX, t);
  } else {
    ctx.fillStyle = p.dot;
    const d = 2.4 / Math.sqrt(pxScale);
    for (let y = y0; y <= r.maxY; y += step) {
      for (let x = x0; x <= r.maxX; x += step) ctx.fillRect(x + 1.5 - d / 2, y + 1.5 - d / 2, d, d);
    }
  }
}

// -------------------------------------------------------------------
// Export PNG / SVG
// -------------------------------------------------------------------
function exportBounds(doc: InkDocument): Bounds {
  const b = docBounds(doc) ?? { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  const pad = 32;
  let out = { minX: b.minX - pad, minY: b.minY - pad, maxX: b.maxX + pad, maxY: b.maxY + pad };
  const w = out.maxX - out.minX;
  const h = out.maxY - out.minY;
  if (w < 320) {
    const e = (320 - w) / 2;
    out = { ...out, minX: out.minX - e, maxX: out.maxX + e };
  }
  if (h < 240) {
    const e = (240 - h) / 2;
    out = { ...out, minY: out.minY - e, maxY: out.maxY + e };
  }
  return out;
}

export function renderInkToBlob(doc: InkDocument): Promise<Blob | null> {
  const b = exportBounds(doc);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const scale = Math.min(2, 4096 / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(w * scale));
  canvas.height = Math.max(1, Math.ceil(h * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  ctx.scale(scale, scale);
  ctx.translate(-b.minX, -b.minY);
  drawBackgroundWorld(ctx, doc.background, b, 1, doc.paperColor || 'dark');
  for (const s of doc.strokes) drawStroke(ctx, s);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

class SvgPath implements PathLike {
  d = '';
  private f(n: number) {
    return (Math.round(n * 100) / 100).toString();
  }
  moveTo(x: number, y: number) {
    this.d += `M${this.f(x)} ${this.f(y)}`;
  }
  lineTo(x: number, y: number) {
    this.d += `L${this.f(x)} ${this.f(y)}`;
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    this.d += `Q${this.f(cx)} ${this.f(cy)} ${this.f(x)} ${this.f(y)}`;
  }
  closePath() {
    this.d += 'Z';
  }
}

const f2 = (n: number) => (Math.round(n * 100) / 100).toString();

export function inkToSvg(doc: InkDocument): string {
  const b = exportBounds(doc);
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const paper = doc.paperColor || 'dark';
  const p = PAPER_COLORS[paper] || PAPER_COLORS.dark;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f2(b.minX)} ${f2(b.minY)} ${f2(w)} ${f2(h)}" width="${Math.round(w)}" height="${Math.round(h)}">`
  );
  parts.push(
    `<defs>` +
      `<pattern id="lined" width="${GRID}" height="${GRID}" patternUnits="userSpaceOnUse"><rect width="${GRID}" height="1" fill="${p.line}"/></pattern>` +
      `<pattern id="dots" width="${GRID}" height="${GRID}" patternUnits="userSpaceOnUse"><rect x="0.3" y="0.3" width="2.4" height="2.4" fill="${p.dot}"/></pattern>` +
      `</defs>`
  );
  parts.push(`<rect x="${f2(b.minX)}" y="${f2(b.minY)}" width="${f2(w)}" height="${f2(h)}" fill="${p.bg}"/>`);
  if (doc.background !== 'dark') {
    parts.push(
      `<rect x="${f2(b.minX)}" y="${f2(b.minY)}" width="${f2(w)}" height="${f2(h)}" fill="url(#${doc.background})"/>`
    );
  }
  for (const s of doc.strokes) {
    const n = s.points.length / 3;
    if (n < 1) continue;
    const color = safeColor(s.color);
    if (s.tool === 'fountain') {
      const g = fountainGeometry(s);
      if (n > 1) {
        const sp = new SvgPath();
        tracePolygon(sp, g);
        parts.push(`<path d="${sp.d}" fill="${color}"/>`);
      }
      for (const [cx, cy, r] of g.caps) {
        parts.push(`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(Math.max(0.1, r))}" fill="${color}"/>`);
      }
    } else {
      const op = s.tool === 'highlighter' ? ` opacity="${HIGHLIGHT_ALPHA}"` : '';
      if (n === 1) {
        parts.push(
          `<circle cx="${f2(s.points[0])}" cy="${f2(s.points[1])}" r="${f2(s.width / 2)}" fill="${color}"${op}/>`
        );
      } else {
        const sp = new SvgPath();
        traceSmooth(sp, toXY(s.points), true);
        parts.push(
          `<path d="${sp.d}" fill="none" stroke="${color}" stroke-width="${f2(s.width)}" stroke-linecap="round" stroke-linejoin="round"${op}/>`
        );
      }
    }
  }

  // Blocs LaTeX dactylographiés intégrés
  if (doc.latexBlocks && doc.latexBlocks.length > 0) {
    for (const lb of doc.latexBlocks) {
      try {
        const html = katex.renderToString(lb.latex, {
          displayMode: lb.displayMode ?? true,
          throwOnError: false,
        });
        const fs = lb.fontSize || 20;
        const color = lb.color || (paper === 'white' || paper === 'sepia' ? '#18181b' : '#ffffff');
        parts.push(
          `<g transform="translate(${f2(lb.x)}, ${f2(lb.y)})">` +
            `<foreignObject width="600" height="400">` +
            `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${fs}px;color:${color};font-family:KaTeX_Main, serif;">${html}</div>` +
            `</foreignObject></g>`
        );
      } catch {
        // ignore
      }
    }
  }

  parts.push('</svg>');
  return parts.join('');
}

// -------------------------------------------------------------------
// Reconnaissance de formes (ligne, rectangle, cercle/ellipse, flèche)
// -------------------------------------------------------------------
export function recognizeShape(s: InkStroke, scale = 1): InkStroke | null {
  const n = s.points.length / 3;
  if (n < 6) return null;
  const xy = toXY(s.points);

  let pathLen = 0;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    const x = xy[i * 2], y = xy[i * 2 + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (i > 0) pathLen += Math.hypot(x - xy[(i - 1) * 2], y - xy[(i - 1) * 2 + 1]);
  }
  if (pathLen < 60 / scale) return null;

  const w = maxX - minX;
  const h = maxY - minY;
  const gap = Math.hypot(xy[n * 2 - 2] - xy[0], xy[n * 2 - 1] - xy[1]);
  const mk = (pts: number[]): InkStroke => ({ ...s, id: uid(), points: densifyXY(pts, 8, 0.6) });

  // ---------- Formes fermées ----------
  if (gap < 0.2 * pathLen) {
    if (Math.min(w, h) < 0.12 * Math.max(w, h)) return null;
    const rs = resampleXY(xy, 64);
    const m = rs.length / 2;

    // Rectangularité : distance moyenne au périmètre de la boîte + ratio d'aire
    let sumD = 0;
    for (let i = 0; i < m; i++) {
      const x = rs[i * 2], y = rs[i * 2 + 1];
      sumD += Math.max(0, Math.min(x - minX, maxX - x, y - minY, maxY - y));
    }
    const rectScore = sumD / m / ((w + h) / 2);
    let area = 0;
    for (let i = 0; i < m; i++) {
      const j = (i + 1) % m;
      area += rs[i * 2] * rs[j * 2 + 1] - rs[j * 2] * rs[i * 2 + 1];
    }
    const areaRatio = Math.abs(area / 2) / (w * h);

    // Ellipticité : écart-type du rayon normalisé
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const a = w / 2, b = h / 2;
    const rads: number[] = [];
    for (let i = 0; i < m; i++) rads.push(Math.hypot((rs[i * 2] - cx) / a, (rs[i * 2 + 1] - cy) / b));
    const mean = rads.reduce((p, c) => p + c, 0) / m;
    const std = Math.sqrt(rads.reduce((p, c) => p + (c - mean) * (c - mean), 0) / m);
    const ellScore = std / mean;

    if (areaRatio > 0.87 && rectScore < 0.06) {
      return mk([minX, minY, maxX, minY, maxX, maxY, minX, maxY, minX, minY]);
    }
    if (ellScore < 0.12 && areaRatio < 0.9) {
      const aspect = Math.max(w, h) / Math.min(w, h);
      const ra = aspect < 1.18 ? (w + h) / 4 : a;
      const rb = aspect < 1.18 ? (w + h) / 4 : b;
      const pts: number[] = [];
      for (let i = 0; i <= 72; i++) {
        const t = (Math.PI * 2 * i) / 72;
        pts.push(cx + ra * Math.cos(t), cy + rb * Math.sin(t));
      }
      return mk(pts);
    }
    return null;
  }

  // ---------- Formes ouvertes : ligne / flèche ----------
  const keep = rdpKeep(xy, 2, 0.06 * pathLen);
  const v: [number, number][] = [];
  for (let i = 0; i < n; i++) if (keep[i]) v.push([xy[i * 2], xy[i * 2 + 1]]);

  if (v.length === 2) {
    let [x0, y0] = v[0];
    let [x1, y1] = v[1];
    const ang = (Math.atan2(Math.abs(y1 - y0), Math.abs(x1 - x0)) * 180) / Math.PI;
    if (ang < 6) {
      const my = (y0 + y1) / 2;
      y0 = my;
      y1 = my;
    } else if (ang > 84) {
      const mx = (x0 + x1) / 2;
      x0 = mx;
      x1 = mx;
    }
    return mk([x0, y0, x1, y1]);
  }

  if (v.length >= 3 && v.length <= 6) {
    const lens: number[] = [];
    for (let i = 0; i < v.length - 1; i++) lens.push(Math.hypot(v[i + 1][0] - v[i][0], v[i + 1][1] - v[i][1]));
    let li = 0;
    for (let i = 1; i < lens.length; i++) if (lens[i] > lens[li]) li = i;
    const L = lens[li];
    if (L < 0.5 * pathLen) return null;

    let tip: [number, number];
    let tail: [number, number];
    let others: [number, number][];
    if (li === 0) {
      tail = v[0];
      tip = v[1];
      others = v.slice(2);
    } else if (li === v.length - 2) {
      tip = v[li];
      tail = v[li + 1];
      others = v.slice(0, li);
    } else {
      return null;
    }
    if (!others.every((o) => Math.hypot(o[0] - tip[0], o[1] - tip[1]) <= 0.5 * L)) return null;

    const back = Math.atan2(tail[1] - tip[1], tail[0] - tip[0]);
    const barb = Math.max(14, Math.min(64, 0.28 * L));
    const da = (28 * Math.PI) / 180;
    const b1: [number, number] = [tip[0] + barb * Math.cos(back + da), tip[1] + barb * Math.sin(back + da)];
    const b2: [number, number] = [tip[0] + barb * Math.cos(back - da), tip[1] + barb * Math.sin(back - da)];
    return mk([tail[0], tail[1], tip[0], tip[1], b1[0], b1[1], tip[0], tip[1], b2[0], b2[1]]);
  }

  return null;
}
