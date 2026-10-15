// ===================================================================
// Syntropy Stylus — codec compact (deltas entiers + gzip + base64)
// Format : "g1:<base64 gzip(json)>"  ou  "j1:<json>" (repli sans CompressionStream)
// ===================================================================
import type { InkBackground, InkDocument, InkPaperColor, InkPenTool, InkStroke } from '@/types';
import { uid } from '@/lib/ink';

type PackedStroke = [string, string, number, number[]]; // [outil, couleur, largeur×10, deltas xyp]
interface Packed {
  v: 1;
  b: string;
  pc?: string;
  s: PackedStroke[];
}

const TOOL_TO_CODE: Record<InkPenTool, string> = { pen: 'p', fountain: 'f', highlighter: 'h' };
const CODE_TO_TOOL: Record<string, InkPenTool> = { p: 'pen', f: 'fountain', h: 'highlighter' };
const BACKGROUNDS: InkBackground[] = ['dark', 'lined', 'dots'];
const PAPER_COLOR_LIST: InkPaperColor[] = ['dark', 'white', 'sepia', 'slate'];

export function emptyInkDocument(paperColor: InkPaperColor = 'dark'): InkDocument {
  return { version: 1, background: 'dark', paperColor, strokes: [] };
}

function pack(doc: InkDocument): Packed {
  const s: PackedStroke[] = doc.strokes
    .filter((st) => st.points.length >= 3)
    .map((st) => {
      const d: number[] = [];
      let px = 0, py = 0, pp = 0;
      for (let i = 0; i < st.points.length; i += 3) {
        const x = Math.round(st.points[i] * 10);
        const y = Math.round(st.points[i + 1] * 10);
        const p = Math.round(st.points[i + 2] * 100);
        d.push(x - px, y - py, p - pp);
        px = x;
        py = y;
        pp = p;
      }
      return [TOOL_TO_CODE[st.tool], st.color, Math.round(st.width * 10), d];
    });
  return { v: 1, b: doc.background, pc: doc.paperColor || 'dark', s };
}

function unpack(raw: unknown): InkDocument | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Partial<Packed>;
  if (o.v !== 1 || !Array.isArray(o.s)) return null;
  const background = BACKGROUNDS.includes(o.b as InkBackground) ? (o.b as InkBackground) : 'dark';
  const paperColor = PAPER_COLOR_LIST.includes(o.pc as InkPaperColor) ? (o.pc as InkPaperColor) : 'dark';
  const strokes: InkStroke[] = [];
  for (const entry of o.s) {
    if (!Array.isArray(entry) || entry.length < 4) continue;
    const [t, color, w10, d] = entry as PackedStroke;
    const tool = CODE_TO_TOOL[t];
    if (!tool || typeof color !== 'string' || !/^#[0-9a-fA-F]{3,8}$/.test(color)) continue;
    if (typeof w10 !== 'number' || !isFinite(w10) || !Array.isArray(d) || d.length < 3 || d.length % 3 !== 0) continue;
    if (d.length > 600_000) continue;
    const points: number[] = [];
    let x = 0, y = 0, p = 0;
    let ok = true;
    for (let i = 0; i < d.length; i += 3) {
      const dx = d[i], dy = d[i + 1], dp = d[i + 2];
      if (!isFinite(dx) || !isFinite(dy) || !isFinite(dp)) {
        ok = false;
        break;
      }
      x += dx;
      y += dy;
      p += dp;
      points.push(x / 10, y / 10, Math.max(0, Math.min(1, p / 100)));
    }
    if (!ok) continue;
    strokes.push({ id: uid(), tool, color, width: Math.max(0.5, Math.min(200, w10 / 10)), points });
  }
  return { version: 1, background, paperColor, strokes };
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const CH = 0x8000;
  for (let i = 0; i < bytes.length; i += CH) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CH)));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const hasCompression = () =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

export async function encodeInk(doc: InkDocument): Promise<string> {
  const json = JSON.stringify(pack(doc));
  if (!hasCompression()) return 'j1:' + json;
  try {
    const stream = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return 'g1:' + bytesToBase64(new Uint8Array(buf));
  } catch {
    return 'j1:' + json;
  }
}

export async function decodeInk(encoded: string | null | undefined): Promise<InkDocument | null> {
  if (!encoded) return null;
  try {
    if (encoded.startsWith('j1:')) return unpack(JSON.parse(encoded.slice(3)));
    if (encoded.startsWith('g1:')) {
      if (!hasCompression()) return null;
      const bytes = base64ToBytes(encoded.slice(3));
      const stream = new Blob([bytes as unknown as BlobPart])
        .stream()
        .pipeThrough(new DecompressionStream('gzip'));
      const text = await new Response(stream).text();
      return unpack(JSON.parse(text));
    }
  } catch {
    return null;
  }
  return null;
}
