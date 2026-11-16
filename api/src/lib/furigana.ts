// Furigana (ruby) generation for Japanese question text, using kuromoji (IPADIC).
//
// Output format ("Seg[]"): a plain string for text without readings, or a
// [kanji, hiragana] tuple for a run of kanji with its reading. The client
// renders tuples as <ruby>, so no HTML is ever produced server-side.
import path from 'path';
import kuromoji from 'kuromoji';

export type Seg = string | [string, string];

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>;
let tokenizerPromise: Promise<Tokenizer> | null = null;

function getTokenizer(): Promise<Tokenizer> {
  if (!tokenizerPromise) {
    const dicPath = path.join(path.dirname(require.resolve('kuromoji/package.json')), 'dict');
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, t) => (err ? reject(err) : resolve(t)));
    });
    tokenizerPromise.catch(() => { tokenizerPromise = null; });
  }
  return tokenizerPromise;
}

const KANJI = /[㐀-䶿一-鿿豈-﫿々〆ヶ]/;
const toHira = (s: string) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

// Split a token into kanji runs (with readings) and kana runs, by matching the
// reading against the surface's kana skeleton, e.g. 取り込み / とりこみ →
// [取,と] り [込,こ] み. Falls back to one ruby over the whole token.
function alignToken(surface: string, reading: string): Seg[] {
  const parts = surface.match(/[㐀-䶿一-鿿豈-﫿々〆ヶ]+|[^㐀-䶿一-鿿豈-﫿々〆ヶ]+/g) ?? [surface];
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('^' + parts.map((p) => (KANJI.test(p) ? '(.+?)' : esc(toHira(p)))).join('') + '$');
  const m = toHira(reading).match(re);
  if (!m) return [[surface, toHira(reading)]];
  const out: Seg[] = [];
  let g = 1;
  for (const p of parts) out.push(KANJI.test(p) ? [p, m[g++]] : p);
  return out;
}

function push(out: Seg[], s: Seg) {
  if (typeof s === 'string' && typeof out[out.length - 1] === 'string') out[out.length - 1] += s;
  else out.push(s);
}

// Single-token readings that IPADIC gets wrong in technical text.
const OVERRIDE: Record<string, string> = { '値': 'あたい', '行': 'ぎょう' };

export async function toRuby(text: string): Promise<Seg[]> {
  if (!text || !KANJI.test(text)) return [text];
  const t = await getTokenizer();
  const out: Seg[] = [];
  for (const tok of t.tokenize(text)) {
    const r = OVERRIDE[tok.surface_form] ?? tok.reading;
    if (KANJI.test(tok.surface_form) && r && r !== '*') {
      for (const s of alignToken(tok.surface_form, r)) push(out, s);
    } else {
      push(out, tok.surface_form);
    }
  }
  return out;
}

export interface RubyTranslation {
  stem: Seg[];
  options: Record<string, Seg[]>;
  analysis: Seg[];
}

const cache = new Map<string, RubyTranslation>();

export async function rubyFor(
  key: string,
  tr: { stem: string; options: Record<string, string>; analysis: string },
): Promise<RubyTranslation> {
  const hit = cache.get(key);
  if (hit) return hit;
  const options: Record<string, Seg[]> = {};
  for (const [k, v] of Object.entries(tr.options)) options[k] = await toRuby(v);
  const res = { stem: await toRuby(tr.stem), options, analysis: await toRuby(tr.analysis) };
  if (cache.size > 5000) cache.clear();
  cache.set(key, res);
  return res;
}
