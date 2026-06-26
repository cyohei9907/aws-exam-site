import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs/promises';
import certsRoutes from './routes/certs';
import chaptersRoutes from './routes/chapters';
import sitemapRoutes from './routes/sitemap';
import { getMetaForUrl, injectMeta, injectQuestions, injectJsonLd, buildHomeJsonLd, buildCertJsonLd, buildChapterJsonLd } from './lib/metaInjector';
import { loadChapter } from './lib/gcs';

// Free chapters whose question text we expose in SSR HTML for indexing
const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5],
  'sap-c02': [1, 2, 3],
  'clf-c02': [1, 2, 3],
  'dva-c02': [1, 2, 3],
  'dop-c02': [1, 2, 3],
  'aif-c01': [1, 2, 3],
};

// Matches /cert/saa-c03/chapter/1  or  /ja/cert/saa-c03/chapter/1  etc.
const CHAPTER_RE = /^\/(?:(?:ja|zh)\/)?cert\/([a-z0-9-]+)\/chapter\/(\d+)/;

const start = async () => {
  const app = Fastify({ logger: true });

  // CORS for dev
  await app.register(fastifyCors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
  });

  // Sitemap (before static)
  await app.register(sitemapRoutes);

  // API routes
  await app.register(certsRoutes, { prefix: '/api' });
  await app.register(chaptersRoutes, { prefix: '/api' });

  // Serve Vue SPA from web/dist (relative to api/dist after build)
  const webDistPath = path.resolve(__dirname, '../../web/dist');
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/',
  });

  // Cache index.html contents at startup to avoid per-request disk reads
  let indexHtml: string;
  try {
    indexHtml = await fs.readFile(path.join(webDistPath, 'index.html'), 'utf-8');
  } catch {
    indexHtml = '';
  }

  // SPA fallback: inject per-page meta (and question content for free chapters)
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api')) {
      return reply.code(404).send({ error: 'Not found' });
    }
    if (!indexHtml) {
      return reply.code(503).send('Service unavailable');
    }

    const meta = getMetaForUrl(request.url);
    let html = injectMeta(indexHtml, meta);

    // JSON-LD for home and cert pages
    if (meta.enPath === '/' || meta.enPath === '') {
      html = injectJsonLd(html, buildHomeJsonLd(meta.lang));
    } else {
      const certOnlyMatch = meta.enPath.match(/^\/cert\/([a-z0-9-]+)$/);
      if (certOnlyMatch) {
        const jld = buildCertJsonLd(certOnlyMatch[1], meta.lang);
        if (jld) html = injectJsonLd(html, jld);
      }
    }

    // Question injection + JSON-LD for free chapter pages (30-min GCS cache)
    const chapterMatch = request.url.match(CHAPTER_RE);
    if (chapterMatch) {
      const certId = chapterMatch[1];
      const chapterId = parseInt(chapterMatch[2], 10);
      if (FREE_CHAPTERS[certId]?.includes(chapterId)) {
        try {
          const questions = await loadChapter(certId, chapterId);

          // JSON-LD with full Q+A structured data for Google
          const chapterJld = buildChapterJsonLd(certId, chapterId, meta.lang, questions);
          if (chapterJld) html = injectJsonLd(html, chapterJld);

          // Hidden text stems for keyword indexing
          const stems = questions
            .slice(0, 10)
            .map((q) => ((meta.lang === 'ja' ? q.ja : meta.lang === 'zh' ? q.zh : q.en)?.stem ?? q.en?.stem ?? '').trim())
            .filter(Boolean);
          html = injectQuestions(html, stems);
        } catch {
          // GCS failure: skip injection, serve page normally
        }
      }
    }

    return reply.type('text/html').send(html);
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen({ port, host });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
