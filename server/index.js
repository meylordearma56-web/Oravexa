const express = require("express");
const path = require("path");
const cors = require("cors");
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");
const store = require("./store");
const auth = require("./auth");
const catalog = require("./mega-catalog");

const app = express();
const PORT = process.env.PORT || 3000;

marked.setOptions({
  gfm: true,
  breaks: true,
});

function renderMarkdown(content) {
  const raw = marked.parse(content || "");
  return sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "title"],
      a: ["href", "name", "target", "rel", "class"],
      "*": ["id", "class"],
    },
  });
}

function wikiLinkify(html, db) {
  const parts = String(html).split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi);
  return parts
    .map((part) => {
      if (/^<(pre|code)\b/i.test(part)) return part;
      return part.replace(
        /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
        (_, target, label) => {
          const title = target.trim();
          const text = (label || title).trim();
          const slug = store.slugify(title);
          const exists = Boolean(db.articles[slug]);
          const cls = exists ? "wiki-link" : "wiki-link missing";
          return `<a href="#/article/${encodeURIComponent(slug)}" class="${cls}" data-slug="${slug}">${text}</a>`;
        }
      );
    })
    .join("");
}

function withHtml(article, db) {
  return {
    ...article,
    html: wikiLinkify(renderMarkdown(article.content), db),
    htmlEs: wikiLinkify(
      renderMarkdown(article.contentEs || article.content),
      db
    ),
  };
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

const bootState = { ready: false, seeding: false };

app.get("/api/health", (_req, res) => {
  // Always 200 once the process is listening so Render never shows
  // plain "Not Found" during cold start / reseeding.
  res.status(200).json({
    ok: true,
    service: "oravexa",
    ready: bootState.ready,
    seeding: bootState.seeding,
  });
});

app.post("/api/auth/register", (req, res) => {
  try {
    const { username, password, displayName } = req.body || {};
    const result = auth.register({ username, password, displayName });
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = auth.login({ username, password });
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.post("/api/auth/owner", (req, res) => {
  try {
    const { code } = req.body || {};
    const result = auth.loginWithOwnerCode(code);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/api/auth/me", (req, res) => {
  const token = auth.extractToken(req);
  const session = auth.getSessionUser(token);
  if (!session) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json(session);
});

app.post("/api/auth/logout", (req, res) => {
  const token = auth.extractToken(req);
  auth.logout(token);
  res.json({ ok: true });
});

app.post("/api/auth/heartbeat", (req, res) => {
  try {
    const token = auth.extractToken(req);
    const result = auth.heartbeat(token);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

app.get("/api/owner/presence", (req, res) => {
  try {
    const token = auth.extractToken(req);
    const result = auth.getOnlinePresence(token);
    res.json(result);
  } catch (err) {
    const status = err.status || 401;
    res.status(status).json({ error: err.message });
  }
});

app.get("/api/stats", (_req, res) => {
  const db = store.load();
  const base = store.stats(db);
  res.json({
    ...base,
    articles: catalog.totalArticles(),
    curatedArticles: base.articles,
    catalogArticles: catalog.totalArticles(),
  });
});

app.get("/api/articles", (req, res) => {
  const db = store.load();
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 5000);
  const offset = parseInt(req.query.offset, 10) || 0;
  const sort = req.query.sort === "title" ? "title" : "updated";
  const curated = store.listArticles(db, { limit, offset, sort });

  // Home / recent views: prefer curated updates. Full catalog listing uses title sort.
  if (sort === "updated") {
    return res.json({
      total: catalog.totalArticles(),
      articles: curated.articles,
      curatedTotal: curated.total,
    });
  }

  if (offset < curated.total) {
    const curatedSlice = store.listArticles(db, { limit, offset, sort: "title" });
    const remaining = limit - curatedSlice.articles.length;
    if (remaining <= 0) {
      return res.json({
        total: catalog.totalArticles(),
        articles: curatedSlice.articles,
      });
    }
    const synthetic = catalog.listArticles({
      limit: remaining,
      offset: 0,
      sort: "title",
    });
    return res.json({
      total: catalog.totalArticles(),
      articles: [...curatedSlice.articles, ...synthetic.articles],
    });
  }

  const synthetic = catalog.listArticles({
    limit,
    offset: offset - curated.total,
    sort: "title",
  });
  res.json({
    total: catalog.totalArticles(),
    articles: synthetic.articles,
  });
});

app.get("/api/articles/random", (_req, res) => {
  const db = store.load();
  // Mostly surface the million-article catalog, with a small chance of curated pages.
  if (Math.random() < 0.02) {
    const curated = store.randomArticle(db);
    if (curated) return res.json(withHtml(curated, db));
  }
  const article = catalog.randomArticle();
  res.json(withHtml(article, db));
});

app.get("/api/search", (req, res) => {
  const db = store.load();
  const q = String(req.query.q || "");
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const synthetic = catalog.searchArticles(q, limit);
  const curated = store.searchArticles(db, q, limit);
  const seen = new Set();
  const merged = [];
  for (const article of [...synthetic, ...curated]) {
    if (!article || seen.has(article.slug)) continue;
    seen.add(article.slug);
    merged.push(article);
    if (merged.length >= limit) break;
  }
  res.json({ query: q, results: merged });
});

app.get("/api/categories", (_req, res) => {
  const db = store.load();
  const curated = store.listCategories(db);
  const mega = catalog.listCategories();
  const byName = new Map(mega.map((c) => [c.name, { ...c }]));
  for (const cat of curated) {
    if (byName.has(cat.name)) {
      // Keep the million-scale count for main categories.
      continue;
    }
    byName.set(cat.name, cat);
  }
  res.json([...byName.values()].sort((a, b) => a.name.localeCompare(b.name)));
});

app.get("/api/categories/:name", (req, res) => {
  const db = store.load();
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const offset = parseInt(req.query.offset, 10) || 0;
  const mega = catalog.listCategoryArticles(req.params.name, { limit, offset });
  if (mega) {
    return res.json(mega);
  }
  const category = store.getCategory(db, req.params.name);
  if (!category) return res.status(404).json({ error: "Category not found" });
  const articles = (category.articles || []).slice(offset, offset + limit);
  res.json({
    name: category.name,
    total: category.articles.length,
    count: category.articles.length,
    limit,
    offset,
    articles,
  });
});

app.get("/api/recent", (req, res) => {
  const db = store.load();
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  res.json(store.recentChanges(db, limit));
});

app.get("/api/articles/:slug", (req, res) => {
  const db = store.load();
  const article = store.getArticle(db, req.params.slug);
  if (article) return res.json(withHtml(article, db));
  const synthetic = catalog.getBySlug(req.params.slug, { includeContent: true });
  if (!synthetic) return res.status(404).json({ error: "Article not found" });
  res.json(withHtml(synthetic, db));
});

app.get("/api/articles/:slug/revisions", (req, res) => {
  const db = store.load();
  const revisions = store.getRevisions(db, req.params.slug);
  if (revisions) return res.json(revisions);
  const synthetic = catalog.getBySlug(req.params.slug, { includeContent: true });
  if (!synthetic) return res.status(404).json({ error: "Article not found" });
  res.json([catalog.initialRevision(synthetic)]);
});

app.get("/api/articles/:slug/revisions/:id", (req, res) => {
  const db = store.load();
  const revision = store.getRevision(db, req.params.slug, req.params.id);
  if (revision) {
    return res.json({
      ...revision,
      html: wikiLinkify(renderMarkdown(revision.content), db),
      htmlEs: wikiLinkify(
        renderMarkdown(revision.contentEs || revision.content),
        db
      ),
    });
  }
  const synthetic = catalog.getBySlug(req.params.slug, { includeContent: true });
  if (!synthetic || req.params.id !== `${synthetic.slug}-r0`) {
    return res.status(404).json({ error: "Revision not found" });
  }
  const initial = catalog.initialRevision(synthetic);
  res.json({
    ...initial,
    html: wikiLinkify(renderMarkdown(initial.content), db),
    htmlEs: wikiLinkify(
      renderMarkdown(initial.contentEs || initial.content),
      db
    ),
  });
});

app.post("/api/articles", (req, res) => {
  try {
    const db = store.load();
    const {
      title,
      content,
      categories,
      author,
      titleEs,
      contentEs,
      categoriesEs,
      image,
      imageAlt,
    } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: "Content is required" });
    }
    const article = store.createArticle(db, {
      title,
      content,
      categories,
      author,
      titleEs,
      contentEs,
      categoriesEs,
      image,
      imageAlt,
    });
    res.status(201).json(withHtml(article, db));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/articles/:slug", (req, res) => {
  try {
    const db = store.load();
    const {
      title,
      content,
      categories,
      author,
      summary,
      titleEs,
      contentEs,
      categoriesEs,
      image,
      imageAlt,
    } = req.body || {};
    if (content !== undefined && !String(content).trim()) {
      return res.status(400).json({ error: "Content cannot be empty" });
    }

    if (!db.articles[req.params.slug] && catalog.isSyntheticSlug(req.params.slug)) {
      const synthetic = catalog.getBySlug(req.params.slug, { includeContent: true });
      if (synthetic) {
        store.materializeArticle(db, synthetic);
      }
    }

    const article = store.updateArticle(db, req.params.slug, {
      title,
      content,
      categories,
      author,
      summary,
      titleEs,
      contentEs,
      categoriesEs,
      image,
      imageAlt,
    });
    res.json(withHtml(article, db));
  } catch (err) {
    const status = err.message === "Article not found" ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.post("/api/articles/:slug/revisions/:id/restore", (req, res) => {
  try {
    const db = store.load();
    const author = req.body?.author || "Anonymous";
    const article = store.restoreRevision(
      db,
      req.params.slug,
      req.params.id,
      author
    );
    res.json(withHtml(article, db));
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.delete("/api/articles/:slug", (req, res) => {
  try {
    const db = store.load();
    store.deleteArticle(db, req.params.slug);
    res.json({ ok: true });
  } catch (err) {
    const status = err.message === "Article not found" ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

app.get(["/", "/index.html"], (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

function initializeData() {
  bootState.seeding = true;
  try {
    const db = store.load();
    const count = Object.keys(db.articles).length;
    const cats = store.listCategories(db);
    const mainCats = cats.filter(
      (c) => !["Help", "Meta", "Programming", "Encyclopedia"].includes(c.name)
    );
    const needsSeed =
      count === 0 ||
      Boolean(db.articles.wikipedia) ||
      !db.articles.oravexa ||
      mainCats.some((c) => c.count < 100);
    if (needsSeed) {
      console.log("Seeding encyclopedia data…");
      // Clear require cache so reseed can run after code updates
      delete require.cache[require.resolve("./seed")];
      require("./seed");
    }

    const latest = store.load();
    const updated = store.ensureArticleImages(latest);
    if (updated > 0) {
      store.save(latest);
      console.log(`Assigned cover images to ${updated} articles`);
    }
    bootState.ready = true;
    console.log("Oravexa data ready");
  } catch (err) {
    console.error("Data initialization failed:", err);
    bootState.ready = false;
  } finally {
    bootState.seeding = false;
  }
}

function boot() {
  // Listen first. On Render's free tier the disk is ephemeral, so every
  // wake can reseed for a while — if we block listen(), browsers get
  // x-render-routing: no-server → plain "Not Found".
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Oravexa running at http://0.0.0.0:${PORT}`);
    setImmediate(initializeData);
  });
}

boot();
