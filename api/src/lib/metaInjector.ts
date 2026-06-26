import type { Question } from './gcs';

const BASE_URL = 'https://aws.cyohei.net';

type Lang = 'en' | 'ja' | 'zh';

interface PageMeta {
  lang: Lang;
  title: string;
  description: string;
  keywords: string;
  ogType: string;
  canonical: string;
  enPath: string;
}

interface CertEntry {
  en: string; ja: string; zh: string;
  total: number; free: boolean;
}

const CERT_DATA: Record<string, CertEntry> = {
  'saa-c03': { en: 'Solutions Architect Associate', ja: 'ソリューションアーキテクト アソシエイト', zh: '解决方案架构师 助理', total: 1389, free: true },
  'sap-c02': { en: 'Solutions Architect Professional', ja: 'ソリューションアーキテクト プロフェッショナル', zh: '解决方案架构师 专业级', total: 748, free: true },
  'clf-c02': { en: 'Cloud Practitioner', ja: 'クラウドプラクティショナー', zh: '云从业者', total: 1087, free: true },
  'dva-c02': { en: 'Developer Associate', ja: 'デベロッパー アソシエイト', zh: '开发人员 助理', total: 1251, free: true },
  'soa-c02': { en: 'SysOps Administrator Associate', ja: 'SysOps アドミニストレーター アソシエイト', zh: 'SysOps 管理员 助理', total: 469, free: false },
  'dop-c02': { en: 'DevOps Engineer Professional', ja: 'DevOps エンジニア プロフェッショナル', zh: 'DevOps 工程师 专业级', total: 632, free: true },
  'aif-c01': { en: 'AI Practitioner', ja: 'AI プラクティショナー', zh: 'AI 从业者', total: 528, free: true },
  'ans-c01': { en: 'Advanced Networking Specialty', ja: '高度なネットワーキング 専門知識', zh: '高级网络 专项认证', total: 289, free: false },
  'dea-c01': { en: 'Data Engineer Associate', ja: 'データエンジニア アソシエイト', zh: '数据工程师 助理', total: 240, free: false },
  'mla-c01': { en: 'Machine Learning Engineer Associate', ja: 'ML エンジニア アソシエイト', zh: '机器学习工程师 助理', total: 91, free: false },
  'scs-c02': { en: 'Security Specialty', ja: 'セキュリティ 専門知識', zh: '安全 专项認証', total: 286, free: false },
};

// First N chapters are free to practice in the browser
const FREE_CHAPTER_LIMIT: Record<string, number> = {
  'saa-c03': 5, 'sap-c02': 3, 'clf-c02': 3,
  'dva-c02': 3, 'dop-c02': 3, 'aif-c01': 3,
};

function isFreeChap(certId: string, ch: number): boolean {
  return ch <= (FREE_CHAPTER_LIMIT[certId] ?? 0);
}

function fmtN(total: number, lang: Lang): string {
  return total.toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US');
}

// ─── Meta by page type + language ────────────────────────────────────────────

