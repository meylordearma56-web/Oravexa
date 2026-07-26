const express = require("express");
const path = require("path");
const cors = require("cors");
const { marked } = require("marked");
const sanitizeHtml = require("sanitize-html");
const store = require("./store");

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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "oravexa" });
});

app.get("/api/stats", (_req, res) => {
  const db = store.load();
  res.json(store.stats(db));
});

app.get("/api/articles", (req, res) => {
  const db = store.load();
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 5000);
  const offset = parseInt(req.query.offset, 10) || 0;
  const sort = req.query.sort === "title" ? "title" : "updated";
  res.json(store.listArticles(db, { limit, offset, sort }));
});

app.get("/api/articles/random", (_req, res) => {
  const db = store.load();
  const article = store.randomArticle(db);
  if (!article) return res.status(404).json({ error: "No articles yet" });
  res.json(withHtml(article, db));
});

app.get("/api/search", (req, res) => {
  const db = store.load();
  const q = String(req.query.q || "");
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  res.json({ query: q, results: store.searchArticles(db, q, limit) });
});

app.get("/api/categories", (_req, res) => {
  const db = store.load();
  res.json(store.listCategories(db));
});

app.get("/api/categories/:name", (req, res) => {
  const db = store.load();
  const category = store.getCategory(db, req.params.name);
  if (!category) return res.status(404).json({ error: "Category not found" });
  res.json(category);
});

app.get("/api/recent", (req, res) => {
  const db = store.load();
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  res.json(store.recentChanges(db, limit));
});

app.get("/api/articles/:slug", (req, res) => {
  const db = store.load();
  const article = store.getArticle(db, req.params.slug);
  if (!article) return res.status(404).json({ error: "Article not found" });
  res.json(withHtml(article, db));
});

app.get("/api/articles/:slug/revisions", (req, res) => {
  const db = store.load();
  const revisions = store.getRevisions(db, req.params.slug);
  if (!revisions) return res.status(404).json({ error: "Article not found" });
  res.json(revisions);
});

app.get("/api/articles/:slug/revisions/:id", (req, res) => {
  const db = store.load();
  const revision = store.getRevision(db, req.params.slug, req.params.id);
  if (!revision) return res.status(404).json({ error: "Revision not found" });
  res.json({
    ...revision,
    html: wikiLinkify(renderMarkdown(revision.content), db),
    htmlEs: wikiLinkify(
      renderMarkdown(revision.contentEs || revision.content),
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
    } = req.body || {};
    if (content !== undefined && !String(content).trim()) {
      return res.status(400).json({ error: "Content cannot be empty" });
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

function boot() {
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
    // Clear require cache so reseed can run after code updates
    delete require.cache[require.resolve("./seed")];
    require("./seed");
  }

  app.listen(PORT, () => {
    console.log(`Oravexa running at http://localhost:${PORT}`);
  });
}

boot();
