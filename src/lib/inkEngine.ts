// ===================================================================
// Syntropy Stylus — moteur de dessin vectoriel (PointerEvents)
// - Rejet de la paume, pinch-to-zoom / pan, surface illimitée
// - Stylos (bille, plume, surligneur), gommes, lasso, formes
// ===================================================================
import type {
  InkBackground,
  InkDocument,
  InkEraserMode,
  InkPaperColor,
  InkPenTool,
  InkStroke,
  InkLatexBlock,
  InkTool,
  InkWidthPreset,
} from '@/types';
import {
  Bounds,
  boundsIntersect,
  drawBackgroundWorld,
  drawStroke,
  inkToSvg,
  pointInPolygon,
  recognizeShape,
  renderInkToBlob,
  simplifyStroke,
  splitStrokeByCircle,
  strokeBounds,
  strokeHitsCircle,
  uid,
} from '@/lib/ink';

export interface InkSettings {
  tool: InkTool;
  eraserMode: InkEraserMode;
  color: string;
  widthPreset: InkWidthPreset;
  shapeAssist: boolean;
  fingerDraws: boolean;
}

export interface InkUiState {
  canUndo: boolean;
  canRedo: boolean;
  scale: number;
  hasSelection: boolean;
  hasStrokes: boolean;
  view: { x: number; y: number; scale: number };
}

interface InkEngineOptions {
  doc: InkDocument;
  settings: InkSettings;
  onChange: (doc: InkDocument) => void;
  onUiChange: (ui: InkUiState) => void;
}

export const PEN_WIDTHS: Record<InkPenTool, Record<InkWidthPreset, number>> = {
  pen: { thin: 2, medium: 3.5, thick: 7 },
  fountain: { thin: 3, medium: 5.5, thick: 10 },
  highlighter: { thin: 12, medium: 20, thick: 34 },
};
const ERASER_PX: Record<InkWidthPreset, number> = { thin: 8, medium: 16, thick: 30 };
const MIN_SCALE = 0.2;
const MAX_SCALE = 6;
const HISTORY_MAX = 60;

type Gesture = 'none' | 'draw' | 'erase' | 'lassoSelect' | 'lassoMove' | 'lassoScale' | 'pan' | 'pinch';

interface Live {
  tool: InkPenTool;
  points: number[];
  lastT: number;
  lastX: number;
  lastY: number;
  p: number;
}

interface Transform {
  dx: number;
  dy: number;
  k: number;
  ox: number;
  oy: number;
}
const IDENTITY: Transform = { dx: 0, dy: 0, k: 1, ox: 0, oy: 0 };

function transformStroke(s: InkStroke, t: Transform): InkStroke {
  const pts = s.points.slice();
  for (let i = 0; i < pts.length; i += 3) {
    pts[i] = t.ox + (pts[i] - t.ox) * t.k + t.dx;
    pts[i + 1] = t.oy + (pts[i + 1] - t.oy) * t.k + t.dy;
  }
  return { ...s, points: pts, width: Math.max(0.5, Math.min(200, s.width * t.k)) };
}

function transformBounds(b: Bounds, t: Transform): Bounds {
  const x0 = t.ox + (b.minX - t.ox) * t.k + t.dx;
  const x1 = t.ox + (b.maxX - t.ox) * t.k + t.dx;
  const y0 = t.oy + (b.minY - t.oy) * t.k + t.dy;
  const y1 = t.oy + (b.maxY - t.oy) * t.k + t.dy;
  return { minX: Math.min(x0, x1), maxX: Math.max(x0, x1), minY: Math.min(y0, y1), maxY: Math.max(y0, y1) };
}