function homeMeta(lang: Lang, enPath: string): PageMeta {
  const canonical = lang === 'en' ? `${BASE_URL}/` : `${BASE_URL}/${lang}/`;
  if (lang === 'ja') return {
    lang, canonical, enPath, ogType: 'website',
    title: 'AWS認定試験 練習問題 無料 2025 | SAA・SAP・CLF・DVA など11種類',
    description: 'AWS認定試験11種の無料練習問題集。SAA-C03・SAP-C02・CLF-C02・DVA-C02など7,441問以上。無料チャプターをブラウザで今すぐ解答・解説付き。iOSアプリで全問+AI解説。',
    keywords: 'AWS認定試験,AWS練習問題,AWS模擬試験,AWS問題集,SAA-C03,SAP-C02,CLF-C02,DVA-C02,SOA-C02,DOP-C02,AIF-C01,AWS資格,AWS試験対策,AWSダンプ,無料,2025年,AWS認定資格,AWS合格',
  };
  if (lang === 'zh') return {
    lang, canonical, enPath, ogType: 'website',
    title: 'AWS认证考试免费练习题 2025 | SAA、SAP、CLF、DVA 等11种认证',
    description: 'AWS认证考试11种免费练习题集。SAA-C03、SAP-C02、CLF-C02、DVA-C02 等 7,441+ 道题，含解析。直接在浏览器练习，iOS App 解锁全部题目。',
    keywords: 'AWS认证,AWS考试,AWS练习题,AWS模拟题,AWS题库,SAA-C03,SAP-C02,CLF-C02,DVA-C02,SOA-C02,DOP-C02,AIF-C01,AWS备考,AWS认证考试,免费,2025',
  };
  return {
    lang, canonical, enPath, ogType: 'website',
    title: 'Free AWS Exam Practice Questions 2025 — SAA-C03, SAP-C02, CLF-C02, DVA-C02 & More',
    description: 'Free AWS exam practice questions for SAA-C03, SAP-C02, CLF-C02, DVA-C02 and 7 more certifications. 7,441+ questions with detailed answers and explanations. Pass your AWS exam with confidence.',
    keywords: 'AWS exam practice, AWS certification exam, AWS practice questions free 2025, SAA-C03, SAP-C02, CLF-C02, DVA-C02, SOA-C02, DOP-C02, AIF-C01, AWS exam dumps 2025, AWS solutions architect practice test, cloud practitioner practice test, AWS exam prep 2025, free AWS quiz online, pass AWS certification',
  };
}

function certMeta(certId: string, lang: Lang, enPath: string): PageMeta {
  const data = CERT_DATA[certId];
  const canonical = lang === 'en' ? `${BASE_URL}/cert/${certId}` : `${BASE_URL}/${lang}/cert/${certId}`;
  const n = fmtN(data.total, lang);
  const id = certId.toUpperCase();

  if (lang === 'ja') {
    const title = data.free
      ? `AWS ${id} 無料練習問題 2025 — ${n}問 ${data.ja}`
      : `AWS ${id} ${data.ja} 練習問題 ${n}問 | iOSアプリで学習`;
    return {
      lang, canonical, enPath, ogType: 'website',
      title,
      description: data.free
        ? `AWS ${id}（${data.ja}）の練習問題 ${n}問。無料チャプターでブラウザからすぐ解答・解説付きで学習。iOSアプリで全問挑戦できます。`
        : `AWS ${id}（${data.ja}）の練習問題 ${n}問はiOSアプリ限定。AI解説・オフライン学習・進捗管理機能付き。`,
      keywords: `AWS ${id},${certId},${data.ja},AWS練習問題,AWS模擬試験,AWS問題集,AWS試験対策${data.free ? ',無料' : ''},2025年,AWS認定資格`,
    };
  }
  if (lang === 'zh') {
    const title = data.free
      ? `AWS ${id} 免费练习题 2025 — ${n}道 ${data.zh}`
      : `AWS ${id} ${data.zh} 练习题 ${n}道 | iOS 应用专属`;
    return {
      lang, canonical, enPath, ogType: 'website',
      title,
      description: data.free
        ? `AWS ${id}（${data.zh}）练习题 ${n} 道，含免费章节，带解析，直接在浏览器练习。iOS App 解锁全部题目。`
        : `AWS ${id}（${data.zh}）练习题 ${n} 道，iOS App 专属，含 AI 解析、离线学习、进度追踪。`,
      keywords: `AWS ${id},${certId},${data.zh},AWS练习题,AWS模拟题,AWS题库,AWS备考${data.free ? ',免费' : ''},2025`,
    };
  }
  const title = data.free
    ? `AWS ${id} Free Practice Test 2025 — ${n} ${data.en} Exam Questions`
    : `AWS ${id} Exam Practice — ${n} ${data.en} Questions (iOS App)`;
  return {
    lang, canonical, enPath, ogType: 'website',
    title,
    description: data.free
      ? `Free practice questions for AWS ${id} (${data.en}) exam. ${n} questions with detailed answers and explanations. ${fmtN(Math.ceil(data.total * 0.3 / 100) * 100, 'en')}+ free questions available online. Pass your AWS ${id} exam in 2025.`
      : `Practice questions for AWS ${id} (${data.en}) exam. ${n} questions with answers. Available in the iOS app with AI explanations and offline access.`,
    keywords: `AWS ${id}, ${certId}, ${data.en}${data.free ? `, ${certId} practice test free, ${certId} free questions 2025` : ''}, ${certId} exam questions 2025, ${certId} dumps 2025, ${certId} practice test, ${certId} questions answers, AWS ${certId} exam prep, pass ${certId} exam`,
  };
}

