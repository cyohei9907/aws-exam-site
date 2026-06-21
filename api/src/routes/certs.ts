import { FastifyPluginAsync } from 'fastify';
import { loadManifest } from '../lib/gcs';

// ─── Free chapters policy ─────────────────────────────────────────────────────

const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5, 6, 7, 8],
  'sap-c02': [1, 2, 3],
};

function isFreeChapter(certId: string, chapter: number): boolean {
  const list = FREE_CHAPTERS[certId];
  if (list) return list.includes(chapter);
  return chapter === 1;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

const certsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/certs', async (_request, reply) => {
    const manifest = await loadManifest();

    const certs = manifest.certs.map((cert) => ({
      cert_id: cert.cert_id,
      total: cert.total,
      chapters: cert.chapters.map((ch) => ({
        chapter: ch.chapter,
        count: ch.count,
        version: ch.version,
        is_free: isFreeChapter(cert.cert_id, ch.chapter),
      })),
    }));

    return reply.send(certs);
  });
};

export default certsRoutes;
