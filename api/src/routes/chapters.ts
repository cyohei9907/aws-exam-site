import { FastifyPluginAsync } from 'fastify';
import { loadChapter, QuestionTranslation } from '../lib/gcs';

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

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = 'ja' | 'en' | 'zh';

interface GetChapterQuery {
  lang?: string;
}

interface CheckBody {
  question_id: string;
  selected: string[];
}

interface CheckQuerystring {
  lang?: string;
}

// ─── Route plugin ─────────────────────────────────────────────────────────────

const chaptersRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/certs/:certId/chapters/:chapterId?lang=ja
  fastify.get<{
    Params: { certId: string; chapterId: string };
    Querystring: GetChapterQuery;
  }>('/certs/:certId/chapters/:chapterId', async (request, reply) => {
    const { certId, chapterId: chapterIdStr } = request.params;
    const chapterId = parseInt(chapterIdStr, 10);

    if (isNaN(chapterId)) {
      return reply.code(400).send({ code: 'invalid_chapter', message: 'chapterId must be an integer' });
    }

    if (!isFreeChapter(certId, chapterId)) {
      return reply.code(403).send({
        code: 'premium_required',
        message: 'This chapter requires the iOS app',
      });
    }

    const rawLang = request.query.lang ?? 'ja';
    if (!['ja', 'en', 'zh'].includes(rawLang)) {
      return reply.code(400).send({ code: 'invalid_lang', message: 'lang must be ja, en, or zh' });
    }
    const lang = rawLang as Lang;

    const questions = await loadChapter(certId, chapterId);

    const result = questions.map((q) => {
      const translation: QuestionTranslation | undefined = q[lang];
      return {
        id: q.id,
        cert_id: q.cert_id,
        type: q.type,
        num_options: q.num_options,
        difficulty: q.difficulty,
        chapter: q.chapter,
        translation: translation
          ? {
              stem: translation.stem,
              options: translation.options,
              analysis: translation.analysis,
            }
          : null,
      };
    });

    return reply.send(result);
  });

  // POST /api/certs/:certId/chapters/:chapterId/check
  fastify.post<{
    Params: { certId: string; chapterId: string };
    Querystring: CheckQuerystring;
    Body: CheckBody;
  }>('/certs/:certId/chapters/:chapterId/check', async (request, reply) => {
    const { certId, chapterId: chapterIdStr } = request.params;
    const chapterId = parseInt(chapterIdStr, 10);

    if (isNaN(chapterId)) {
      return reply.code(400).send({ code: 'invalid_chapter', message: 'chapterId must be an integer' });
    }

    if (!isFreeChapter(certId, chapterId)) {
      return reply.code(403).send({
        code: 'premium_required',
        message: 'This chapter requires the iOS app',
      });
    }

    const { question_id, selected } = request.body;

    if (!question_id || !Array.isArray(selected)) {
      return reply.code(400).send({ code: 'invalid_body', message: 'question_id and selected are required' });
    }

    const questions = await loadChapter(certId, chapterId);
    const question = questions.find((q) => q.id === question_id);

    if (!question) {
      return reply.code(404).send({ code: 'not_found', message: 'Question not found' });
    }

    const sortedSelected = [...selected].sort();
    const sortedCorrect = [...question.correct_answers].sort();
    const correct =
      sortedSelected.length === sortedCorrect.length &&
      sortedSelected.every((ans, i) => ans === sortedCorrect[i]);

    const rawLang = request.query.lang ?? 'ja';
    const lang: Lang = (['ja', 'en', 'zh'] as Lang[]).includes(rawLang as Lang)
      ? (rawLang as Lang)
      : 'ja';

    const translation = question[lang];
    const analysis = translation?.analysis ?? question.en?.analysis ?? '';

    return reply.send({
      correct,
      correct_answers: question.correct_answers,
      analysis,
    });
  });
};

export default chaptersRoutes;