function chapterMeta(certId: string, chapter: string, lang: Lang, enPath: string): PageMeta {
  const data = CERT_DATA[certId];
  const canonical = lang === 'en'
    ? `${BASE_URL}/cert/${certId}/chapter/${chapter}`
    : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}`;
  const id = certId.toUpperCase();
  const free = isFreeChap(certId, parseInt(chapter, 10));

  if (lang === 'ja') return {
    lang, canonical, enPath, ogType: 'article',
    title: `AWS ${id} 第${chapter}章 ${free ? '無料' : ''}練習問題 2025 — ${data.ja}`,
    description: `AWS ${id}（${data.ja}）の第${chapter}章を本番形式で学習。全問に解説付きで苦手分野を克服。${free ? 'ブラウザ無料で今すぐ解答。' : 'iOSアプリで学習。'}`,
    keywords: `AWS ${id},${certId},${certId} 第${chapter}章 練習問題${free ? ',無料' : ''},AWS模擬試験,AWS試験対策,2025年,AWS認定資格`,
  };
  if (lang === 'zh') return {
    lang, canonical, enPath, ogType: 'article',
    title: `AWS ${id} 第${chapter}章 ${free ? '免费' : ''}练习题 2025 — ${data.zh}`,
    description: `在线练习 AWS ${id}（${data.zh}）第${chapter}章题目，含详细解析，模拟真实考试环境。${free ? '免费使用，无需注册。' : ''}`,
    keywords: `AWS ${id},${certId},${certId} 第${chapter}章 练习题${free ? ',免费' : ''},AWS模拟题,AWS备考,AWS题库,2025`,
  };
  return {
    lang, canonical, enPath, ogType: 'article',
    title: `AWS ${id} Chapter ${chapter} ${free ? 'Free ' : ''}Practice Test 2025 — ${data.en} Exam Questions`,
    description: `Practice AWS ${id} (${data.en}) exam questions from Chapter ${chapter}. ${free ? 'Free online quiz in real exam format with detailed answer explanations. ' : ''}Pass your AWS ${id} exam in 2025.`,
    keywords: `AWS ${id} chapter ${chapter}${free ? ' free' : ''}, ${certId} chapter ${chapter} practice test, ${certId} exam questions 2025, ${data.en} chapter ${chapter} quiz, ${certId} questions answers${free ? ' free' : ''}, aws exam practice online 2025`,
  };
}

function questionMeta(certId: string, chapter: string, position: number, lang: Lang, enPath: string): PageMeta {
  const data = CERT_DATA[certId];
  const id = certId.toUpperCase();
  const canonical = lang === 'en'
    ? `${BASE_URL}/cert/${certId}/chapter/${chapter}/question/${position}`
    : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}/question/${position}`;
  if (lang === 'ja') return {
    lang, canonical, enPath, ogType: 'article',
    title: `Q${position} | AWS ${id} 第${chapter}章 練習問題 — ${data.ja}`,
    description: `AWS ${id}（${data.ja}）第${chapter}章 Q${position}の練習問題。解説付きで本番形式で学習。`,
    keywords: `AWS ${id},${certId},第${chapter}章,Q${position},練習問題,AWS試験対策,無料,2025年`,
  };
  if (lang === 'zh') return {
    lang, canonical, enPath, ogType: 'article',
    title: `Q${position} | AWS ${id} 第${chapter}章 练习题 — ${data.zh}`,
    description: `AWS ${id}（${data.zh}）第${chapter}章 Q${position}练习题，含详细解析。`,
    keywords: `AWS ${id},${certId},第${chapter}章,Q${position},练习题,AWS备考,免费,2025`,
  };
  return {
    lang, canonical, enPath, ogType: 'article',
    title: `Q${position} | AWS ${id} Chapter ${chapter} Practice — ${data.en}`,
    description: `AWS ${id} (${data.en}) Chapter ${chapter} Question ${position} with detailed explanation. Free AWS exam prep 2025.`,
    keywords: `AWS ${id} chapter ${chapter} question ${position}, ${certId} practice test free 2025, ${certId} exam question, ${data.en}`,
  };
}

