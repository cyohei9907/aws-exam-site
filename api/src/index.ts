import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs/promises';
import certsRoutes from './routes/certs';
import chaptersRoutes from './routes/chapters';
import sitemapRoutes from './routes/sitemap';
import { getMetaForUrl, injectMeta } from './lib/metaInjector';

const start = async () => {
  const app = Fastify({ logger: true });

  // CORS for dev
  await app.register(fastifyCors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
  });

  // Sitemap + robots.txt (before static, so /robots.txt isn't caught by static)
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

  // SPA fallback: inject per-page meta for crawlers, then serve index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (request.url.startsWith('/api')) {
      return reply.code(404).send({ error: 'Not found' });
    }
    if (!indexHtml) {
      return reply.code(503).send('Service unavailable');
    }
    const meta = getMetaForUrl(request.url);
    return reply.type('text/html').send(injectMeta(indexHtml, meta));
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen({ port, host });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