export class InkEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cache: HTMLCanvasElement;
  private cctx: CanvasRenderingContext2D;
  private cssW = 0;
  private cssH = 0;
  private dpr = 1;

  private strokes: InkStroke[];
  private latexBlocks: InkLatexBlock[] = [];
  private background: InkBackground;
  private paperColor: InkPaperColor = 'dark';
  private view = { x: 0, y: 0, scale: 1 };
  private undoStack: InkStroke[][] = [];
  private redoStack: InkStroke[][] = [];
  private settings: InkSettings;
  private onChange: (doc: InkDocument) => void;
  private onUiChange: (ui: InkUiState) => void;

  private cacheDirty = true;
  private raf = 0;
  private destroyed = false;
  private needsFit = false;
  private boundsCache = new WeakMap<InkStroke, Bounds>();
  private lastUi = '';

  private touches = new Map<number, { x: number; y: number }>();
  private ignored = new Set<number>();
  private gesture: Gesture = 'none';
  private activeId = -1;
  private lastPenTime = 0;
  private penDown = false;
  private spacePan = false;
  private panLast = { x: 0, y: 0 };
  private pinch: { d0: number; mid0: { x: number; y: number }; view0: { x: number; y: number; scale: number } } | null = null;

  private live: Live | null = null;
  private liveStyle: { color: string; width: number } = { color: '#fff', width: 3 };
  private eraseStart: InkStroke[] | null = null;
  private eraseTool: InkEraserMode = 'stroke';
  private lastErase: { x: number; y: number } | null = null;
  private hover: { x: number; y: number } | null = null;

  private lassoPoly: number[] = [];
  private selection: Set<string> | null = null;
  private selBox: Bounds | null = null;
  private tf: Transform = IDENTITY;
  private dragStart = { x: 0, y: 0 };
  private scaleAnchor = { x: 0, y: 0 };
  private scaleStartDist = 1;

  constructor(canvas: HTMLCanvasElement, opts: InkEngineOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.cache = document.createElement('canvas');
    this.cctx = this.cache.getContext('2d')!;
    this.strokes = opts.doc.strokes;
    this.latexBlocks = opts.doc.latexBlocks ? [...opts.doc.latexBlocks] : [];
    this.background = opts.doc.background;
    this.paperColor = opts.doc.paperColor || 'dark';
    this.settings = opts.settings;
    this.onChange = opts.onChange;
    this.onUiChange = opts.onUiChange;
    this.needsFit = this.strokes.length > 0;

    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    canvas.addEventListener('contextmenu', this.onContextMenu);
    canvas.addEventListener('keydown', this.onKeyDown);
    canvas.addEventListener('keyup', this.onKeyUp);
    this.updateCursor();
  }

  // ------------------------------------------------------------------
  // API publique
  // ------------------------------------------------------------------
  destroy() {
    this.destroyed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    const c = this.canvas;
    c.removeEventListener('pointerdown', this.onPointerDown);
    c.removeEventListener('pointermove', this.onPointerMove);
    c.removeEventListener('pointerup', this.onPointerUp);
    c.removeEventListener('pointercancel', this.onPointerCancel);
    c.removeEventListener('pointerleave', this.onPointerLeave);
    c.removeEventListener('wheel', this.onWheel);
    c.removeEventListener('contextmenu', this.onContextMenu);
    c.removeEventListener('keydown', this.onKeyDown);
    c.removeEventListener('keyup', this.onKeyUp);
  }

  setSettings(s: InkSettings) {
    const prev = this.settings;
    this.settings = s;
    if (prev.tool !== s.tool && prev.tool === 'lasso') this.clearSelection();
    this.updateCursor();
    this.requestRender();
  }

  setBackground(bg: InkBackground) {
    this.background = bg;
    this.cacheDirty = true;
    this.requestRender();
    this.onChange(this.getDocument());
  }

  setPaperColor(paper: InkPaperColor) {
    this.paperColor = paper;
    this.cacheDirty = true;
    this.requestRender();
    this.onChange(this.getDocument());
  }

  setDocument(doc: InkDocument) {
    this.strokes = doc.strokes;
    this.latexBlocks = doc.latexBlocks ? [...doc.latexBlocks] : [];
    this.background = doc.background;
    this.paperColor = doc.paperColor || 'dark';
    this.undoStack = [];
    this.redoStack = [];
    this.clearSelection(false);
    this.cacheDirty = true;
    this.needsFit = doc.strokes.length > 0;
    if (this.cssW > 0) this.applyPendingFit();
    this.emitUi();
    this.requestRender();
  }

  getDocument(): InkDocument {
    return {
      version: 1,
      background: this.background,
      paperColor: this.paperColor,
      strokes: this.strokes,
      latexBlocks: this.latexBlocks,
    };
  }

  resize(cssW: number, cssH: number, dpr: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    const pw = Math.max(1, Math.round(cssW * dpr));
    const ph = Math.max(1, Math.round(cssH * dpr));
    this.canvas.width = pw;
    this.canvas.height = ph;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.cache.width = pw;
    this.cache.height = ph;
    this.cacheDirty = true;
    if (cssW > 0 && cssH > 0) this.applyPendingFit();
    this.emitUi();
    this.requestRender();
  }

  undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(this.strokes);
    this.strokes = prev;
    this.afterHistoryChange();
  }

  redo() {
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(this.strokes);
    this.strokes = next;
    this.afterHistoryChange();
  }

  clear() {
    if (this.strokes.length === 0) return;
    this.commit([]);
    this.clearSelection(false);
  }

  deleteSelection() {
    if (!this.selection) return;
    const sel = this.selection;
    this.clearSelection(false);
    this.commit(this.strokes.filter((s) => !sel.has(s.id)));
  }

  zoomBy(factor: number) {
    this.zoomAt(this.cssW / 2, this.cssH / 2, factor);
  }

  resetView() {
    this.fitContent();
  }

  async exportPng(): Promise<Blob | null> {
    return renderInkToBlob(this.getDocument());
  }

  exportSvg(): string {
    return inkToSvg(this.getDocument());
  }

  focus() {
    this.canvas.focus({ preventScroll: true });
  }

  getView() {
    return { ...this.view };
  }

  clientToWorld(clientX: number, clientY: number) {
    const p = this.pos({ clientX, clientY });
    return this.toWorld(p);
  }

  worldToScreen(worldX: number, worldY: number) {
    return {
      x: worldX * this.view.scale + this.view.x,
      y: worldY * this.view.scale + this.view.y,
    };
  }

  getCenterWorld() {
    return this.toWorld({ x: this.cssW / 2, y: this.cssH / 2 });
  }

  setLatexBlocks(blocks: InkLatexBlock[]) {
    this.latexBlocks = blocks;
    this.onChange(this.getDocument());
  }

  getLatexBlocks(): InkLatexBlock[] {
    return this.latexBlocks;
  }

  // ------------------------------------------------------------------
  // État / historique
  // ------------------------------------------------------------------
  private commit(next: InkStroke[], prevOverride?: InkStroke[]) {
    this.undoStack.push(prevOverride ?? this.strokes);
    if (this.undoStack.length > HISTORY_MAX) this.undoStack.shift();
    this.redoStack = [];
    this.strokes = next;
    this.cacheDirty = true;
    this.emitUi();
    this.requestRender();
    this.onChange(this.getDocument());
  }

  private afterHistoryChange() {
    this.clearSelection(false);
    this.cacheDirty = true;
    this.emitUi();
    this.requestRender();
    this.onChange(this.getDocument());
  }

  private clearSelection(render = true) {
    this.selection = null;
    this.selBox = null;
    this.tf = IDENTITY;
    this.cacheDirty = true;
    if (render) {
      this.emitUi();
      this.requestRender();
    }
  }

  private emitUi() {
    const ui: InkUiState = {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      scale: Math.round(this.view.scale * 100) / 100,
      hasSelection: !!this.selection,
      hasStrokes: this.strokes.length > 0,
      view: { ...this.view },
    };
    const key = JSON.stringify(ui);
    if (key === this.lastUi) return;
    this.lastUi = key;
    this.onUiChange(ui);
  }

  // ------------------------------------------------------------------
  // Vue
  // ------------------------------------------------------------------
  private applyPendingFit() {
    if (!this.needsFit) return;
    this.needsFit = false;
    this.fitContent(1);
  }

  private fitContent(maxScale = 1.5) {
    if (this.strokes.length === 0 || this.cssW === 0) {
      this.view = { x: 0, y: 0, scale: 1 };
    } else {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const s of this.strokes) {
        const b = this.boundsOf(s);
        minX = Math.min(minX, b.minX);
        minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX);
        maxY = Math.max(maxY, b.maxY);
      }
      const pad = 48;
      const w = Math.max(1, maxX - minX + pad * 2);
      const h = Math.max(1, maxY - minY + pad * 2);
      const scale = Math.max(MIN_SCALE, Math.min(maxScale, this.cssW / w, this.cssH / h));
      this.view = {
        scale,
        x: (this.cssW - (maxX - minX) * scale) / 2 - minX * scale,
        y: (this.cssH - (maxY - minY) * scale) / 2 - minY * scale,
      };
    }
    this.cacheDirty = true;
    this.emitUi();
    this.requestRender();
  }

  private zoomAt(sx: number, sy: number, factor: number) {
    const v = this.view;
    const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
    const wx = (sx - v.x) / v.scale;
    const wy = (sy - v.y) / v.scale;
    this.view = { scale: ns, x: sx - wx * ns, y: sy - wy * ns };
    this.cacheDirty = true;
    this.emitUi();
    this.requestRender();
  }

  private boundsOf(s: InkStroke): Bounds {
    let b = this.boundsCache.get(s);
    if (!b) {
      b = strokeBounds(s);
      this.boundsCache.set(s, b);
    }
    return b;
  }

  private pos(e: { clientX: number; clientY: number }) {
    const r = this.canvas.getBoundingClientRect();
    const sx = r.width > 0 ? this.cssW / r.width : 1;
    const sy = r.height > 0 ? this.cssH / r.height : 1;
    return {
      x: (e.clientX - r.left) * sx,
      y: (e.clientY - r.top) * sy,
    };
  }

  private toWorld(p: { x: number; y: number }) {
    return { x: (p.x - this.view.x) / this.view.scale, y: (p.y - this.view.y) / this.view.scale };
  }

  private toScreen(x: number, y: number) {
    return { x: x * this.view.scale + this.view.x, y: y * this.view.scale + this.view.y };
  }

  private updateCursor() {
    let c = 'crosshair';
    if (this.gesture === 'pan' || this.spacePan) c = this.gesture === 'pan' ? 'grabbing' : 'grab';
    else if (this.settings.tool === 'eraser') c = 'none';
    else if (this.settings.tool === 'lasso') c = 'default';
    this.canvas.style.cursor = c;
  }

  // ------------------------------------------------------------------
  // Événements
  // ------------------------------------------------------------------
  private onContextMenu = (e: Event) => e.preventDefault();

  private onKeyDown = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.redo();
      else this.undo();
    } else if (mod && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.redo();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selection) {
        e.preventDefault();
        this.deleteSelection();
      }
    } else if (e.key === 'Escape') {
      if (this.selection) this.clearSelection();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (!this.spacePan) {
        this.spacePan = true;
        this.updateCursor();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') {
      this.spacePan = false;
      this.updateCursor();
    }
  };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const p = this.pos(e);
    if (e.ctrlKey || e.metaKey) {
      this.zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    } else {
      this.view = { ...this.view, x: this.view.x - e.deltaX, y: this.view.y - e.deltaY };
      this.cacheDirty = true;
      this.requestRender();
    }
  };

  private onPointerLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'touch' && this.gesture === 'none') {
      this.hover = null;
      this.requestRender();
    }
  };

  private onPointerDown = (e: PointerEvent) => {
    this.focus();
    const p = this.pos(e);

    if (e.pointerType === 'touch') {
      const penRecent = this.penDown || performance.now() - this.lastPenTime < 700;
      if (penRecent || e.width > 40 || e.height > 40) {
        this.ignored.add(e.pointerId); // paume
        return;
      }
      this.touches.set(e.pointerId, p);
      this.capture(e);
      if (this.touches.size === 2) {
        this.live = null;
        this.endLassoGestureSilently();
        const [a, b] = Array.from(this.touches.values());
        this.pinch = {
          d0: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
          mid0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
          view0: { ...this.view },
        };
        this.gesture = 'pinch';
        this.updateCursor();
      } else if (this.touches.size === 1) {
        if (this.settings.fingerDraws) {
          this.startAction(e, p);
        } else {
          this.gesture = 'pan';
          this.activeId = e.pointerId;
          this.panLast = p;
          this.updateCursor();
        }
      }
      return;
    }

    if (e.pointerType === 'pen') {
      this.penDown = true;
      this.lastPenTime = performance.now();
      if (this.touches.size > 0 || this.gesture === 'pan' || this.gesture === 'pinch') {
        // la paume (ou un doigt) était posée avant le stylet : on l'annule
        this.touches.clear();
        this.live = null;
        this.gesture = 'none';
      }
    }

    if (e.pointerType === 'mouse') {
      if (e.button === 2) return;
      if (e.button === 1 || this.spacePan) {
        this.capture(e);
        this.gesture = 'pan';
        this.activeId = e.pointerId;
        this.panLast = p;
        this.updateCursor();
        return;
      }
      if (e.button !== 0) return;
    }

    this.capture(e);
    this.startAction(e, p);
  };

  private capture(e: PointerEvent) {
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  private startAction(e: PointerEvent, p: { x: number; y: number }) {
    let tool: InkTool = this.settings.tool;
    if (e.pointerType === 'pen' && (e.buttons & 32) !== 0) tool = 'eraser';
    const w = this.toWorld(p);
    this.activeId = e.pointerId;

    if (tool === 'eraser') {
      this.gesture = 'erase';
      this.eraseTool = this.settings.eraserMode;
      this.eraseStart = this.strokes;
      this.lastErase = null;
      this.hover = p;
      this.eraseAlong(w.x, w.y);
      return;
    }

    if (tool === 'lasso') {
      if (this.selection && this.selBox) {
        const b = this.selBox;
        const corners: [number, number, number, number][] = [
          [b.minX, b.minY, b.maxX, b.maxY],
          [b.maxX, b.minY, b.minX, b.maxY],
          [b.maxX, b.maxY, b.minX, b.minY],
          [b.minX, b.maxY, b.maxX, b.minY],
        ];
        for (const [cx, cy, ax, ay] of corners) {
          const sc = this.toScreen(cx, cy);
          if (Math.hypot(sc.x - p.x, sc.y - p.y) < 20) {
            this.gesture = 'lassoScale';
            this.scaleAnchor = { x: ax, y: ay };
            this.scaleStartDist = Math.max(1, Math.hypot(w.x - ax, w.y - ay));
            this.dragStart = w;
            return;
          }
        }
        const pad = 6 / this.view.scale;
        if (w.x >= b.minX - pad && w.x <= b.maxX + pad && w.y >= b.minY - pad && w.y <= b.maxY + pad) {
          this.gesture = 'lassoMove';
          this.dragStart = w;
          return;
        }
        this.clearSelection();
      }
      this.gesture = 'lassoSelect';
      this.lassoPoly = [w.x, w.y];
      this.requestRender();
      return;
    }

    // Stylos
    const penTool = tool as InkPenTool;
    this.gesture = 'draw';
    this.liveStyle = {
      color: this.settings.color,
      width: PEN_WIDTHS[penTool][this.settings.widthPreset],
    };
    const base = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;
    this.live = {
      tool: penTool,
      points: [w.x, w.y, penTool === 'fountain' ? Math.min(1, base * 0.9) : 0.5],
      lastT: e.timeStamp,
      lastX: w.x,
      lastY: w.y,
      p: penTool === 'fountain' ? Math.min(1, base * 0.9) : 0.5,
    };
    this.requestRender();
  }

  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'pen') this.lastPenTime = performance.now();

    if (e.pointerType === 'touch') {
      if (this.ignored.has(e.pointerId)) return;
      const p = this.pos(e);
      if (!this.touches.has(e.pointerId)) return;
      this.touches.set(e.pointerId, p);

      if (this.gesture === 'pinch' && this.pinch && this.touches.size >= 2) {
        const [a, b] = Array.from(this.touches.values());
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const v0 = this.pinch.view0;
        const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, (v0.scale * d) / this.pinch.d0));
        const ax = (this.pinch.mid0.x - v0.x) / v0.scale;
        const ay = (this.pinch.mid0.y - v0.y) / v0.scale;
        this.view = { scale: ns, x: mid.x - ax * ns, y: mid.y - ay * ns };
        this.cacheDirty = true;
        this.emitUi();
        this.requestRender();
        return;
      }
      if (this.gesture === 'pan' && e.pointerId === this.activeId) {
        this.view = { ...this.view, x: this.view.x + (p.x - this.panLast.x), y: this.view.y + (p.y - this.panLast.y) };
        this.panLast = p;
        this.cacheDirty = true;
        this.requestRender();
        return;
      }
      if (e.pointerId === this.activeId) this.moveAction(e);
      return;
    }

    if (this.gesture === 'none') {
      // survol (souris / stylet) — curseur de la gomme
      if (this.settings.tool === 'eraser') {
        this.hover = this.pos(e);
        this.requestRender();
      }
      return;
    }
    if (e.pointerId !== this.activeId) return;
    if (this.gesture === 'pan') {
      const p = this.pos(e);
      this.view = { ...this.view, x: this.view.x + (p.x - this.panLast.x), y: this.view.y + (p.y - this.panLast.y) };
      this.panLast = p;
      this.cacheDirty = true;
      this.requestRender();
      return;
    }
    this.moveAction(e);
  };

  private moveAction(e: PointerEvent) {
    const coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    const list = coalesced.length > 0 ? coalesced : [e];

    if (this.gesture === 'draw' && this.live) {
      const live = this.live;
      for (const ev of list) {
        const w = this.toWorld(this.pos(ev));
        const dist = Math.hypot(w.x - live.lastX, w.y - live.lastY);
        if (dist * this.view.scale < 1) continue;
        let p = 0.5;
        if (live.tool === 'fountain') {
          const dt = Math.max(1, ev.timeStamp - live.lastT);
          const speed = (dist * this.view.scale) / dt; // px / ms
          const factor = 1.25 - Math.min(speed, 2.2) * 0.4;
          const base = e.pointerType === 'pen' && ev.pressure > 0 ? ev.pressure * 1.3 : 0.55;
          const target = Math.max(0.08, Math.min(1, base * factor));
          live.p = live.p * 0.6 + target * 0.4;
          p = live.p;
        }
        live.points.push(w.x, w.y, Math.round(p * 100) / 100);
        live.lastT = ev.timeStamp;
        live.lastX = w.x;
        live.lastY = w.y;
      }
      this.requestRender();
      return;
    }

    if (this.gesture === 'erase') {
      for (const ev of list) {
        const p = this.pos(ev);
        this.hover = p;
        const w = this.toWorld(p);
        this.eraseAlong(w.x, w.y);
      }
      this.requestRender();
      return;
    }

    const p = this.pos(e);
    const w = this.toWorld(p);

    if (this.gesture === 'lassoSelect') {
      const n = this.lassoPoly.length;
      const lx = this.lassoPoly[n - 2], ly = this.lassoPoly[n - 1];
      if (Math.hypot(w.x - lx, w.y - ly) * this.view.scale > 2) this.lassoPoly.push(w.x, w.y);
      this.requestRender();
    } else if (this.gesture === 'lassoMove') {
      this.tf = { dx: w.x - this.dragStart.x, dy: w.y - this.dragStart.y, k: 1, ox: 0, oy: 0 };
      this.requestRender();
    } else if (this.gesture === 'lassoScale') {
      const d = Math.hypot(w.x - this.scaleAnchor.x, w.y - this.scaleAnchor.y);
      const k = Math.max(0.1, Math.min(10, d / this.scaleStartDist));
      this.tf = { dx: 0, dy: 0, k, ox: this.scaleAnchor.x, oy: this.scaleAnchor.y };
      this.requestRender();
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'pen') {
      this.penDown = false;
      this.lastPenTime = performance.now();
    }
    if (e.pointerType === 'touch') {
      if (this.ignored.delete(e.pointerId)) return;
      this.touches.delete(e.pointerId);
      if (this.gesture === 'pinch') {
        if (this.touches.size < 2) {
          this.gesture = 'none';
          this.pinch = null;
          this.updateCursor();
        }
        return;
      }
      if (e.pointerId !== this.activeId) return;
    } else if (e.pointerId !== this.activeId) {
      return;
    }
    this.finishGesture();
  };

  private onPointerCancel = (e: PointerEvent) => {
    if (e.pointerType === 'pen') this.penDown = false;
    this.ignored.delete(e.pointerId);
    this.touches.delete(e.pointerId);
    if (e.pointerId !== this.activeId && this.gesture !== 'pinch') return;
    if (this.gesture === 'pinch') {
      if (this.touches.size < 2) {
        this.gesture = 'none';
        this.pinch = null;
      }
      return;
    }
    // annule l'action en cours
    this.live = null;
    if (this.eraseStart) {
      this.strokes = this.eraseStart;
      this.eraseStart = null;
      this.cacheDirty = true;
    }
    this.tf = IDENTITY;
    this.lassoPoly = [];
    this.gesture = 'none';
    this.updateCursor();
    this.requestRender();
  };

  private endLassoGestureSilently() {
    if (this.gesture === 'lassoMove' || this.gesture === 'lassoScale') this.tf = IDENTITY;
    if (this.gesture === 'lassoSelect') this.lassoPoly = [];
    if (this.gesture === 'erase' && this.eraseStart) {
      this.strokes = this.eraseStart;
      this.eraseStart = null;
      this.cacheDirty = true;
    }
  }

  private finishGesture() {
    const g = this.gesture;
    this.gesture = 'none';
    this.updateCursor();

    if (g === 'draw' && this.live) {
      const live = this.live;
      this.live = null;
      let pts = live.points;
      if (pts.length === 3) pts = [pts[0], pts[1], pts[2], pts[0], pts[1], pts[2]];
      let stroke: InkStroke = {
        id: uid(),
        tool: live.tool,
        color: this.liveStyle.color,
        width: this.liveStyle.width,
        points: pts,
      };
      const recognized = this.settings.shapeAssist ? recognizeShape(stroke, this.view.scale) : null;
      if (recognized) stroke = recognized;
      else stroke = { ...stroke, points: simplifyStroke(pts, 0.45 / Math.max(0.6, this.view.scale)) };
      this.commit([...this.strokes, stroke]);
    } else if (g === 'erase') {
      const start = this.eraseStart;
      this.eraseStart = null;
      this.lastErase = null;
      if (start && this.strokes !== start) {
        const cur = this.strokes;
        this.strokes = start;
        this.commit(cur);
      }
    } else if (g === 'lassoSelect') {
      const poly = this.lassoPoly;
      this.lassoPoly = [];
      if (poly.length >= 6) {
        const ids = new Set<string>();
        let box: Bounds | null = null;
        for (const s of this.strokes) {
          const n = s.points.length / 3;
          let inside = 0;
          for (let i = 0; i < n; i++) if (pointInPolygon(s.points[i * 3], s.points[i * 3 + 1], poly)) inside++;
          if (inside / n >= 0.5) {
            ids.add(s.id);
            const b = this.boundsOf(s);
            box = box
              ? {
                  minX: Math.min(box.minX, b.minX),
                  minY: Math.min(box.minY, b.minY),
                  maxX: Math.max(box.maxX, b.maxX),
                  maxY: Math.max(box.maxY, b.maxY),
                }
              : { ...b };
          }
        }
        if (ids.size > 0 && box) {
          this.selection = ids;
          this.selBox = box;
        }
      }
      this.cacheDirty = true;
      this.emitUi();
      this.requestRender();
    } else if (g === 'lassoMove' || g === 'lassoScale') {
      const t = this.tf;
      this.tf = IDENTITY;
      if (this.selection && (t.dx !== 0 || t.dy !== 0 || t.k !== 1)) {
        const sel = this.selection;
        const next = this.strokes.map((s) => (sel.has(s.id) ? transformStroke(s, t) : s));
        if (this.selBox) this.selBox = transformBounds(this.selBox, t);
        this.commit(next);
        // commit() ne touche pas à la sélection ; on garde l'enveloppe mise à jour
      } else {
        this.requestRender();
      }
    } else {
      this.requestRender();
    }
  }

  // ------------------------------------------------------------------
  // Gomme
  // ------------------------------------------------------------------
  private eraseAlong(x: number, y: number) {
    const r = ERASER_PX[this.settings.widthPreset] / this.view.scale;
    const pts: [number, number][] = [];
    if (this.lastErase) {
      const d = Math.hypot(x - this.lastErase.x, y - this.lastErase.y);
      const k = Math.max(1, Math.ceil(d / (r * 0.6)));
      for (let i = 1; i <= k; i++) {
        const t = i / k;
        pts.push([this.lastErase.x + (x - this.lastErase.x) * t, this.lastErase.y + (y - this.lastErase.y) * t]);
      }
    } else {
      pts.push([x, y]);
    }
    this.lastErase = { x, y };

    let changed = false;
    let cur = this.strokes;
    for (const [px, py] of pts) {
      if (this.eraseTool === 'stroke') {
        const next = cur.filter((s) => !strokeHitsCircle(s, px, py, r));
        if (next.length !== cur.length) {
          cur = next;
          changed = true;
        }
      } else {
        const next: InkStroke[] = [];
        let touched = false;
        for (const s of cur) {
          const pieces = splitStrokeByCircle(s, px, py, r);
          if (pieces === null) next.push(s);
          else {
            touched = true;
            next.push(...pieces);
          }
        }
        if (touched) {
          cur = next;
          changed = true;
        }
      }
    }
    if (changed) {
      this.strokes = cur;
      if (this.selection) this.clearSelection(false);
      this.cacheDirty = true;
    }
  }

  // ------------------------------------------------------------------
  // Rendu
  // ------------------------------------------------------------------
  private requestRender() {
    if (this.raf || this.destroyed) return;
    this.raf = requestAnimationFrame(() => this.render());
  }

  private rebuildCache() {
    const c = this.cctx;
    const { x, y, scale } = this.view;
    const d = this.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.cache.width, this.cache.height);
    c.setTransform(d * scale, 0, 0, d * scale, d * x, d * y);
    const m = 2 / scale;
    const vis: Bounds = {
      minX: -x / scale - m,
      minY: -y / scale - m,
      maxX: (this.cssW - x) / scale + m,
      maxY: (this.cssH - y) / scale + m,
    };
    drawBackgroundWorld(c, this.background, vis, scale, this.paperColor);
    const sel = this.selection;
    for (const s of this.strokes) {
      if (sel && sel.has(s.id)) continue;
      if (!boundsIntersect(this.boundsOf(s), vis)) continue;
      drawStroke(c, s);
    }
    this.cacheDirty = false;
  }

  private render() {
    this.raf = 0;
    if (this.destroyed || this.cssW === 0) return;
    if (this.cacheDirty) this.rebuildCache();
    const ctx = this.ctx;
    const d = this.dpr;
    const { x, y, scale } = this.view;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.cache, 0, 0);

    // Éléments vivants (espace monde)
    ctx.setTransform(d * scale, 0, 0, d * scale, d * x, d * y);
    const t = this.tf;
    const moving = t.dx !== 0 || t.dy !== 0 || t.k !== 1;
    if (this.selection) {
      for (const s of this.strokes) {
        if (this.selection.has(s.id)) drawStroke(ctx, moving ? transformStroke(s, t) : s);
      }
    }
    if (this.live && this.live.points.length >= 3) {
      drawStroke(ctx, {
        id: 'live',
        tool: this.live.tool,
        color: this.liveStyle.color,
        width: this.liveStyle.width,
        points: this.live.points,
      });
    }

    // Surcouche (espace écran)
    ctx.setTransform(d, 0, 0, d, 0, 0);
    if (this.selBox && this.selection) {
      const b = moving ? transformBounds(this.selBox, t) : this.selBox;
      const a = this.toScreen(b.minX, b.minY);
      const c = this.toScreen(b.maxX, b.maxY);
      ctx.save();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(a.x, a.y, c.x - a.x, c.y - a.y);
      ctx.setLineDash([]);
      ctx.fillStyle = '#0b0b10';
      for (const [hx, hy] of [[a.x, a.y], [c.x, a.y], [c.x, c.y], [a.x, c.y]]) {
        ctx.beginPath();
        ctx.rect(hx - 6, hy - 6, 12, 12);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
    if (this.gesture === 'lassoSelect' && this.lassoPoly.length >= 4) {
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.fillStyle = 'rgba(34,211,238,0.08)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < this.lassoPoly.length; i += 2) {
        const s = this.toScreen(this.lassoPoly[i], this.lassoPoly[i + 1]);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    if (this.settings.tool === 'eraser' && this.hover && this.touches.size === 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(this.hover.x, this.hover.y, ERASER_PX[this.settings.widthPreset], 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}