// ─── URL parser ───────────────────────────────────────────────────────────────

function parsePath(urlPath: string): { lang: Lang; rest: string } {
  const path = urlPath.split('?')[0];
  if (path.startsWith('/ja')) return { lang: 'ja', rest: path.slice(3) || '/' };
  if (path.startsWith('/zh')) return { lang: 'zh', rest: path.slice(3) || '/' };
  return { lang: 'en', rest: path };
}

export function getMetaForUrl(urlPath: string): PageMeta {
  const { lang, rest } = parsePath(urlPath);
  const enPath = rest || '/';

  if (rest === '/' || rest === '') return homeMeta(lang, enPath);

  const certMatch = rest.match(/^\/cert\/([a-z0-9-]+)$/);
  if (certMatch) {
    const certId = certMatch[1];
    if (CERT_DATA[certId]) return certMeta(certId, lang, enPath);
  }

  const chapterMatch = rest.match(/^\/cert\/([a-z0-9-]+)\/chapter\/(\d+)$/);
  if (chapterMatch) {
    const certId = chapterMatch[1];
    const chapter = chapterMatch[2];
    if (CERT_DATA[certId]) return chapterMeta(certId, chapter, lang, enPath);
  }

  const questionMatch = rest.match(/^\/cert\/([a-z0-9-]+)\/chapter\/(\d+)\/question\/(\d+)$/);
  if (questionMatch) {
    const certId = questionMatch[1];
    const chapter = questionMatch[2];
    const position = parseInt(questionMatch[3], 10);
    if (CERT_DATA[certId]) return questionMeta(certId, chapter, position, lang, enPath);
  }

  return homeMeta(lang, enPath);
}

