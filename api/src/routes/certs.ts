import { FastifyPluginAsync } from 'fastify';
import { loadManifest } from '../lib/gcs';

// ─── Free chapters policy ─────────────────────────────────────────────────────

// >1000q → 30% of chapters free; 500–900q → 3 chapters free; <500q → app only
const FREE_CHAPTERS: Record<string, number[]> = {
  'saa-c03': [1, 2, 3, 4, 5],      // 1389q / 17ch → 30% = 5
  'sap-c02': [1, 2, 3],             // 748q
  'clf-c02': [1, 2, 3],             // 1087q / 11ch → 30% = 3
  'dva-c02': [1, 2, 3],             // 1251q / 13ch → 30% = 3
  'dop-c02': [1, 2, 3],             // 632q
  'aif-c01': [1, 2, 3],             // 528q
  'soa-c02': [],                    // 469q — app only
  'ans-c01': [],                    // 289q — app only
  'dea-c01': [],                    // 240q — app only
  'mla-c01': [],                    //  91q — app only
  'mls-c01': [],                    // no data — app only
  'das-c01': [],                    // no data — app only
  'scs-c02': [],                    // 286q — app only
};

function isFreeChapter(certId: string, chapter: number): boolean {
  const list = FREE_CHAPTERS[certId];
  if (list === undefined) return false;
  return list.includes(chapter);
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
