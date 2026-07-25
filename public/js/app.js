const app = document.getElementById("app");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchSuggest = document.getElementById("search-suggest");
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.querySelector(".main-nav");

let suggestTimer = null;

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [pathPart, queryPart = ""] = raw.split("?");
  const parts = pathPart.split("/").filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(queryPart));
  return { parts, params };
}

function setTitle(title) {
  document.title = title ? `${title} — WikiPedia` : "WikiPedia — The Free Encyclopedia";
}

function closeMobileNav() {
  mainNav.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function enhanceArticleHtml(html) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const headings = [...wrap.querySelectorAll("h2, h3")];
  const toc = [];

  headings.forEach((h, i) => {
    const id = h.id || `${slugifyHeading(h.textContent)}-${i}`;
    h.id = id;
    toc.push({
      id,
      text: h.textContent,
      level: h.tagName.toLowerCase(),
    });
  });

  return { html: wrap.innerHTML, toc };
}

function articleListHtml(articles) {
  if (!articles.length) {
    return `<div class="empty-state">No articles found.</div>`;
  }
  return `
    <ul class="article-list">
      ${articles
        .map(
          (a) => `
        <li>
          <a href="#/article/${escapeHtml(a.slug)}">
            <span class="title">${escapeHtml(a.title)}</span>
            <span class="summary">${escapeHtml(a.summary || "")}</span>
            <span class="meta-row">
              <span>Updated ${escapeHtml(formatDate(a.updatedAt))}</span>
              ${(a.categories || [])
                .map((c) => `<span class="pill">${escapeHtml(c)}</span>`)
                .join("")}
            </span>
          </a>
        </li>`
        )
        .join("")}
    </ul>
  `;
}

function categoryPills(categories = []) {
  return categories
    .map(
      (c) =>
        `<a class="pill" href="#/category/${encodeURIComponent(c.toLowerCase().replace(/\s+/g, "-"))}">${escapeHtml(c)}</a>`
    )
    .join("");
}

async function renderHome() {
  setTitle("");
  app.innerHTML = `<div class="loading">Opening the encyclopedia…</div>`;

  const [stats, recentArticles, recentChanges, categories] = await Promise.all([
    api("/api/stats"),
    api("/api/articles?limit=6&sort=updated"),
    api("/api/recent?limit=8"),
    api("/api/categories"),
  ]);

  app.innerHTML = `
    <section class="hero" aria-label="Welcome">
      <div class="hero-media" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="hero-brand">WikiPedia</p>
        <h1>Knowledge, written together.</h1>
        <p>A free encyclopedia you can read, search, and expand — article by article.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/article/wikipedia">Start reading</a>
          <a class="btn btn-secondary" href="#/create">Write an article</a>
        </div>
      </div>
    </section>

    <div class="stats-inline">
      <div><strong>${stats.articles}</strong> articles</div>
      <div><strong>${stats.categories}</strong> categories</div>
      <div><strong>${stats.revisions}</strong> revisions</div>
    </div>

    <div class="home-grid">
      <section class="section">
        <div class="section-head">
          <div>
            <h2>Recently updated</h2>
            <p>Fresh edits across the encyclopedia</p>
          </div>
          <a href="#/all">All pages</a>
        </div>
        ${articleListHtml(recentArticles.articles)}
      </section>

      <aside>
        <section class="section">
          <div class="section-head">
            <div>
              <h2>Recent changes</h2>
              <p>Latest revision activity</p>
            </div>
          </div>
          <ul class="article-list">
            ${recentChanges
              .map(
                (r) => `
              <li>
                <a href="#/article/${escapeHtml(r.slug)}/history">
                  <span class="title">${escapeHtml(r.title)}</span>
                  <span class="summary">${escapeHtml(r.summary)} · ${escapeHtml(r.author)}</span>
                  <span class="meta-row">${escapeHtml(formatDate(r.createdAt))}</span>
                </a>
              </li>`
              )
              .join("")}
          </ul>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>Categories</h2>
              <p>Browse by topic</p>
            </div>
            <a href="#/categories">View all</a>
          </div>
          <div class="category-cloud">
            ${categories
              .slice(0, 10)
              .map(
                (c) =>
                  `<a href="#/category/${encodeURIComponent(c.slug)}">${escapeHtml(c.name)} <span class="muted">(${c.count})</span></a>`
              )
              .join("")}
          </div>
        </section>
      </aside>
    </div>
  `;
}