// ─── HTML injection ───────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function injectMeta(html: string, meta: PageMeta): string {
  const t = esc(meta.title);
  const d = esc(meta.description);
  const k = esc(meta.keywords);

  const hreflangLinks = [
    `  <link rel="alternate" hreflang="en" href="${BASE_URL}${meta.enPath}" />`,
    `  <link rel="alternate" hreflang="ja" href="${BASE_URL}/ja${meta.enPath === '/' ? '/' : meta.enPath}" />`,
    `  <link rel="alternate" hreflang="zh" href="${BASE_URL}/zh${meta.enPath === '/' ? '/' : meta.enPath}" />`,
    `  <link rel="alternate" hreflang="x-default" href="${BASE_URL}${meta.enPath}" />`,
    `  <link rel="canonical" href="${esc(meta.canonical)}" />`,
  ].join('\n');

  return html
    .replace(/(<html[^>]*lang=")[^"]*"/, `$1${meta.lang}"`)
    .replace(/(<title>)[^<]*(<\/title>)/, `$1${t}$2`)
    .replace(/(<meta name="description"\s+content=")[^"]*"/, `$1${d}"`)
    .replace(/(<meta name="keywords"\s+content=")[^"]*"/, `$1${k}"`)
    .replace(/(<meta property="og:title"\s+content=")[^"]*"/, `$1${t}"`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*"/, `$1${d}"`)
    .replace(/(<meta property="og:url"\s+content=")[^"]*"/, `$1${esc(meta.canonical)}"`)
    .replace('</head>', `${hreflangLinks}\n</head>`);
}

export function injectQuestions(
  html: string,
  questions: Question[],
  lang: Lang,
  certId: string,
  chapter: number,
): string {
  if (!questions.length) return html;

  const data = CERT_DATA[certId];
  const id = certId.toUpperCase();
  const countLabel = lang === 'ja' ? `${questions.length}問`
    : lang === 'zh' ? `${questions.length}道`
    : `${questions.length} Questions`;
  const heading = lang === 'ja' ? `AWS ${id} 第${chapter}章 練習問題（${countLabel}）`
    : lang === 'zh' ? `AWS ${id} 第${chapter}章 练习题（${countLabel}）`
    : `AWS ${id} Chapter ${chapter} Practice Questions (${countLabel})`;
  const subheading = lang === 'ja' ? `AWS ${id}（${data?.ja ?? id}）第${chapter}章の本番形式の練習問題です。`
    : lang === 'zh' ? `以下是 AWS ${id}（${data?.zh ?? id}）第${chapter}章的练习题，模拟真实考试环境。`
    : `Practice questions for the AWS ${id} (${data?.en ?? id}) exam, Chapter ${chapter}.`;

  const langPath = lang === 'en' ? '' : `/${lang}`;
  const items = questions.map((q, i) => {
    const lq = (lang === 'ja' ? q.ja : lang === 'zh' ? q.zh : q.en) ?? q.en;
    if (!lq?.stem) return '';
    const optionHtml = lq.options
      ? Object.entries(lq.options)
          .map(([k, v]) => `        <li>${esc(k)}. ${esc(v)}</li>`)
          .join('\n')
      : '';
    const qUrl = `${langPath}/cert/${certId}/chapter/${chapter}/question/${i + 1}`;
    const viewLabel = lang === 'ja' ? 'この問題を見る →' : lang === 'zh' ? '查看题目 →' : 'View question →';
    return `    <li id="q${i + 1}">
      <p>Q${i + 1}. <a href="${qUrl}">${esc(lq.stem)}</a></p>${optionHtml ? `\n      <ul>\n${optionHtml}\n      </ul>` : ''}
      <p><a href="${qUrl}">${viewLabel}</a></p>
    </li>`;
  }).filter(Boolean).join('\n');

  const section = [
    `<section id="seo-questions">`,
    `  <h2>${esc(heading)}</h2>`,
    `  <p>${esc(subheading)}</p>`,
    `  <ol>`,
    items,
    `  </ol>`,
    `</section>`,
  ].join('\n');

  return html.replace('</body>', `${section}\n</body>`);
}

// ─── JSON-LD structured data ──────────────────────────────────────────────────

export function injectJsonLd(html: string, data: object): string {
  const script = `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  return html.replace('</head>', `${script}\n</head>`);
}

export function buildHomeJsonLd(lang: Lang): object {
  const name = lang === 'ja' ? 'AWS認定試験 練習問題' : lang === 'zh' ? 'AWS认证考试练习题' : 'AWS Exam Practice';
  const desc = lang === 'ja'
    ? 'AWS認定試験11種の無料練習問題集。7,400問以上、解説付き。SAA-C03・SAP-C02・CLF-C02など。'
    : lang === 'zh'
    ? 'AWS认证考试11种免费练习题集，7,400+道题，含解析。SAA-C03、SAP-C02、CLF-C02等。'
    : 'Free AWS certification exam practice questions. 11 certifications, 7,400+ questions with explanations. SAA-C03, SAP-C02, CLF-C02, DVA-C02 and more.';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': name,
    'url': lang === 'en' ? `${BASE_URL}/` : `${BASE_URL}/${lang}/`,
    'description': desc,
    'inLanguage': lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US',
  };
}

