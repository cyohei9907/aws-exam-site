const BASE_URL = 'https://aws.cyohei.net';

type Lang = 'en' | 'ja' | 'zh';

interface PageMeta {
  lang: Lang;
  title: string;
  description: string;
  keywords: string;
  ogType: string;
  canonical: string;
  enPath: string; // English path for hreflang x-default
}

// ─── Cert data ────────────────────────────────────────────────────────────────

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
  'scs-c02': { en: 'Security Specialty', ja: 'セキュリティ 専門知識', zh: '安全 专项认证', total: 286, free: false },
};

function fmtN(total: number, lang: Lang): string {
  return total.toLocaleString(lang === 'ja' ? 'ja-JP' : 'en-US');
}

// ─── Meta by page type + language ────────────────────────────────────────────

function homeMeta(lang: Lang, enPath: string): PageMeta {
  const canonical = lang === 'en' ? `${BASE_URL}/` : `${BASE_URL}/${lang}/`;
  if (lang === 'ja') return {
    lang, canonical, enPath, ogType: 'website',
    title: 'AWS認定試験 練習問題 無料 | SAA・SAP・CLF・DVA・DOP など11種類',
    description: 'AWS認定試験11種の無料練習問題集。SAA-C03・SAP-C02・CLF-C02・DVA-C02など7,441問以上。無料チャプターをブラウザで今すぐ解答・解説付き。iOSアプリで全問+AI解説。',
    keywords: 'AWS認定試験,SAA-C03,SAP-C02,CLF-C02,DVA-C02,練習問題,AWS資格,AWS試験対策,AWSダンプ,AWS問題集',
  };
  if (lang === 'zh') return {
    lang, canonical, enPath, ogType: 'website',
    title: 'AWS认证考试免费练习题 | SAA、SAP、CLF、DVA 等11种认证',
    description: 'AWS认证考试11种免费练习题集。SAA-C03、SAP-C02、CLF-C02、DVA-C02 等 7,441+ 道题，含解析。直接在浏览器练习，iOS App 解锁全部题目。',
    keywords: 'AWS认证,SAA-C03,SAP-C02,CLF-C02,DVA-C02,AWS练习题,AWS考试题库,AWS备考',
  };
  return { // English
    lang, canonical, enPath, ogType: 'website',
    title: 'AWS Certification Exam Practice — Free SAA, SAP, CLF, DVA Questions',
    description: 'Free AWS exam practice questions for SAA-C03, SAP-C02, CLF-C02, DVA-C02 and 7 more certifications. 7,441+ questions with detailed answers and explanations. Pass your AWS exam with confidence.',
    keywords: 'AWS exam, AWS certification, SAA-C03, SAP-C02, CLF-C02, DVA-C02, AWS practice questions, AWS exam dumps, solutions architect exam, cloud practitioner exam, AWS exam prep',
  };
}

function certMeta(certId: string, lang: Lang, enPath: string): PageMeta {
  const data = CERT_DATA[certId];
  const canonical = lang === 'en' ? `${BASE_URL}/cert/${certId}` : `${BASE_URL}/${lang}/cert/${certId}`;
  const n = fmtN(data.total, lang);
  const id = certId.toUpperCase();

  if (lang === 'ja') {
    const title = data.free
      ? `AWS ${id} ${data.ja} 練習問題 ${n}問 | 無料チャプターあり`
      : `AWS ${id} ${data.ja} 練習問題 ${n}問 | iOSアプリで学習`;
    return {
      lang, canonical, enPath, ogType: 'website',
      title,
      description: data.free
        ? `AWS ${id}（${data.ja}）の練習問題 ${n}問。無料チャプターでブラウザからすぐ解答・解説付きで学習。iOSアプリで全問挑戦できます。`
        : `AWS ${id}（${data.ja}）の練習問題 ${n}問はiOSアプリ限定。AI解説・オフライン学習・進捗管理機能付き。`,
      keywords: `AWS ${id},${certId},${data.ja},練習問題,AWS資格,試験対策`,
    };
  }
  if (lang === 'zh') {
    const title = data.free
      ? `AWS ${id} ${data.zh} 练习题 ${n}道 | 含免费章节`
      : `AWS ${id} ${data.zh} 练习题 ${n}道 | iOS 应用专属`;
    return {
      lang, canonical, enPath, ogType: 'website',
      title,
      description: data.free
        ? `AWS ${id}（${data.zh}）练习题 ${n} 道，含免费章节，带解析，直接在浏览器练习。iOS App 解锁全部题目。`
        : `AWS ${id}（${data.zh}）练习题 ${n} 道，iOS App 专属，含 AI 解析、离线学习、进度追踪。`,
      keywords: `AWS ${id},${certId},${data.zh},AWS练习题,AWS备考`,
    };
  }
  // English
  const title = data.free
    ? `AWS ${id} Exam Practice — ${n} ${data.en} Questions & Answers`
    : `AWS ${id} Exam Practice — ${n} ${data.en} Questions (iOS App)`;
  return {
    lang, canonical, enPath, ogType: 'website',
    title,
    description: data.free
      ? `Free practice questions for AWS ${id} (${data.en}) exam. ${n} questions with detailed answers and explanations. ${fmtN(Math.ceil(data.total * 0.3 / 100) * 100, 'en')}+ free questions available online. Pass your AWS ${id} exam.`
      : `Practice questions for AWS ${id} (${data.en}) exam. ${n} questions with answers. Available in the iOS app with AI explanations and offline access.`,
    keywords: `AWS ${id}, ${certId}, ${data.en}, AWS exam, AWS certification exam, ${certId} dumps, ${certId} practice test, ${certId} questions, AWS exam prep`,
  };
}

function chapterMeta(certId: string, chapter: string, lang: Lang, enPath: string): PageMeta {
  const data = CERT_DATA[certId];
  const canonical = lang === 'en'
    ? `${BASE_URL}/cert/${certId}/chapter/${chapter}`
    : `${BASE_URL}/${lang}/cert/${certId}/chapter/${chapter}`;
  const id = certId.toUpperCase();

  if (lang === 'ja') return {
    lang, canonical, enPath, ogType: 'article',
    title: `AWS ${id} 第${chapter}章 練習問題 — ${data.ja} | AWS認定試験対策`,
    description: `AWS ${id}（${data.ja}）の第${chapter}章を本番形式で学習。全問に解説付きで苦手分野を克服。ブラウザ無料で今すぐ解答。`,
    keywords: `AWS ${id},${certId},第${chapter}章,練習問題,試験対策`,
  };
  if (lang === 'zh') return {
    lang, canonical, enPath, ogType: 'article',
    title: `AWS ${id} 第${chapter}章 练习题 — ${data.zh} | AWS认证备考`,
    description: `在线练习 AWS ${id}（${data.zh}）第${chapter}章题目，含详细解析，模拟真实考试环境，免费使用。`,
    keywords: `AWS ${id},${certId},第${chapter}章,练习题,AWS备考`,
  };
  return {
    lang, canonical, enPath, ogType: 'article',
    title: `AWS ${id} Chapter ${chapter} Practice Test — ${data.en} Exam Questions`,
    description: `Practice AWS ${id} (${data.en}) exam questions from Chapter ${chapter}. Free online quiz in real exam format with detailed answer explanations. Pass your AWS ${id} exam.`,
    keywords: `AWS ${id}, ${certId}, chapter ${chapter}, practice test, ${certId} exam questions, ${certId} dumps, AWS exam prep`,
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
