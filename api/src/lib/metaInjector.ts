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

  const items = questions.map((q, i) => {
    const lq = (lang === 'ja' ? q.ja : lang === 'zh' ? q.zh : q.en) ?? q.en;
    if (!lq?.stem) return '';
    const optionHtml = lq.options
      ? Object.entries(lq.options)
          .map(([k, v]) => `        <li>${esc(k)}. ${esc(v)}</li>`)
          .join('\n')
      : '';
    return `    <li id="q${i + 1}">
      <p>Q${i + 1}. ${esc(lq.stem)}</p>${optionHtml ? `\n      <ul>\n${optionHtml}\n      </ul>` : ''}
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

export function buildBreadcrumbJsonLd(lang: Lang, certId?: string, chapter?: number): object | null {
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