export function buildCertJsonLd(certId: string, lang: Lang): object | null {
  const data = CERT_DATA[certId];
  if (!data) return null;
  const id = certId.toUpperCase();
  const url = lang === 'en' ? `${BASE_URL}/cert/${certId}` : `${BASE_URL}/${lang}/cert/${certId}`;
  const name = lang === 'ja' ? `AWS ${id} ${data.ja} 練習問題`
    : lang === 'zh' ? `AWS ${id} ${data.zh} 练习题`
    : `AWS ${id} ${data.en} Practice Test`;
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'name': name,
    'url': url,
    'provider': { '@type': 'Organization', 'name': 'AWS Exam Practice', 'url': BASE_URL },
    'inLanguage': lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US',
    'isAccessibleForFree': data.free,
    'educationalLevel': 'Professional',
    'teaches': `AWS ${id} ${data.en} Certification`,
  };
}

export function buildBreadcrumbJsonLd(lang: Lang, certId?: string, chapter?: number, questionPosition?: number): object | null {
  const homeUrl = lang === 'en' ? `${BASE_URL}/` : `${BASE_URL}/${lang}/`;
  const homeName = lang === 'ja' ? 'AWS認定試験 練習問題' : lang === 'zh' ? 'AWS认证练习题' : 'AWS Exam Practice';
  const items: object[] = [
    { '@type': 'ListItem', 'position': 1, 'name': homeName, 'item': homeUrl },
  ];
  if (certId) {
    const data = CERT_DATA[certId];
    if (!data) return null;
    const certUrl = lang === 'en' ? `${BASE_URL}/cert/${certId}` : `${BASE_URL}/${lang}/cert/${certId}`;
    const certName = lang === 'ja' ? `${certId.toUpperCase()} ${data.ja}`
      : lang === 'zh' ? `${certId.toUpperCase()} ${data.zh}`
      : `${certId.toUpperCase()} ${data.en}`;
    items.push({ '@type': 'ListItem', 'position': 2, 'name': certName, 'item': certUrl });
    if (chapter != null) {
      const chapterUrl = lang === 'en'
        ? `${BASE_URL}/cert/${certId}/chapter/${chapter}`
        : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}`;
      const chapterName = lang === 'ja' ? `第${chapter}章` : lang === 'zh' ? `第${chapter}章` : `Chapter ${chapter}`;
      items.push({ '@type': 'ListItem', 'position': 3, 'name': chapterName, 'item': chapterUrl });
      if (questionPosition != null) {
        const qUrl = lang === 'en'
          ? `${BASE_URL}/cert/${certId}/chapter/${chapter}/question/${questionPosition}`
          : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}/question/${questionPosition}`;
        items.push({ '@type': 'ListItem', 'position': 4, 'name': `Q${questionPosition}`, 'item': qUrl });
      }
    }
  }
  if (items.length < 2) return null;
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': items };
}

