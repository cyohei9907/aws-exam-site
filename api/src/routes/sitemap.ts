import { FastifyPluginAsync } from 'fastify';

const BASE_URL = 'https://aws.cyohei.net';
const LANGS = ['en', 'ja', 'zh'] as const;

// Cert IDs with data (skip das-c01 / mls-c01 — no data)
const CERTS_WITH_DATA = [
  'saa-c03', 'sap-c02', 'clf-c02', 'dva-c02', 'soa-c02',
  'dop-c02', 'aif-c01', 'ans-c01', 'dea-c01', 'mla-c01', 'scs-c02',
];

// Free chapters per cert
const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5],
  'sap-c02': [1, 2, 3],
  'clf-c02': [1, 2, 3],
  'dva-c02': [1, 2, 3],
  'dop-c02': [1, 2, 3],
  'aif-c01': [1, 2, 3],
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

const sitemapPlugin: FastifyPluginAsync = async (app) => {
  app.get('/sitemap.xml', async (_req, reply) => {
    const entries: string[] = [urlEntry('/', 'weekly', '1.0')];

    for (const certId of CERTS_WITH_DATA) {
      entries.push(urlEntry(`/cert/${certId}`, 'weekly', '0.8'));
      for (const ch of FREE_CHAPTERS[certId] ?? []) {
        entries.push(urlEntry(`/cert/${certId}/chapter/${ch}`, 'monthly', '0.6'));
      }
    }

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
