const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const {
  resolveArticleImage,
  imageAlt,
  primaryCategory,
  ensureArticleImages,
} = require("./article-images");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "wiki.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultDb() {
  return {
    articles: {},
    revisions: {},
    categories: {},
    meta: {
      createdAt: new Date().toISOString(),
      articleCount: 0,
    },
  };
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(DB_PATH)) {
    const db = defaultDb();
    save(db);
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function save(db) {
  ensureDataDir();
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_PATH);
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeId() {
  return crypto.randomBytes(8).toString("hex");
}

function extractSummary(content) {
  const text = content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, t, label) => label || t)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 220) + (text.length > 220 ? "…" : "");
}

function upsertCategories(db, categories, slug) {
  for (const name of categories) {
    const key = name.toLowerCase();
    if (!db.categories[key]) {
      db.categories[key] = { name, articles: [] };
    }
    if (!db.categories[key].articles.includes(slug)) {
      db.categories[key].articles.push(slug);
    }
  }

  for (const key of Object.keys(db.categories)) {
    const cat = db.categories[key];
    if (!categories.map((c) => c.toLowerCase()).includes(key)) {
      cat.articles = cat.articles.filter((s) => s !== slug);
      if (cat.articles.length === 0) delete db.categories[key];
    }
  }
}

function listArticles(db, { limit = 50, offset = 0, sort = "updated" } = {}) {
  const items = Object.values(db.articles);
  items.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });
  return {
    total: items.length,
    articles: items.slice(offset, offset + limit).map(publicArticle),
  };
}

function publicArticle(article, includeContent = false) {
  const category = primaryCategory(article.categories || []);
  const image = resolveArticleImage(article);
  const base = {
    slug: article.slug,
    title: article.title,
    titleEs: article.titleEs || article.title,
    summary: article.summary,
    summaryEs: article.summaryEs || article.summary,
    categories: article.categories,
    categoriesEs: article.categoriesEs || article.categories,
    author: article.author,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    revisionCount: article.revisionIds.length,
    image,
    imageAlt: article.imageAlt || imageAlt(article.title, category),
  };
  if (includeContent) {
    base.content = article.content;
    base.contentEs = article.contentEs || article.content;
    base.revisionIds = article.revisionIds;
  }
  return base;
}

function getArticle(db, slug) {
  const article = db.articles[slug];
  if (!article) return null;
  return publicArticle(article, true);
}