export function buildChapterJsonLd(certId: string, chapter: number, lang: Lang, questions: Question[]): object | null {
  const data = CERT_DATA[certId];
  if (!data) return null;
  const id = certId.toUpperCase();
  const url = lang === 'en'
    ? `${BASE_URL}/cert/${certId}/chapter/${chapter}`
    : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}`;
  const name = lang === 'ja' ? `AWS ${id} 第${chapter}章 練習問題`
    : lang === 'zh' ? `AWS ${id} 第${chapter}章 练习题`
    : `AWS ${id} Chapter ${chapter} Practice Quiz`;

  const hasPart = questions.slice(0, 10).map((q) => {
    const lq = (lang === 'ja' ? q.ja : lang === 'zh' ? q.zh : q.en) ?? q.en;
    if (!lq?.stem) return null;

    const isMultiple = (q.correct_answers?.length ?? 0) > 1;
    const part: Record<string, unknown> = {
      '@type': 'Question',
      'eduQuestionType': isMultiple ? 'Checkboxes' : 'Multiple choice',
      'text': lq.stem,
    };

    if (lq.options && Object.keys(lq.options).length > 0) {
      part['suggestedAnswer'] = Object.entries(lq.options).map(([k, v]) => ({
        '@type': 'Answer',
        'text': `${k}. ${v}`,
      }));

      const accepted = (q.correct_answers ?? [])
        .map((k) => lq.options && lq.options[k] ? { '@type': 'Answer', 'text': `${k}. ${lq.options[k]}` } : null)
        .filter((a): a is { '@type': string; text: string } => a !== null);
      if (accepted.length === 1) {
        part['acceptedAnswer'] = accepted[0];
      } else if (accepted.length > 1) {
        part['acceptedAnswer'] = accepted;
      }
    }
    return part;
  }).filter((p): p is Record<string, unknown> => p !== null);

  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'learningResourceType': 'Practice problem',
    'name': name,
    'about': { '@type': 'Thing', 'name': `AWS ${id} ${data.en}` },
    'url': url,
    'inLanguage': lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US',
    'isAccessibleForFree': true,
    'educationalLevel': 'Professional',
    'hasPart': hasPart,
  };
}

// ─── Individual question page helpers ─────────────────────────────────────────

export function buildQuestionMeta(
  certId: string,
  chapter: number,
  position: number,
  q: Question,
  lang: Lang,
): PageMeta {
  const data = CERT_DATA[certId];
  const id = certId.toUpperCase();
  const lq = (lang === 'ja' ? q.ja : lang === 'zh' ? q.zh : q.en) ?? q.en;
  const stem = lq?.stem ?? '';
  const shortStem = stem.length > 70 ? stem.slice(0, 70) + '…' : stem;
  const canonical = lang === 'en'
    ? `${BASE_URL}/cert/${certId}/chapter/${chapter}/question/${position}`
    : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}/question/${position}`;
  const enPath = `/cert/${certId}/chapter/${chapter}/question/${position}`;

  const correctKeys = q.correct_answers ?? [];
  const correctText = lq?.options
    ? correctKeys.map(k => `${k}. ${lq!.options![k]}`).join(', ')
    : correctKeys.join(', ');
  const snippet = lq?.analysis
    ? (lq.analysis.length > 130 ? lq.analysis.slice(0, 130) + '…' : lq.analysis)
    : '';

  if (lang === 'ja') return {
    lang, canonical, enPath, ogType: 'article',
    title: `Q${position}: ${shortStem} | AWS ${id} 第${chapter}章`,
    description: `${stem} 正解: ${correctText}。${snippet}`,
    keywords: `AWS ${id},${certId},第${chapter}章,Q${position},練習問題,AWS試験対策,無料,2025年`,
  };
  if (lang === 'zh') return {
    lang, canonical, enPath, ogType: 'article',
    title: `Q${position}: ${shortStem} | AWS ${id} 第${chapter}章`,
    description: `${stem} 正确答案: ${correctText}。${snippet}`,
    keywords: `AWS ${id},${certId},第${chapter}章,Q${position},练习题,AWS备考,免费,2025`,
  };
  return {
    lang, canonical, enPath, ogType: 'article',
    title: `Q${position}: ${shortStem} | AWS ${id} Ch.${chapter} Practice`,
    description: `${stem} Correct answer: ${correctText}. ${snippet}`,
    keywords: `AWS ${id} Q${position} chapter ${chapter}, ${certId} practice test free 2025, ${certId} exam question, ${data?.en ?? id}`,
  };
}

