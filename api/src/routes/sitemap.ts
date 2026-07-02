import { FastifyPluginAsync } from 'fastify';
import { loadChapter } from '../lib/gcs';

const BASE_URL = 'https://aws.cyohei.net';
const LANGS = ['en', 'ja', 'zh'] as const;

const CERTS_WITH_DATA = [
  'saa-c03', 'sap-c02', 'clf-c02', 'dva-c02', 'soa-c02',
  'dop-c02', 'aif-c01', 'ans-c01', 'dea-c01', 'mla-c01', 'scs-c02',
];

const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5],
  'sap-c02': [1, 2, 3],
  'clf-c02': [1, 2, 3],
  'dva-c02': [1, 2, 3],
  'dop-c02': [1, 2, 3],
  'aif-c01': [1, 2, 3],
  'soa-c02': [1],
  'ans-c01': [1],
  'dea-c01': [1],
  'scs-c02': [1],
};

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function langUrl(enPath: string, lang: string): string {
  if (lang === 'en') return `${BASE_URL}${enPath}`;
  return `${BASE_URL}/${lang}${enPath === '/' ? '/' : enPath}`;
}

function urlEntry(enPath: string, changefreq: string, priority: string): string {
  const lines: string[] = [];
  lines.push('  <url>');
  lines.push(`    <loc>${esc(langUrl(enPath, 'en'))}</loc>`);
  for (const lang of LANGS) {
    lines.push(`    <xhtml:link rel="alternate" hreflang="${lang}" href="${esc(langUrl(enPath, lang))}"/>`);
  }
  lines.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(langUrl(enPath, 'en'))}"/>`);
  lines.push(`    <changefreq>${changefreq}</changefreq>`);
  lines.push(`    <priority>${priority}</priority>`);
  lines.push('  </url>');
  return lines.join('\n');
}

// Cache the question URL entries so repeated sitemap requests are fast
let cachedQuestionEntries: string[] | null = null;
let cacheTime = 0;
const QUESTION_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function buildQuestionEntries(): Promise<string[]> {
  const now = Date.now();
  if (cachedQuestionEntries && now - cacheTime < QUESTION_CACHE_TTL_MS) {
    return cachedQuestionEntries;
  }

  const groups = await Promise.all(
    Object.entries(FREE_CHAPTERS).flatMap(([certId, chapters]) =>
      chapters.map(async (ch): Promise<string[]> => {
        try {
          const questions = await loadChapter(certId, ch);
          return questions.map((_, i) =>
            urlEntry(`/cert/${certId}/chapter/${ch}/question/${i + 1}`, 'monthly', '0.5')
          );
        } catch {
          return [];
        }
      })
    )
  );

  cachedQuestionEntries = groups.flat();
  cacheTime = now;
  return cachedQuestionEntries;
}

const sitemapPlugin: FastifyPluginAsync = async (app) => {
  app.get('/sitemap.xml', async (_req, reply) => {
    const entries: string[] = [urlEntry('/', 'weekly', '1.0')];

    for (const certId of CERTS_WITH_DATA) {
      entries.push(urlEntry(`/cert/${certId}`, 'weekly', '0.8'));
      for (const ch of FREE_CHAPTERS[certId] ?? []) {
        entries.push(urlEntry(`/cert/${certId}/chapter/${ch}`, 'weekly', '0.7'));
      }
    }

    // Append individual question pages (loaded from GCS, cached 6h)
    const questionEntries = await buildQuestionEntries();
    entries.push(...questionEntries);

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset',
      '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
      '  xmlns:xhtml="http://www.w3.org/1999/xhtml">',
      entries.join('\n'),
      '</urlset>',
    ].join('\n');

    reply
      .header('Content-Type', 'application/xml; charset=utf-8')
      .send(xml);
  });
};

export default sitemapPlugin;