function searchArticles(db, query, limit = 20) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  return Object.values(db.articles)
    .map((article) => {
      const title = article.title.toLowerCase();
      const titleEs = (article.titleEs || "").toLowerCase();
      const content = article.content.toLowerCase();
      const contentEs = (article.contentEs || "").toLowerCase();
      const cats = [
        ...article.categories,
        ...(article.categoriesEs || []),
      ]
        .join(" ")
        .toLowerCase();
      let score = 0;
      if (title === q || titleEs === q) score += 100;
      else if (title.startsWith(q) || titleEs.startsWith(q)) score += 60;
      else if (title.includes(q) || titleEs.includes(q)) score += 40;
      if (cats.includes(q)) score += 15;
      if (content.includes(q) || contentEs.includes(q)) score += 10;
      const words = q.split(/\s+/);
      for (const w of words) {
        if (title.includes(w) || titleEs.includes(w)) score += 5;
        if (content.includes(w) || contentEs.includes(w)) score += 2;
      }
      return { article, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .slice(0, limit)
    .map((r) => publicArticle(r.article));
}

function createArticle(
  db,
  {
    title,
    content,
    categories = [],
    author = "Anonymous",
    titleEs,
    contentEs,
    categoriesEs,
    image,
    imageAlt: imageAltText,
  },
  { deferSave = false } = {}
) {
  const slug = slugify(title);
  if (!slug) throw new Error("Title produces an empty slug");
  if (db.articles[slug]) throw new Error("An article with this title already exists");

  const now = new Date().toISOString();
  const revisionId = makeId();
  const nextContentEs = contentEs || content;
  const nextCategories = normalizeCategories(categories);
  const category = primaryCategory(nextCategories);
  const nextImage = resolveArticleImage({
    slug,
    title,
    categories: nextCategories,
    image,
  });
  const article = {
    slug,
    title: title.trim(),
    titleEs: (titleEs || title).trim(),
    content,
    contentEs: nextContentEs,
    summary: extractSummary(content),
    summaryEs: extractSummary(nextContentEs),
    categories: nextCategories,
    categoriesEs: normalizeCategories(categoriesEs || categories),
    author: author.trim() || "Anonymous",
    image: nextImage,
    imageAlt: String(imageAltText || imageAlt(title, category)).trim(),
    createdAt: now,
    updatedAt: now,
    revisionIds: [revisionId],
  };

  db.revisions[revisionId] = {
    id: revisionId,
    slug,
    title: article.title,
    titleEs: article.titleEs,
    content,
    contentEs: article.contentEs,
    categories: article.categories,
    categoriesEs: article.categoriesEs,
    author: article.author,
    image: article.image,
    imageAlt: article.imageAlt,
    summary: "Initial version",
    createdAt: now,
  };

  db.articles[slug] = article;
  upsertCategories(db, article.categories, slug);
  db.meta.articleCount = Object.keys(db.articles).length;
  if (!deferSave) save(db);
  return publicArticle(article, true);
}

function updateArticle(
  db,
  slug,
  {
    title,
    content,
    categories,
    author = "Anonymous",
    summary = "Updated article",
    titleEs,
    contentEs,
    categoriesEs,
    image,
    imageAlt: imageAltText,
  }
) {
  const article = db.articles[slug];
  if (!article) throw new Error("Article not found");

  const now = new Date().toISOString();
  const revisionId = makeId();
  const nextTitle = (title ?? article.title).trim();
  const nextTitleEs = (titleEs ?? article.titleEs ?? nextTitle).trim();
  const nextContent = content ?? article.content;
  const nextContentEs = contentEs ?? article.contentEs ?? nextContent;
  const nextCategories = categories
    ? normalizeCategories(categories)
    : article.categories;
  const nextCategoriesEs = categoriesEs
    ? normalizeCategories(categoriesEs)
    : article.categoriesEs || nextCategories;
  const category = primaryCategory(nextCategories);
  const nextImage =
    image !== undefined
      ? resolveArticleImage({
          slug,
          title: nextTitle,
          categories: nextCategories,
          image,
        })
      : resolveArticleImage({
          slug,
          title: nextTitle,
          categories: nextCategories,
          image: article.image,
        });
  const nextImageAlt =
    imageAltText !== undefined
      ? String(imageAltText || imageAlt(nextTitle, category)).trim()
      : article.imageAlt || imageAlt(nextTitle, category);

  db.revisions[revisionId] = {
    id: revisionId,
    slug,
    title: nextTitle,
    titleEs: nextTitleEs,
    content: nextContent,
    contentEs: nextContentEs,
    categories: nextCategories,
    categoriesEs: nextCategoriesEs,
    author: (author || "Anonymous").trim(),
    image: nextImage,
    imageAlt: nextImageAlt,
    summary: summary.trim() || "Updated article",
    createdAt: now,
  };

  article.title = nextTitle;
  article.titleEs = nextTitleEs;
  article.content = nextContent;
  article.contentEs = nextContentEs;
  article.summary = extractSummary(nextContent);
  article.summaryEs = extractSummary(nextContentEs);
  article.categories = nextCategories;
  article.categoriesEs = nextCategoriesEs;
  article.author = (author || "Anonymous").trim();
  article.image = nextImage;
  article.imageAlt = nextImageAlt;
  article.updatedAt = now;
  article.revisionIds.push(revisionId);

  upsertCategories(db, article.categories, slug);
  save(db);
  return publicArticle(article, true);
}

function deleteArticle(db, slug) {
  const article = db.articles[slug];
  if (!article) throw new Error("Article not found");

  for (const revId of article.revisionIds) {
    delete db.revisions[revId];
  }
  upsertCategories(db, [], slug);
  delete db.articles[slug];
  db.meta.articleCount = Object.keys(db.articles).length;
  save(db);
  return true;
}

function getRevisions(db, slug) {
  const article = db.articles[slug];
  if (!article) return null;
  return article.revisionIds
    .slice()
    .reverse()
    .map((id) => {
      const r = db.revisions[id];
      return {
        id: r.id,
        title: r.title,
        author: r.author,
        summary: r.summary,
        createdAt: r.createdAt,
        categories: r.categories,
      };
    });
}

function getRevision(db, slug, revisionId) {
  const article = db.articles[slug];
  if (!article || !article.revisionIds.includes(revisionId)) return null;
  return db.revisions[revisionId];
}

function restoreRevision(db, slug, revisionId, author = "Anonymous") {
  const revision = getRevision(db, slug, revisionId);
  if (!revision) throw new Error("Revision not found");
  return updateArticle(db, slug, {
    title: revision.title,
    titleEs: revision.titleEs,
    content: revision.content,
    contentEs: revision.contentEs,
    categories: revision.categories,
    categoriesEs: revision.categoriesEs,
    image: revision.image,
    imageAlt: revision.imageAlt,
    author,
    summary: `Restored revision from ${new Date(revision.createdAt).toLocaleString()}`,
  });
}

function listCategories(db) {
  return Object.values(db.categories)
    .map((c) => ({
      name: c.name,
      slug: c.name.toLowerCase().replace(/\s+/g, "-"),
      count: c.articles.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function getCategory(db, name) {
  const raw = decodeURIComponent(String(name || "")).toLowerCase();
  const key = raw.replace(/-/g, " ");
  let exact = db.categories[key] || db.categories[raw];

  if (!exact) {
    exact = Object.values(db.categories).find(
      (c) => c.name.toLowerCase().replace(/\s+/g, "-") === raw
    );
  }

  // Allow Spanish category names/slugs by matching categoriesEs on articles
  if (!exact) {
    for (const article of Object.values(db.articles)) {
      const idx = (article.categoriesEs || []).findIndex((c) => {
        const n = String(c).toLowerCase();
        return n === key || n.replace(/\s+/g, "-") === raw;
      });
      if (idx >= 0 && article.categories[idx]) {
        exact = db.categories[article.categories[idx].toLowerCase()];
        if (exact) break;
      }
    }
  }

  if (!exact) return null;
  return {
    name: exact.name,
    articles: exact.articles
      .map((s) => publicArticle(db.articles[s]))
      .filter(Boolean),
  };
}

function randomArticle(db) {
  const slugs = Object.keys(db.articles);
  if (!slugs.length) return null;
  const slug = slugs[Math.floor(Math.random() * slugs.length)];
  return publicArticle(db.articles[slug], true);
}

function recentChanges(db, limit = 20) {
  return Object.values(db.revisions)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      titleEs: r.titleEs || r.title,
      author: r.author,
      summary: r.summary,
      createdAt: r.createdAt,
    }));
}

function stats(db) {
  return {
    articles: Object.keys(db.articles).length,
    revisions: Object.keys(db.revisions).length,
    categories: Object.keys(db.categories).length,
  };
}

function materializeArticle(db, source) {
  if (!source || !source.slug) throw new Error("Invalid article");
  if (db.articles[source.slug]) return publicArticle(db.articles[source.slug], true);

  const now = new Date().toISOString();
  const revisionId = makeId();
  const categories = normalizeCategories(source.categories || []);
  const categoriesEs = normalizeCategories(
    source.categoriesEs || source.categories || []
  );
  const content = source.content || "";
  const contentEs = source.contentEs || content;
  const title = String(source.title || source.slug).trim();
  const article = {
    slug: source.slug,
    title,
    titleEs: String(source.titleEs || title).trim(),
    content,
    contentEs,
    summary: source.summary || extractSummary(content),
    summaryEs: source.summaryEs || extractSummary(contentEs),
    categories,
    categoriesEs,
    author: String(source.author || "Oravexa").trim() || "Oravexa",
    image: resolveArticleImage({
      slug: source.slug,
      title,
      categories,
      image: source.image,
    }),
    imageAlt:
      source.imageAlt || imageAlt(title, primaryCategory(categories)),
    createdAt: source.createdAt || now,
    updatedAt: now,
    revisionIds: [revisionId],
  };

  db.revisions[revisionId] = {
    id: revisionId,
    slug: article.slug,
    title: article.title,
    titleEs: article.titleEs,
    content: article.content,
    contentEs: article.contentEs,
    categories: article.categories,
    categoriesEs: article.categoriesEs,
    author: article.author,
    image: article.image,
    imageAlt: article.imageAlt,
    summary: "Materialized catalog entry",
    createdAt: now,
  };

  db.articles[article.slug] = article;
  upsertCategories(db, article.categories, article.slug);
  db.meta.articleCount = Object.keys(db.articles).length;
  save(db);
  return publicArticle(article, true);
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) {
    if (typeof categories === "string") {
      categories = categories.split(",").map((c) => c.trim());
    } else {
      categories = [];
    }
  }
  return [...new Set(categories.map((c) => c.trim()).filter(Boolean))];
}

module.exports = {
  load,
  save,
  slugify,
  listArticles,
  getArticle,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getRevisions,
  getRevision,
  restoreRevision,
  listCategories,
  getCategory,
  randomArticle,
  recentChanges,
  stats,
  ensureArticleImages,
  materializeArticle,
  DB_PATH,
};
