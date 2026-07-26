/**
 * Procedural ~1,000,000-article catalog (grows weekly).
 * Curated articles stay in wiki.json; the rest are generated on demand
 * so we can expose a million pages without a multi-GB database.
 */

const { CATEGORY_ES, MAIN_CATEGORIES } = require("./generate-articles");
const { resolveArticleImage, imageAlt, primaryCategory } = require("./article-images");
const growth = require("./growth");

const TARGET_ARTICLES = 1_000_000;
const SLUG_PREFIX = "m";

const CATEGORIES = MAIN_CATEGORIES.slice();

function categorySlug(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function buildQuotas(total, categories) {
  const n = categories.length;
  const base = Math.floor(total / n);
  let remainder = total - base * n;
  const quotas = {};
  for (const category of categories) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) remainder -= 1;
    quotas[category] = base + extra;
  }
  return quotas;
}

/** Base quotas before weekly growth. */
const BASE_QUOTAS = buildQuotas(TARGET_ARTICLES, CATEGORIES);
/** @deprecated use categoryQuota() — kept for callers that expect QUOTAS */
const QUOTAS = BASE_QUOTAS;
const CATEGORY_BY_SLUG = Object.fromEntries(
  CATEGORIES.map((name) => [categorySlug(name), name])
);

const FIXED_CREATED = "2024-01-01T00:00:00.000Z";

function categoryQuota(name) {
  return (BASE_QUOTAS[name] || 0) + growth.bonusForCategory(name);
}

function syntheticSlug(category, index) {
  return `${SLUG_PREFIX}-${categorySlug(category)}-${index}`;
}

function parseSyntheticSlug(slug) {
  const match = String(slug || "").match(/^m-([a-z0-9-]+)-(\d+)$/i);
  if (!match) return null;
  const catSlug = match[1].toLowerCase();
  const index = parseInt(match[2], 10);
  const category = CATEGORY_BY_SLUG[catSlug];
  if (!category || !Number.isFinite(index) || index < 1) return null;
  if (index > categoryQuota(category)) return null;
  return { category, index, catSlug };
}

function isSyntheticSlug(slug) {
  return Boolean(parseSyntheticSlug(slug));
}

function topicBlurb(category, index) {
  return `a focused Oravexa encyclopedia entry on ${category.toLowerCase()} topic ${index}`;
}

function topicBlurbEs(category, index) {
  const catEs = CATEGORY_ES[category] || category;
  return `una entrada enfocada de la enciclopedia Oravexa sobre el tema ${index} de ${catEs.toLowerCase()}`;
}

function buildSyntheticArticle(category, index, { includeContent = false } = {}) {
  const catEs = CATEGORY_ES[category] || category;
  const title = `${category} entry ${index}`;
  const titleEs = `Entrada de ${catEs} ${index}`;
  const slug = syntheticSlug(category, index);
  const blurb = topicBlurb(category, index);
  const blurbEs = topicBlurbEs(category, index);
  const summary = `${title} is ${blurb}.`;
  const summaryEs = `${titleEs} es ${blurbEs}.`;
  const categories = [category];
  const image = resolveArticleImage({ slug, title, categories });
  const article = {
    slug,
    title,
    titleEs,
    summary,
    summaryEs,
    categories,
    categoriesEs: [catEs],
    author: "Oravexa",
    createdAt: FIXED_CREATED,
    updatedAt: FIXED_CREATED,
    revisionCount: 1,
    revisionIds: [`${slug}-r0`],
    image,
    imageAlt: imageAlt(title, primaryCategory(categories)),
    synthetic: true,
  };

  if (includeContent) {
    const catalogSize = totalArticles().toLocaleString("en-US");
    const catalogSizeEs = totalArticles().toLocaleString("es-ES");
    article.content = `# ${title}

**${title}** is ${blurb}.

## Overview

This Oravexa article is one of ${catalogSize} encyclopedia entries. It introduces ${title}, why it matters, and how it connects to ${category}.

## Key points

- ${title} belongs to the ${category} collection on Oravexa.
- Readers can explore neighboring entries across the growing Oravexa catalog.
- Editors can expand this page at any time.

## See also

Browse more pages in the ${category} category.
`;
    article.contentEs = `# ${titleEs}

**${titleEs}** es ${blurbEs}.

## Descripción general

Este artículo de Oravexa forma parte de un catálogo de ${catalogSizeEs} entradas. Presenta ${titleEs}, por qué importa y cómo se conecta con ${catEs}.

## Puntos clave

- ${titleEs} pertenece a la colección de ${catEs} en Oravexa.
- Los lectores pueden explorar entradas vecinas en el catálogo creciente de Oravexa.
- Los editores pueden ampliar esta página en cualquier momento.

## Véase también

Explora más páginas de la categoría ${catEs}.
`;
  }

  return article;
}

function getBySlug(slug, { includeContent = false } = {}) {
  const parsed = parseSyntheticSlug(slug);
  if (!parsed) return null;
  return buildSyntheticArticle(parsed.category, parsed.index, { includeContent });
}

function totalArticles() {
  return TARGET_ARTICLES + growth.totalBonus();
}