export function buildSingleQuestionJsonLd(
  certId: string,
  chapter: number,
  position: number,
  q: Question,
  lang: Lang,
): object | null {
  const data = CERT_DATA[certId];
  if (!data) return null;
  const id = certId.toUpperCase();
  const lq = (lang === 'ja' ? q.ja : lang === 'zh' ? q.zh : q.en) ?? q.en;
  if (!lq?.stem) return null;

  const langPath = lang === 'en' ? '' : `/${lang}`;
  const url = `${BASE_URL}${langPath}/cert/${certId}/chapter/${chapter}/question/${position}`;

  const suggestedAnswer = lq.options
    ? Object.entries(lq.options).map(([k, v]) => ({ '@type': 'Answer', 'text': `${k}. ${v}` }))
    : [];

  const accepted = (q.correct_answers ?? [])
    .map(k => lq.options?.[k] ? { '@type': 'Answer', 'text': `${k}. ${lq.options![k]}` } : null)
    .filter((a): a is { '@type': string; text: string } => a !== null);

  const qObj: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Question',
    'name': lq.stem.slice(0, 110),
    'text': lq.stem,
    'url': url,
    'inLanguage': lang === 'ja' ? 'ja-JP' : lang === 'zh' ? 'zh-CN' : 'en-US',
    'about': { '@type': 'Thing', 'name': `AWS ${id} ${data.en}` },
  };

  if (suggestedAnswer.length) qObj['suggestedAnswer'] = suggestedAnswer;
  if (accepted.length === 1) qObj['acceptedAnswer'] = accepted[0];
  else if (accepted.length > 1) qObj['acceptedAnswer'] = accepted;

  return qObj;
}

export function injectSingleQuestion(
  html: string,
  q: Question,
  position: number,
  total: number,
  lang: Lang,
  certId: string,
  chapter: number,
): string {
  const data = CERT_DATA[certId];
  const id = certId.toUpperCase();
  const lq = (lang === 'ja' ? q.ja : lang === 'zh' ? q.zh : q.en) ?? q.en;
  if (!lq?.stem) return html;

  const langPath = lang === 'en' ? '' : `/${lang}`;
  const chapterPath = `${langPath}/cert/${certId}/chapter/${chapter}`;
  const prevPath = position > 1 ? `${langPath}/cert/${certId}/chapter/${chapter}/question/${position - 1}` : null;
  const nextPath = position < total ? `${langPath}/cert/${certId}/chapter/${chapter}/question/${position + 1}` : null;

  const optionsHtml = lq.options
    ? Object.entries(lq.options)
        .map(([k, v]) => {
          const correct = q.correct_answers?.includes(k) ? ' ✓' : '';
          return `      <li>${esc(k)}. ${esc(v)}${correct}</li>`;
        })
        .join('\n')
    : '';

  const correctText = (q.correct_answers ?? [])
    .map(k => lq.options?.[k] ? `${k}. ${lq.options![k]}` : k)
    .join(', ');

  const certLabel = lang === 'en' ? `AWS ${id} Ch.${chapter}` : `AWS ${id} 第${chapter}章`;
  const qLabel = lang === 'en' ? `Question ${position} of ${total}`
    : lang === 'zh' ? `第 ${position}/${total} 题` : `第 ${position}/${total} 問`;
  const answerLabel = lang === 'en' ? 'Correct Answer' : lang === 'zh' ? '正确答案' : '正解';
  const explLabel = lang === 'en' ? 'Explanation' : lang === 'zh' ? '解析' : '解説';
  const backLabel = lang === 'en' ? `← Chapter ${chapter}`
    : lang === 'zh' ? `← 返回第${chapter}章` : `← 第${chapter}章`;

  const parts = [
    `<article id="seo-questions">`,
    `  <h1>Q${position} — ${esc(certLabel)}</h1>`,
    `  <p>${esc(qLabel)} | <a href="${chapterPath}">${esc(backLabel)}</a></p>`,
    `  <p>${esc(lq.stem)}</p>`,
    lq.options ? `  <ul>\n${optionsHtml}\n  </ul>` : '',
    `  <h2>${esc(answerLabel)}: ${esc(correctText)}</h2>`,
    lq.analysis ? `  <h3>${esc(explLabel)}</h3>\n  <p>${esc(lq.analysis)}</p>` : '',
    `  <nav>`,
    prevPath ? `    <a href="${prevPath}">← Q${position - 1}</a>` : '',
    nextPath ? `    <a href="${nextPath}">Q${position + 1} →</a>` : '',
    `  </nav>`,
    `</article>`,
  ].filter(Boolean).join('\n');

  return html.replace('</body>', `${parts}\n</body>`);
}
