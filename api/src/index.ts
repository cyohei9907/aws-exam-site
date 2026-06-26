import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs/promises';
import certsRoutes from './routes/certs';
import chaptersRoutes from './routes/chapters';
import sitemapRoutes from './routes/sitemap';
import { getMetaForUrl, injectMeta, injectQuestions } from './lib/metaInjector';
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

    // Inject first 5 question stems for free chapter pages so search engines
    // can index the actual question text (30-min cache in gcs.ts, negligible overhead)
    const chapterMatch = request.url.match(CHAPTER_RE);
    if (chapterMatch) {
      const certId = chapterMatch[1];
      const chapterId = parseInt(chapterMatch[2], 10);
      if (FREE_CHAPTERS[certId]?.includes(chapterId)) {
        try {
          const lang = request.url.startsWith('/ja') ? 'ja'
                     : request.url.startsWith('/zh') ? 'zh'
                     : 'en';
          const questions = await loadChapter(certId, chapterId);
          const stems = questions
            .slice(0, 5)
            .map((q) => (q[lang]?.stem ?? q.en?.stem ?? '').trim())
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