function listCategories() {
  return CATEGORIES.map((name) => ({
    name,
    slug: categorySlug(name),
    count: categoryQuota(name),
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function resolveCategoryName(raw) {
  const value = decodeURIComponent(String(raw || "")).trim();
  const lower = value.toLowerCase();
  const asSlug = lower.replace(/\s+/g, "-");
  if (CATEGORY_BY_SLUG[asSlug]) return CATEGORY_BY_SLUG[asSlug];
  const direct = CATEGORIES.find((c) => c.toLowerCase() === lower);
  if (direct) return direct;
  // Spanish names
  for (const [en, es] of Object.entries(CATEGORY_ES)) {
    if (String(es).toLowerCase() === lower) return en;
    if (categorySlug(es) === asSlug) return en;
  }
  return null;
}

function listCategoryArticles(categoryName, { limit = 50, offset = 0 } = {}) {
  const category = CATEGORIES.includes(categoryName)
    ? categoryName
    : resolveCategoryName(categoryName);
  if (!category) return null;
  const total = categoryQuota(category);
  const start = Math.max(0, offset);
  const end = Math.min(total, start + Math.max(0, limit));
  const articles = [];
  for (let i = start + 1; i <= end; i += 1) {
    articles.push(buildSyntheticArticle(category, i, { includeContent: false }));
  }
  return {
    name: category,
    slug: categorySlug(category),
    total,
    count: total,
    limit,
    offset: start,
    articles,
  };
}

function listArticles({ limit = 50, offset = 0, sort = "title" } = {}) {
  const total = totalArticles();
  const start = Math.max(0, offset);
  const size = Math.max(0, limit);
  const articles = [];

  // Walk categories in stable order for title-like listing.
  let skipped = 0;
  let taken = 0;
  for (const category of CATEGORIES) {
    const quota = categoryQuota(category);
    if (skipped + quota <= start) {
      skipped += quota;
      continue;
    }
    const localStart = Math.max(0, start - skipped);
    for (let i = localStart + 1; i <= quota && taken < size; i += 1) {
      articles.push(buildSyntheticArticle(category, i, { includeContent: false }));
      taken += 1;
    }
    skipped += quota;
    if (taken >= size) break;
  }

  if (sort === "updated") {
    // Synthetic catalog shares one timestamp; keep stable category order.
  }

  return { total, articles };
}

function randomArticle() {
  const total = totalArticles();
  const n = 1 + Math.floor(Math.random() * total);
  let remaining = n;
  for (const category of CATEGORIES) {
    const quota = categoryQuota(category);
    if (remaining <= quota) {
      return buildSyntheticArticle(category, remaining, { includeContent: true });
    }
    remaining -= quota;
  }
  return buildSyntheticArticle(CATEGORIES[0], 1, { includeContent: true });
}

function searchArticles(query, limit = 20) {
  const q = String(query || "").trim();
  if (!q) return [];
  const lower = q.toLowerCase();
  const results = [];

  // Match "Science entry 42" / "entry 42" / category name + number
  const numbered = lower.match(
    /^(?:([a-z][a-z\s-]*?)\s+)?(?:entry|entrada|tema|topic)\s+(\d+)$/i
  );
  if (numbered) {
    const maybeCat = (numbered[1] || "").trim();
    const index = parseInt(numbered[2], 10);
    const categories = maybeCat
      ? [resolveCategoryName(maybeCat)].filter(Boolean)
      : CATEGORIES;
    for (const category of categories) {
      if (index >= 1 && index <= categoryQuota(category)) {
        results.push(buildSyntheticArticle(category, index));
        if (results.length >= limit) return results;
      }
    }
  }

  // Match category name alone → first entries
  const asCategory = resolveCategoryName(lower);
  if (asCategory) {
    for (let i = 1; i <= Math.min(categoryQuota(asCategory), limit); i += 1) {
      results.push(buildSyntheticArticle(asCategory, i));
    }
    return results.slice(0, limit);
  }

  // Match synthetic slug
  const bySlug = getBySlug(lower.replace(/\s+/g, "-"));
  if (bySlug) results.push(bySlug);

  // Loose contains on category labels
  for (const category of CATEGORIES) {
    const catEs = CATEGORY_ES[category] || category;
    if (
      category.toLowerCase().includes(lower) ||
      String(catEs).toLowerCase().includes(lower)
    ) {
      for (let i = 1; i <= Math.min(8, categoryQuota(category)); i += 1) {
        results.push(buildSyntheticArticle(category, i));
        if (results.length >= limit) return results.slice(0, limit);
      }
    }
  }

  return results.slice(0, limit);
}

function initialRevision(article) {
  return {
    id: `${article.slug}-r0`,
    slug: article.slug,
    title: article.title,
    titleEs: article.titleEs,
    content: article.content,
    contentEs: article.contentEs,
    categories: article.categories,
    categoriesEs: article.categoriesEs,
    author: article.author,
    summary: "Catalog entry",
    createdAt: article.createdAt,
  };
}

module.exports = {
  TARGET_ARTICLES,
  CATEGORIES,
  QUOTAS,
  BASE_QUOTAS,
  isSyntheticSlug,
  parseSyntheticSlug,
  getBySlug,
  totalArticles,
  categoryQuota,
  listCategories,
  listCategoryArticles,
  resolveCategoryName,
  listArticles,
  randomArticle,
  searchArticles,
  initialRevision,
  buildSyntheticArticle,
  syntheticSlug,
};
