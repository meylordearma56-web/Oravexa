/**
 * Category-related cover images for Oravexa articles.
 * Uses stable Unsplash CDN URLs (crop + quality params).
 */

const IMAGE_PARAMS = "auto=format&fit=crop&w=1400&h=788&q=80";

function unsplash(photoId) {
  return `https://images.unsplash.com/${photoId}?${IMAGE_PARAMS}`;
}

const CATEGORY_IMAGES = {
  Art: [
    unsplash("photo-1541961017774-22349e4a1262"),
    unsplash("photo-1579783902614-a3fb3927b6a5"),
    unsplash("photo-1513364776144-60967b0f800f"),
    unsplash("photo-1460661419201-fd4cecdf8a8b"),
  ],
  Astronomy: [
    unsplash("photo-1446776811953-b23d57bd21aa"),
    unsplash("photo-1462331940025-496dfbfc7564"),
    unsplash("photo-1451187580459-43490279c0fa"),
    unsplash("photo-1419242902214-272b3f66ee7a"),
  ],
  Biology: [
    unsplash("photo-1530026405186-ed1f139313f8"),
    unsplash("photo-1576086213369-97a306d36557"),
    unsplash("photo-1559757175-0eb30cd8c063"),
    unsplash("photo-1532187863486-abf9dbad1b69"),
  ],
  Chemistry: [
    unsplash("photo-1532187863486-abf9dbad1b69"),
    unsplash("photo-1582719471384-894fbb16e074"),
    unsplash("photo-1603126857599-f6e157fa2fe6"),
    unsplash("photo-1554475901-4538ddfbccc2"),
  ],
  Computing: [
    unsplash("photo-1518770660439-4636190af475"),
    unsplash("photo-1555066931-4365d14bab8c"),
    unsplash("photo-1517694712202-14dd9538aa97"),
    unsplash("photo-1461749280684-dccba630e2f6"),
  ],
  Programming: [
    unsplash("photo-1461749280684-dccba630e2f6"),
    unsplash("photo-1517694712202-14dd9538aa97"),
    unsplash("photo-1555066931-4365d14bab8c"),
    unsplash("photo-1516321318423-f06f85e504b3"),
  ],
  Culture: [
    unsplash("photo-1529156069898-49953e39b3ac"),
    unsplash("photo-1492684223066-81342ee5ff30"),
    unsplash("photo-1514525253161-7a46d19cd819"),
    unsplash("photo-1507003211169-0a1dd7228f2d"),
  ],
  "Earth Science": [
    unsplash("photo-1446776653964-20c1d3a81b06"),
    unsplash("photo-1470071459604-3b5ec3a7fe05"),
    unsplash("photo-1506905925346-21bda4d32df4"),
    unsplash("photo-1464822759023-fed622ff2c3b"),
  ],
  Geography: [
    unsplash("photo-1524661135-423995f22d0b"),
    unsplash("photo-1526778548025-fa2f459cd5c1"),
    unsplash("photo-1488646953014-85cb44e25828"),
    unsplash("photo-1501785888041-af3ef285b470"),
  ],
  Health: [
    unsplash("photo-1576091160399-112ba8d25d1d"),
    unsplash("photo-1559757148-5c350d0d3c56"),
    unsplash("photo-1571019614242-c5c5dee9f50b"),
    unsplash("photo-1505751172876-fa1923c5c528"),
  ],
  History: [
    unsplash("photo-1461360228754-6e81c08f1555"),
    unsplash("photo-1553913861-c0fddf2619ee"),
    unsplash("photo-1548013146-72479768bada"),
    unsplash("photo-1529156069898-49953e39b3ac"),
  ],
  Literature: [
    unsplash("photo-1481627834876-b7833e8f5040"),
    unsplash("photo-1512820790803-83ca734da794"),
    unsplash("photo-1495446815901-a7297e633e8d"),
    unsplash("photo-1457369804613-52c61a468e7d"),
  ],
  Mathematics: [
    unsplash("photo-1635070041078-e363dbe005cb"),
    unsplash("photo-1509228468518-180dd4864904"),
    unsplash("photo-1596495577886-d920f1fb7238"),
    unsplash("photo-1518133910546-b6c2fb7d79e3"),
  ],
  Music: [
    unsplash("photo-1511379938547-c1f69419868d"),
    unsplash("photo-1493225457124-a3eb161ffa5f"),
    unsplash("photo-1514320291840-2e0a9bf2a9ae"),
    unsplash("photo-1470225620780-dba8ba36b745"),
  ],
  Philosophy: [
    unsplash("photo-14565130808af8-7fd43e8e23a0"),
    unsplash("photo-1507003211169-0a1dd7228f2d"),
    unsplash("photo-1481627834876-b7833e8f5040"),
    unsplash("photo-1434030216411-0b793f4b4173"),
  ],
  Politics: [
    unsplash("photo-1529107386315-e1a2ed48a620"),
    unsplash("photo-1541872703-74c5e44368f9"),
    unsplash("photo-1523292562811-8fa7962a78c8"),
    unsplash("photo-1555848962-6e79363ec58f"),
  ],
  Science: [
    unsplash("photo-1507413245164-6160d80970ea"),
    unsplash("photo-1532094349884-543bc11b234d"),
    unsplash("photo-1451187580459-43490279c0fa"),
    unsplash("photo-1582719471384-894fbb16e074"),
  ],
  Society: [
    unsplash("photo-1529156069898-49953e39b3ac"),
    unsplash("photo-1517048676732-d65bc937f952"),
    unsplash("photo-1469571486292-0ba58a3f068b"),
    unsplash("photo-1511632765486-a01980e36a1d"),
  ],
  Sports: [
    unsplash("photo-1461896836934-ffe607ba6851"),
    unsplash("photo-1579952363873-27f3bade9f55"),
    unsplash("photo-1517649763962-0cfe39ed9bd8"),
    unsplash("photo-1552674605-db6ffd4facb5"),
  ],
  Help: [
    unsplash("photo-14565130808af8-7fd43e8e23a0"),
    unsplash("photo-1481627834876-b7833e8f5040"),
    unsplash("photo-1434030216411-0b793f4b4173"),
  ],
  Meta: [
    unsplash("photo-1451187580459-43490279c0fa"),
    unsplash("photo-1481627834876-b7833e8f5040"),
  ],
  Encyclopedia: [
    unsplash("photo-1481627834876-b7833e8f5040"),
    unsplash("photo-1524995997944-a1ba2d63d43e"),
    unsplash("photo-1495446815901-a7297e633e8d"),
  ],
};

