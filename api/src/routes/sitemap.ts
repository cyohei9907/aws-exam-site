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

function xmlEsc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function langUrl(enPath: string, lang: string): string {
  if (lang === 'en') return `${BASE_URL}${enPath}`;
  return `${BASE_URL}/${lang}${enPath === '/' ? '/' : enPath}`;
}

// Build one <url> entry with hreflang links for all three language variants
function urlEntry(enPath: string, changefreq: string, priority: string): string {
  const loc = xmlEsc(langUrl(enPath, 'en'));
  const hreflang = LANGS.map((l) =>
    `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEsc(langUrl(enPath, l))}" />`,
  ).concat([
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(langUrl(enPath, 'en'))}" />`,
  ]).join('\n');

  return `  <url>\n    <loc>${loc}</loc>\n${hreflang}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const sitemapPlugin: FastifyPluginAsync = async (app) => {
  app.get('/robots.txt', async (_req, reply) => {
    reply.type('text/plain').send(
      `User-agent: *\nAllow: /\nSitemap: ${BASE_URL}/sitemap.xml\n`,
    );
  });

  app.get('/sitemap.xml', async (_req, reply) => {
    const entries: string[] = [urlEntry('/', 'weekly', '1.0')];

    for (const certId of CERTS_WITH_DATA) {
      entries.push(urlEntry(`/cert/${certId}`, 'weekly', '0.8'));
      for (const ch of FREE_CHAPTERS[certId] ?? []) {
        entries.push(urlEntry(`/cert/${certId}/chapter/${ch}`, 'monthly', '0.6'));
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

    reply.type('application/xml').send(xml);
  });
};

export default sitemapPlugin;