async function renderArticle(slug) {
  app.innerHTML = `<div class="loading">Loading article…</div>`;
  try {
    const article = await api(`/api/articles/${encodeURIComponent(slug)}`);
    setTitle(article.title);
    const { html, toc } = enhanceArticleHtml(article.html);

    app.innerHTML = `
      <div class="article-toolbar">
        <a class="btn btn-secondary" href="#/edit/${escapeHtml(article.slug)}">Edit</a>
        <a class="btn btn-ghost" href="#/article/${escapeHtml(article.slug)}/history">History</a>
        <a class="btn btn-ghost" href="#/random">Random</a>
      </div>
      <div class="article-layout">
        <article>
          <h1 class="article-title">${escapeHtml(article.title)}</h1>
          <div class="article-meta meta-row">
            <span>By ${escapeHtml(article.author)}</span>
            <span>Updated ${escapeHtml(formatDate(article.updatedAt))}</span>
            <span>${article.revisionCount} revision${article.revisionCount === 1 ? "" : "s"}</span>
            ${categoryPills(article.categories)}
          </div>
          <div class="article-body">${html}</div>
        </article>
        <aside class="toc" aria-label="Table of contents">
          <h2>On this page</h2>
          ${
            toc.length
              ? `<ol>${toc
                  .map(
                    (t) =>
                      `<li style="padding-left:${t.level === "h3" ? "0.75rem" : "0"}"><a href="#${escapeHtml(t.id)}">${escapeHtml(t.text)}</a></li>`
                  )
                  .join("")}</ol>`
              : `<p class="muted">No sections yet.</p>`
          }
        </aside>
      </div>
    `;
  } catch {
    setTitle("Article not found");
    app.innerHTML = `
      <h1 class="page-title">Article not found</h1>
      <p class="page-lead">There is no page named “${escapeHtml(slug)}” yet.</p>
      <div class="form-actions">
        <a class="btn btn-primary" href="#/create?title=${encodeURIComponent(slug.replace(/-/g, " "))}">Create this article</a>
        <a class="btn btn-secondary" href="#/">Back home</a>
      </div>
    `;
  }
}

async function renderEdit(slug, params = {}) {
  app.innerHTML = `<div class="loading">Opening editor…</div>`;
  let article = null;
  if (slug) {
    try {
      article = await api(`/api/articles/${encodeURIComponent(slug)}`);
    } catch {
      app.innerHTML = `<div class="notice notice-error">Article not found.</div>`;
      return;
    }
  }

  const isNew = !article;
  const presetTitle = params.title || "";
  setTitle(isNew ? "Create article" : `Edit ${article.title}`);

  app.innerHTML = `
    <h1 class="page-title">${isNew ? "Create article" : `Edit “${escapeHtml(article.title)}”`}</h1>
    <p class="page-lead">Write in Markdown. Use [[Article Title]] for wiki links. Add an edit summary when updating.</p>
    <div id="form-message"></div>
    <form class="form-stack" id="article-form">
      <div class="form-field">
        <label for="title">Title</label>
        <input id="title" name="title" required value="${escapeHtml(article?.title || presetTitle)}" ${article ? "readonly" : ""} />
      </div>
      <div class="form-field">
        <label for="categories">Categories <span class="muted">(comma-separated)</span></label>
        <input id="categories" name="categories" value="${escapeHtml((article?.categories || []).join(", "))}" placeholder="Science, History" />
      </div>
      <div class="form-field">
        <label for="author">Your name</label>
        <input id="author" name="author" value="${escapeHtml(localStorage.getItem("wikiAuthor") || "")}" placeholder="Anonymous" />
      </div>
      <div class="form-field">
        <label for="content">Content (Markdown)</label>
        <textarea id="content" name="content" required placeholder="# Heading&#10;&#10;Start writing…">${escapeHtml(article?.content || "")}</textarea>
      </div>
      ${
        !isNew
          ? `<div class="form-field">
              <label for="summary">Edit summary</label>
              <input id="summary" name="summary" placeholder="What did you change?" />
            </div>`
          : ""
      }
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${isNew ? "Publish article" : "Save changes"}</button>
        ${!isNew ? `<a class="btn btn-ghost" href="#/article/${escapeHtml(slug)}">Cancel</a>` : `<a class="btn btn-ghost" href="#/">Cancel</a>`}
        ${!isNew ? `<button class="btn btn-danger" type="button" id="delete-btn">Delete</button>` : ""}
      </div>
    </form>
  `;

  const form = document.getElementById("article-form");
  const message = document.getElementById("form-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      title: String(fd.get("title") || "").trim(),
      content: String(fd.get("content") || "").trim(),
      categories: String(fd.get("categories") || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      author: String(fd.get("author") || "").trim() || "Anonymous",
      summary: String(fd.get("summary") || "").trim() || "Updated article",
    };

    localStorage.setItem("wikiAuthor", payload.author);
    message.innerHTML = "";

    try {
      const saved = isNew
        ? await api("/api/articles", { method: "POST", body: JSON.stringify(payload) })
        : await api(`/api/articles/${encodeURIComponent(slug)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
      location.hash = `#/article/${saved.slug}`;
    } catch (err) {
      message.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
    }
  });

  const deleteBtn = document.getElementById("delete-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm(`Delete “${article.title}” permanently?`)) return;
      try {
        await api(`/api/articles/${encodeURIComponent(slug)}`, { method: "DELETE" });
        location.hash = "#/";
      } catch (err) {
        message.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
      }
    });
  }
}

