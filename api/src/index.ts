import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import certsRoutes from './routes/certs';
import chaptersRoutes from './routes/chapters';

const start = async () => {
  const app = Fastify({ logger: true });

  // CORS for dev
  await app.register(fastifyCors, {
    origin: ['http://localhost:5173', 'http://localhost:4173'],
  });

  // API routes
  await app.register(certsRoutes, { prefix: '/api' });
  await app.register(chaptersRoutes, { prefix: '/api' });

  // Serve Vue SPA from web/dist (relative to api/dist after build)
  const webDistPath = path.resolve(__dirname, '../../web/dist');
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/',
  });

  // SPA fallback: all non-/api routes → index.html
  app.setNotFoundHandler(async (request, reply) => {
    if (!request.url.startsWith('/api')) {
      return reply.sendFile('index.html');
    }
    return reply.code(404).send({ error: 'Not found' });
  });

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