const DEFAULT_IMAGES = [
  unsplash("photo-1481627834876-b7833e8f5040"),
  unsplash("photo-14565130808af8-7fd43e8e23a0"),
  unsplash("photo-1524995997944-a1ba2d63d43e"),
  unsplash("photo-1507842217343-583bb7270b66"),
];

function hashString(input) {
  let hash = 0;
  const text = String(input || "");
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFrom(list, seed) {
  if (!list || !list.length) return DEFAULT_IMAGES[0];
  return list[hashString(seed) % list.length];
}

function primaryCategory(categories = []) {
  return categories.find((c) => CATEGORY_IMAGES[c]) || categories[0] || "";
}

function resolveArticleImage({ slug, title, categories = [], image } = {}) {
  if (image && String(image).trim()) {
    return String(image).trim();
  }
  const category = primaryCategory(categories);
  const pool = CATEGORY_IMAGES[category] || DEFAULT_IMAGES;
  return pickFrom(pool, slug || title || category);
}

function imageAlt(title, category) {
  const label = String(title || "Article").trim();
  const topic = String(category || "").trim();
  return topic ? `${label} — ${topic}` : label;
}

function attachImageFields(article) {
  if (!article) return article;
  const category = primaryCategory(article.categories || []);
  const image = resolveArticleImage(article);
  return {
    ...article,
    image,
    imageAlt: article.imageAlt || imageAlt(article.title, category),
  };
}

function ensureArticleImages(db) {
  let changed = 0;
  for (const article of Object.values(db.articles || {})) {
    const next = resolveArticleImage(article);
    const category = primaryCategory(article.categories || []);
    const alt = imageAlt(article.title, category);
    if (article.image !== next || article.imageAlt !== alt) {
      article.image = next;
      article.imageAlt = alt;
      changed += 1;
    }
  }
  return changed;
}

module.exports = {
  resolveArticleImage,
  imageAlt,
  attachImageFields,
  ensureArticleImages,
  primaryCategory,
};