async function renderHistory(slug) {
  app.innerHTML = `<div class="loading">Loading history…</div>`;
  try {
    const [article, revisions] = await Promise.all([
      api(`/api/articles/${encodeURIComponent(slug)}`),
      api(`/api/articles/${encodeURIComponent(slug)}/revisions`),
    ]);
    setTitle(`History of ${article.title}`);

    app.innerHTML = `
      <div class="article-toolbar">
        <a class="btn btn-secondary" href="#/article/${escapeHtml(slug)}">Back to article</a>
        <a class="btn btn-ghost" href="#/edit/${escapeHtml(slug)}">Edit</a>
      </div>
      <h1 class="page-title">Revision history</h1>
      <p class="page-lead">Past versions of “${escapeHtml(article.title)}”. Restore any revision to make it current.</p>
      <ul class="revision-list">
        ${revisions
          .map(
            (r, idx) => `
          <li>
            <strong>${escapeHtml(formatDate(r.createdAt))}</strong>
            <span class="muted">${escapeHtml(r.author)} · ${escapeHtml(r.summary)}${idx === 0 ? " · current" : ""}</span>
            <div class="actions">
              <a class="btn btn-ghost" href="#/article/${escapeHtml(slug)}/revision/${escapeHtml(r.id)}">View</a>
              ${
                idx === 0
                  ? ""
                  : `<button class="btn btn-secondary" data-restore="${escapeHtml(r.id)}">Restore</button>`
              }
            </div>
          </li>`
          )
          .join("")}
      </ul>
    `;

    app.querySelectorAll("[data-restore]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-restore");
        const author = localStorage.getItem("wikiAuthor") || "Anonymous";
        if (!confirm("Restore this revision as the current article?")) return;
        try {
          await api(`/api/articles/${encodeURIComponent(slug)}/revisions/${id}/restore`, {
            method: "POST",
            body: JSON.stringify({ author }),
          });
          location.hash = `#/article/${slug}`;
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    app.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
  }
}

async function renderRevision(slug, id) {
  app.innerHTML = `<div class="loading">Loading revision…</div>`;
  try {
    const revision = await api(
      `/api/articles/${encodeURIComponent(slug)}/revisions/${encodeURIComponent(id)}`
    );
    setTitle(`Revision · ${revision.title}`);
    const { html } = enhanceArticleHtml(revision.html);

    app.innerHTML = `
      <div class="article-toolbar">
        <a class="btn btn-secondary" href="#/article/${escapeHtml(slug)}/history">Back to history</a>
        <button class="btn btn-primary" id="restore-this">Restore this revision</button>
      </div>
      <h1 class="article-title">${escapeHtml(revision.title)}</h1>
      <div class="article-meta meta-row">
        <span>${escapeHtml(revision.author)}</span>
        <span>${escapeHtml(formatDate(revision.createdAt))}</span>
        <span>${escapeHtml(revision.summary)}</span>
      </div>
      <div class="article-body">${html}</div>
    `;

    document.getElementById("restore-this").addEventListener("click", async () => {
      const author = localStorage.getItem("wikiAuthor") || "Anonymous";
      if (!confirm("Restore this revision as the current article?")) return;
      await api(`/api/articles/${encodeURIComponent(slug)}/revisions/${id}/restore`, {
        method: "POST",
        body: JSON.stringify({ author }),
      });
      location.hash = `#/article/${slug}`;
    });
  } catch (err) {
    app.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
  }
}

async function renderSearch(query) {
  setTitle(query ? `Search: ${query}` : "Search");
  app.innerHTML = `<div class="loading">Searching…</div>`;
  const data = await api(`/api/search?q=${encodeURIComponent(query || "")}`);

  app.innerHTML = `
    <h1 class="page-title">Search results</h1>
    <p class="page-lead">${
      query
        ? `${data.results.length} result${data.results.length === 1 ? "" : "s"} for “${escapeHtml(query)}”`
        : "Type a query in the search box above."
    }</p>
    ${articleListHtml(data.results)}
    ${
      query && !data.results.length
        ? `<div class="form-actions" style="margin-top:1rem">
            <a class="btn btn-primary" href="#/create?title=${encodeURIComponent(query)}">Create “${escapeHtml(query)}”</a>
          </div>`
        : ""
    }
  `;
}

async function renderAll() {
  setTitle("All pages");
  const data = await api("/api/articles?limit=200&sort=title");
  app.innerHTML = `
    <h1 class="page-title">All pages</h1>
    <p class="page-lead">${data.total} articles in the encyclopedia.</p>
    ${articleListHtml(data.articles)}
  `;
}

async function renderRecent() {
  setTitle("Recent changes");
  const changes = await api("/api/recent?limit=40");
  app.innerHTML = `
    <h1 class="page-title">Recent changes</h1>
    <p class="page-lead">The newest edits across WikiPedia.</p>
    <ul class="revision-list">
      ${changes
        .map(
          (r) => `
        <li>
          <a href="#/article/${escapeHtml(r.slug)}"><strong>${escapeHtml(r.title)}</strong></a>
          <span class="muted">${escapeHtml(r.summary)} · ${escapeHtml(r.author)} · ${escapeHtml(formatDate(r.createdAt))}</span>
        </li>`
        )
        .join("")}
    </ul>
  `;
}

async function renderCategories() {
  setTitle("Categories");
  const categories = await api("/api/categories");
  app.innerHTML = `
    <h1 class="page-title">Categories</h1>
    <p class="page-lead">Explore articles by topic.</p>
    <div class="category-cloud">
      ${categories
        .map(
          (c) =>
            `<a href="#/category/${encodeURIComponent(c.slug)}">${escapeHtml(c.name)} (${c.count})</a>`
        )
        .join("")}
    </div>
  `;
}

async function renderCategory(name) {
  app.innerHTML = `<div class="loading">Loading category…</div>`;
  try {
    const category = await api(`/api/categories/${encodeURIComponent(name)}`);
    setTitle(category.name);
    app.innerHTML = `
      <h1 class="page-title">${escapeHtml(category.name)}</h1>
      <p class="page-lead">${category.articles.length} article${category.articles.length === 1 ? "" : "s"} in this category.</p>
      ${articleListHtml(category.articles)}
    `;
  } catch (err) {
    app.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
  }
}

async function renderRandom() {
  app.innerHTML = `<div class="loading">Finding a random article…</div>`;
  const article = await api("/api/articles/random");
  location.replace(`#/article/${article.slug}`);
}

async function router() {
  closeMobileNav();
  searchSuggest.hidden = true;
  window.scrollTo(0, 0);

  const { parts, params } = parseHash();
  const [root, a, b, c] = parts;

  try {
    if (!root) return renderHome();
    if (root === "article" && a && b === "history") return renderHistory(a);
    if (root === "article" && a && b === "revision" && c) return renderRevision(a, c);
    if (root === "article" && a) return renderArticle(a);
    if (root === "edit" && a) return renderEdit(a, params);
    if (root === "create") return renderEdit(null, params);
    if (root === "search") return renderSearch(params.q || "");
    if (root === "all") return renderAll();
    if (root === "recent") return renderRecent();
    if (root === "categories") return renderCategories();
    if (root === "category" && a) return renderCategory(a);
    if (root === "random") return renderRandom();

    app.innerHTML = `
      <h1 class="page-title">Page not found</h1>
      <p class="page-lead">That route does not exist.</p>
      <a class="btn btn-primary" href="#/">Go home</a>
    `;
  } catch (err) {
    app.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : "#/search";
  searchSuggest.hidden = true;
});

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim();
  clearTimeout(suggestTimer);
  if (q.length < 2) {
    searchSuggest.hidden = true;
    return;
  }
  suggestTimer = setTimeout(async () => {
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
      if (!data.results.length) {
        searchSuggest.hidden = true;
        return;
      }
      searchSuggest.innerHTML = data.results
        .map(
          (r) => `
        <a href="#/article/${escapeHtml(r.slug)}">
          <span class="suggest-title">${escapeHtml(r.title)}</span>
          <span class="suggest-summary">${escapeHtml(r.summary || "")}</span>
        </a>`
        )
        .join("");
      searchSuggest.hidden = false;
    } catch {
      searchSuggest.hidden = true;
    }
  }, 180);
});

document.addEventListener("click", (e) => {
  if (!searchForm.contains(e.target)) {
    searchSuggest.hidden = true;
  }
});

navToggle.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

mainNav.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMobileNav();
});

window.addEventListener("hashchange", router);

if (!location.hash) {
  location.hash = "#/";
} else {
  router();
}
