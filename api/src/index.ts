import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs/promises';
import certsRoutes from './routes/certs';
import chaptersRoutes from './routes/chapters';
import sitemapRoutes from './routes/sitemap';
import { getMetaForUrl, injectMeta, injectQuestions, injectJsonLd, buildHomeJsonLd, buildCertJsonLd, buildChapterJsonLd, buildBreadcrumbJsonLd, buildQuestionMeta, buildSingleQuestionJsonLd, injectSingleQuestion } from './lib/metaInjector';
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

// Matches /cert/saa-c03/chapter/1  or  /ja/cert/saa-c03/chapter/1  (no trailing path)
const CHAPTER_RE = /^\/(?:(?:ja|zh)\/)?cert\/([a-z0-9-]+)\/chapter\/(\d+)$/;
// Matches /cert/saa-c03/chapter/1/question/42  or  /ja/cert/...
const QUESTION_RE = /^\/(?:(?:ja|zh)\/)?cert\/([a-z0-9-]+)\/chapter\/(\d+)\/question\/(\d+)/;

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

  // Resolve web dist and read index.html BEFORE registering static/SSR routes
  const webDistPath = path.resolve(__dirname, '../../web/dist');
  let indexHtml: string;
  try {
    indexHtml = await fs.readFile(path.join(webDistPath, 'index.html'), 'utf-8');
  } catch {
    indexHtml = '';
  }

  // ── Home page SSR routes (must be registered BEFORE fastifyStatic so they
  //    take precedence over it serving index.html as a plain static file) ──────
  //
  // fastifyStatic would serve / as a bare Vue shell (no meta injection).
  // By registering explicit handlers here, Googlebot gets proper title,
  // description, and JSON-LD for the home page in all three languages.

  // Register for each lang variant (with and without trailing slash)
  for (const variant of ['/', '/ja', '/ja/', '/zh', '/zh/']) {
    app.get(variant, async (_request, reply) => {
      if (!indexHtml) return reply.code(503).send('Service unavailable');
      const meta = getMetaForUrl(variant === '/ja/' ? '/ja' : variant === '/zh/' ? '/zh' : variant);
      let html = injectMeta(indexHtml, meta);
      html = injectJsonLd(html, buildHomeJsonLd(meta.lang));
      return reply.type('text/html').send(html);
    });
  }

  // Serve Vue SPA static assets (JS/CSS/images) from web/dist
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/',
  });

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

    // JSON-LD for cert pages
    const certOnlyMatch = meta.enPath.match(/^\/cert\/([a-z0-9-]+)$/);
    if (certOnlyMatch) {
      const certJld = buildCertJsonLd(certOnlyMatch[1], meta.lang);
      if (certJld) html = injectJsonLd(html, certJld);
      const breadcrumb = buildBreadcrumbJsonLd(meta.lang, certOnlyMatch[1]);
      if (breadcrumb) html = injectJsonLd(html, breadcrumb);
    }

    // Individual question pages: SSR with full Q+A content for Googlebot
    const questionMatch = request.url.match(QUESTION_RE);
    if (questionMatch) {
      const certId = questionMatch[1];
      const chapterId = parseInt(questionMatch[2], 10);
      const position = parseInt(questionMatch[3], 10);
      if (FREE_CHAPTERS[certId]?.includes(chapterId)) {
        try {
          const questions = await loadChapter(certId, chapterId);
          const q = questions[position - 1];
          if (q) {
            const qMeta = buildQuestionMeta(certId, chapterId, position, q, meta.lang);
            html = injectMeta(indexHtml, qMeta);
            const qJld = buildSingleQuestionJsonLd(certId, chapterId, position, q, meta.lang);
            if (qJld) html = injectJsonLd(html, qJld);
            const breadcrumb = buildBreadcrumbJsonLd(meta.lang, certId, chapterId, position);
            if (breadcrumb) html = injectJsonLd(html, breadcrumb);
            html = injectSingleQuestion(html, q, position, questions.length, meta.lang, certId, chapterId);
          }
        } catch {
          // GCS failure: serve with generic meta
        }
      }
      return reply.type('text/html').send(html);
    }

    // Full question injection for free chapter pages (all questions + options, visible HTML)
    const chapterMatch = request.url.match(CHAPTER_RE);
    if (chapterMatch) {
      const certId = chapterMatch[1];
      const chapterId = parseInt(chapterMatch[2], 10);
      if (FREE_CHAPTERS[certId]?.includes(chapterId)) {
        try {
          const questions = await loadChapter(certId, chapterId);

          // JSON-LD with full Q+A structured data
          const chapterJld = buildChapterJsonLd(certId, chapterId, meta.lang, questions);
          if (chapterJld) html = injectJsonLd(html, chapterJld);

          // BreadcrumbList
          const breadcrumb = buildBreadcrumbJsonLd(meta.lang, certId, chapterId);
          if (breadcrumb) html = injectJsonLd(html, breadcrumb);

          // Visible question HTML: all questions + options, removed by Vue on mount
          html = injectQuestions(html, questions, meta.lang, certId, chapterId);
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
