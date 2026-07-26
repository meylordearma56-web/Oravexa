const app = document.getElementById("app");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchSuggest = document.getElementById("search-suggest");
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.querySelector(".main-nav");
const themeToggle = document.getElementById("theme-toggle");
const langToggle = document.getElementById("lang-toggle");
const authNav = document.getElementById("auth-nav");
const I18n = window.OravexaI18n;

let suggestTimer = null;
let currentUser = null;
let sessionReady = false;

function t(key, vars) {
  return I18n.t(key, vars);
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function syncThemeToggle() {
  if (!themeToggle) return;
  const next = getTheme() === "dark" ? "light" : "dark";
  themeToggle.setAttribute(
    "aria-label",
    next === "dark" ? t("themeToDark") : t("themeToLight")
  );
  themeToggle.title =
    next === "dark" ? t("themeTitleDark") : t("themeTitleLight");
}

function setTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("oravexaTheme", next);
  localStorage.removeItem("wikiTheme");
  syncThemeToggle();
}

function syncLangToggle() {
  if (!langToggle) return;
  langToggle.textContent = t("langSwitch");
  langToggle.setAttribute("aria-label", t("langLabel"));
  langToggle.title = t("langLabel");
}

function applyChrome() {
  const lang = I18n.getLang();
  document.documentElement.setAttribute("lang", lang);

  const skip = document.querySelector(".skip-link");
  if (skip) skip.textContent = t("skip");

  const searchLabel = document.querySelector('label[for="search-input"]');
  if (searchLabel) searchLabel.textContent = t("searchLabel");
  if (searchInput) searchInput.placeholder = t("searchPlaceholder");

  const searchBtn = searchForm?.querySelector('button[type="submit"]');
  if (searchBtn) searchBtn.textContent = t("search");

  const navMap = [
    ["#/", "home"],
    ["#/random", "random"],
    ["#/create", "create"],
    ["#/recent", "recent"],
    ["#/categories", "categories"],
  ];
  for (const [href, key] of navMap) {
    const link = mainNav?.querySelector(`a[href="${href}"]`);
    if (link) link.textContent = t(key);
  }

  if (navToggle) navToggle.setAttribute("aria-label", t("openMenu"));

  const footer = document.querySelector(".footer-inner");
  if (footer) {
    footer.innerHTML = `
      <p><strong>Oravexa</strong> — ${escapeHtml(t("footerTagline"))}</p>
      <p class="muted">${escapeHtml(t("footerMeta"))}</p>
    `;
  }

  syncThemeToggle();
  syncLangToggle();
  renderAuthNav();
}

function renderAuthNav() {
  if (!authNav) return;
  if (!sessionReady) {
    authNav.innerHTML = "";
    return;
  }
  if (currentUser) {
    authNav.innerHTML = `
      <span class="auth-user" title="${escapeHtml(t("signedInAs", { name: currentUser.username }))}">
        ${escapeHtml(currentUser.username)}
      </span>
      <button type="button" class="btn btn-ghost auth-logout" id="logout-btn">${escapeHtml(t("logOut"))}</button>
    `;
    document.getElementById("logout-btn")?.addEventListener("click", async () => {
      try {
        await api("/api/auth/logout", { method: "POST" });
      } catch {
        /* still clear local session */
      }
      currentUser = null;
      renderAuthNav();
      if (/^#\/(login|signup)/.test(location.hash)) {
        location.hash = "#/";
      } else {
        router();
      }
    });
    return;
  }
  authNav.innerHTML = `
    <a href="#/login">${escapeHtml(t("signIn"))}</a>
    <a class="btn btn-secondary auth-signup" href="#/signup">${escapeHtml(t("signUp"))}</a>
  `;
}

async function refreshSession() {
  try {
    const data = await api("/api/auth/me");
    currentUser = data.user || null;
    if (currentUser) {
      localStorage.setItem("wikiAuthor", currentUser.username);
    }
  } catch {
    currentUser = null;
  } finally {
    sessionReady = true;
    renderAuthNav();
  }
  return currentUser;
}

function currentAuthor() {
  return currentUser?.username || localStorage.getItem("wikiAuthor") || "";
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    setTheme(getTheme() === "dark" ? "light" : "dark");
  });
}

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const next = I18n.getLang() === "es" ? "en" : "es";
    I18n.setLang(next);
    applyChrome();
    router();
  });
}

async function api(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(path, {
    credentials: "same-origin",
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(extraHeaders || {}),
    },
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
    return new Date(iso).toLocaleString(I18n.getLang() === "es" ? "es" : "en", {
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
  document.title = title
    ? `${title} — Oravexa`
    : `Oravexa — ${t("freeEncyclopedia")}`;
}

function closeMobileNav() {
  mainNav?.classList.remove("open");
  navToggle?.setAttribute("aria-expanded", "false");
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
    return `<div class="empty-state">${escapeHtml(t("noArticles"))}</div>`;
  }
  return `
    <ul class="article-list">
      ${articles
        .map((raw) => {
          const a = I18n.localizeArticle(raw);
          return `
        <li>
          <a href="#/article/${escapeHtml(a.slug)}">
            <span class="title">${escapeHtml(a.displayTitle)}</span>
            <span class="summary">${escapeHtml(a.displaySummary || "")}</span>
            <span class="meta-row">
              <span>${escapeHtml(t("updated"))} ${escapeHtml(formatDate(a.updatedAt))}</span>
              ${(a.displayCategories || [])
                .map((c) => `<span class="pill">${escapeHtml(c)}</span>`)
                .join("")}
            </span>
          </a>
        </li>`;
        })
        .join("")}
    </ul>
  `;
}

function categoryPills(categories = [], categoriesEs = []) {
  return categories
    .map((c, i) => {
      const label =
        I18n.getLang() === "es" ? categoriesEs[i] || I18n.categoryName(c) : c;
      const slug = c.toLowerCase().replace(/\s+/g, "-");
      return `<a class="pill" href="#/category/${encodeURIComponent(slug)}">${escapeHtml(label)}</a>`;
    })
    .join("");
}

async function renderHome() {
  setTitle("");
  app.innerHTML = `<div class="loading">${escapeHtml(t("opening"))}</div>`;

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
        <p class="hero-brand">Oravexa</p>
        <h1>${escapeHtml(t("heroHeadline"))}</h1>
        <p>${escapeHtml(t("heroLead"))}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/article/oravexa">${escapeHtml(t("startReading"))}</a>
          <a class="btn btn-secondary" href="#/create">${escapeHtml(t("writeArticle"))}</a>
        </div>
      </div>
    </section>

    <div class="stats-inline">
      <div><strong>${stats.articles}</strong> ${escapeHtml(t("articles"))}</div>
      <div><strong>${stats.categories}</strong> ${escapeHtml(t("categoriesCount"))}</div>
      <div><strong>${stats.revisions}</strong> ${escapeHtml(t("revisions"))}</div>
    </div>

    <div class="home-grid">
      <section class="section">
        <div class="section-head">
          <div>
            <h2>${escapeHtml(t("recentlyUpdated"))}</h2>
            <p>${escapeHtml(t("recentlyUpdatedLead"))}</p>
          </div>
          <a href="#/all">${escapeHtml(t("allPages"))}</a>
        </div>
        ${articleListHtml(recentArticles.articles)}
      </section>

      <aside>
        <section class="section">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(t("recentChanges"))}</h2>
              <p>${escapeHtml(t("recentChangesLead"))}</p>
            </div>
          </div>
          <ul class="article-list">
            ${recentChanges
              .map((r) => {
                const title =
                  I18n.getLang() === "es" ? r.titleEs || r.title : r.title;
                return `
              <li>
                <a href="#/article/${escapeHtml(r.slug)}/history">
                  <span class="title">${escapeHtml(title)}</span>
                  <span class="summary">${escapeHtml(r.summary)} · ${escapeHtml(r.author)}</span>
                  <span class="meta-row">${escapeHtml(formatDate(r.createdAt))}</span>
                </a>
              </li>`;
              })
              .join("")}
          </ul>
        </section>

        <section class="section">
          <div class="section-head">
            <div>
              <h2>${escapeHtml(t("categories"))}</h2>
              <p>${escapeHtml(t("browseByTopic"))}</p>
            </div>
            <a href="#/categories">${escapeHtml(t("viewAll"))}</a>
          </div>
          <div class="category-cloud">
            ${categories
              .slice(0, 10)
              .map(
                (c) =>
                  `<a href="#/category/${encodeURIComponent(c.slug)}">${escapeHtml(I18n.categoryName(c.name))} <span class="muted">(${c.count})</span></a>`
              )
              .join("")}
          </div>
        </section>
      </aside>
    </div>
  `;
}

async function renderArticle(slug) {
  app.innerHTML = `<div class="loading">${escapeHtml(t("loadingArticle"))}</div>`;
  try {
    const article = await api(`/api/articles/${encodeURIComponent(slug)}`);
    const localized = I18n.localizeArticle(article);
    setTitle(localized.displayTitle);
    const { html, toc } = enhanceArticleHtml(localized.displayHtml);

    app.innerHTML = `
      <div class="article-toolbar">
        <a class="btn btn-secondary" href="#/edit/${escapeHtml(article.slug)}">${escapeHtml(t("edit"))}</a>
        <a class="btn btn-ghost" href="#/article/${escapeHtml(article.slug)}/history">${escapeHtml(t("history"))}</a>
        <a class="btn btn-ghost" href="#/random">${escapeHtml(t("random"))}</a>
      </div>
      <div class="article-layout">
        <article>
          <h1 class="article-title">${escapeHtml(localized.displayTitle)}</h1>
          <div class="article-meta meta-row">
            <span>${escapeHtml(t("by"))} ${escapeHtml(article.author)}</span>
            <span>${escapeHtml(t("updated"))} ${escapeHtml(formatDate(article.updatedAt))}</span>
            <span>${article.revisionCount} ${escapeHtml(
              article.revisionCount === 1 ? t("revision") : t("revisionsWord")
            )}</span>
            ${categoryPills(article.categories, article.categoriesEs)}
          </div>
          <div class="article-body">${html}</div>
        </article>
        <aside class="toc" aria-label="${escapeHtml(t("onThisPage"))}">
          <h2>${escapeHtml(t("onThisPage"))}</h2>
          ${
            toc.length
              ? `<ol>${toc
                  .map(
                    (item) =>
                      `<li style="padding-left:${item.level === "h3" ? "0.75rem" : "0"}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`
                  )
                  .join("")}</ol>`
              : `<p class="muted">${escapeHtml(t("noSections"))}</p>`
          }
        </aside>
      </div>
    `;
  } catch {
    setTitle(t("notFoundTitle"));
    app.innerHTML = `
      <h1 class="page-title">${escapeHtml(t("notFoundTitle"))}</h1>
      <p class="page-lead">${escapeHtml(t("notFoundLead", { slug }))}</p>
      <div class="form-actions">
        <a class="btn btn-primary" href="#/create?title=${encodeURIComponent(slug.replace(/-/g, " "))}">${escapeHtml(t("createThis"))}</a>
        <a class="btn btn-secondary" href="#/">${escapeHtml(t("backHome"))}</a>
      </div>
    `;
  }
}

async function renderEdit(slug, params = {}) {
  app.innerHTML = `<div class="loading">${escapeHtml(t("loadingEditor"))}</div>`;
  let article = null;
  if (slug) {
    try {
      article = await api(`/api/articles/${encodeURIComponent(slug)}`);
    } catch {
      app.innerHTML = `<div class="notice notice-error">${escapeHtml(t("articleMissing"))}</div>`;
      return;
    }
  }

  const isNew = !article;
  const presetTitle = params.title || "";
  setTitle(isNew ? t("createArticle") : t("editArticle", { title: article.title }));

  app.innerHTML = `
    <h1 class="page-title">${
      isNew
        ? escapeHtml(t("createArticle"))
        : escapeHtml(t("editArticle", { title: article.title }))
    }</h1>
    <p class="page-lead">${escapeHtml(t("editorLead"))}</p>
    <div id="form-message"></div>
    <form class="form-stack" id="article-form">
      <div class="form-field">
        <label for="title">${escapeHtml(t("title"))}</label>
        <input id="title" name="title" required value="${escapeHtml(article?.title || presetTitle)}" ${article ? "readonly" : ""} />
      </div>
      <div class="form-field">
        <label for="titleEs">${escapeHtml(t("titleEs"))}</label>
        <input id="titleEs" name="titleEs" value="${escapeHtml(article?.titleEs || "")}" />
      </div>
      <div class="form-field">
        <label for="categories">${escapeHtml(t("categoriesLabel"))} <span class="muted">${escapeHtml(t("commaSeparated"))}</span></label>
        <input id="categories" name="categories" value="${escapeHtml((article?.categories || []).join(", "))}" placeholder="Science, History" />
      </div>
      <div class="form-field">
        <label for="categoriesEs">${escapeHtml(t("categoriesEs"))} <span class="muted">${escapeHtml(t("commaSeparated"))}</span></label>
        <input id="categoriesEs" name="categoriesEs" value="${escapeHtml((article?.categoriesEs || []).join(", "))}" />
      </div>
      <div class="form-field">
        <label for="author">${escapeHtml(t("yourName"))}</label>
        <input
          id="author"
          name="author"
          value="${escapeHtml(currentAuthor())}"
          placeholder="${escapeHtml(t("anonymous"))}"
          ${currentUser ? "readonly" : ""}
        />
        ${
          currentUser
            ? `<p class="muted form-hint">${escapeHtml(t("loggedInNotice", { name: currentUser.username }))}</p>`
            : `<p class="muted form-hint"><a href="#/login">${escapeHtml(t("signIn"))}</a> · <a href="#/signup">${escapeHtml(t("signUp"))}</a></p>`
        }
      </div>
      <div class="form-field">
        <label for="content">${escapeHtml(t("contentMd"))}</label>
        <textarea id="content" name="content" required placeholder="# Heading&#10;&#10;${escapeHtml(t("startWriting"))}">${escapeHtml(article?.content || "")}</textarea>
      </div>
      <div class="form-field">
        <label for="contentEs">${escapeHtml(t("contentEsMd"))}</label>
        <textarea id="contentEs" name="contentEs" placeholder="# Encabezado">${escapeHtml(article?.contentEs || "")}</textarea>
      </div>
      ${
        !isNew
          ? `<div class="form-field">
              <label for="summary">${escapeHtml(t("editSummary"))}</label>
              <input id="summary" name="summary" placeholder="${escapeHtml(t("editSummaryPh"))}" />
            </div>`
          : ""
      }
      <div class="form-actions">
        <button class="btn btn-primary" type="submit">${escapeHtml(isNew ? t("publish") : t("save"))}</button>
        ${
          !isNew
            ? `<a class="btn btn-ghost" href="#/article/${escapeHtml(slug)}">${escapeHtml(t("cancel"))}</a>`
            : `<a class="btn btn-ghost" href="#/">${escapeHtml(t("cancel"))}</a>`
        }
        ${
          !isNew
            ? `<button class="btn btn-danger" type="button" id="delete-btn">${escapeHtml(t("delete"))}</button>`
            : ""
        }
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
      titleEs: String(fd.get("titleEs") || "").trim(),
      content: String(fd.get("content") || "").trim(),
      contentEs: String(fd.get("contentEs") || "").trim(),
      categories: String(fd.get("categories") || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      categoriesEs: String(fd.get("categoriesEs") || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      author:
        currentUser?.username ||
        String(fd.get("author") || "").trim() ||
        t("anonymous"),
      summary: String(fd.get("summary") || "").trim() || "Updated article",
    };

    if (!currentUser) {
      localStorage.setItem("wikiAuthor", payload.author);
    }
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
      if (!confirm(t("deleteConfirm", { title: article.title }))) return;
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
  app.innerHTML = `<div class="loading">${escapeHtml(t("loadingHistory"))}</div>`;
  try {
    const [article, revisions] = await Promise.all([
      api(`/api/articles/${encodeURIComponent(slug)}`),
      api(`/api/articles/${encodeURIComponent(slug)}/revisions`),
    ]);
    const title =
      I18n.getLang() === "es" ? article.titleEs || article.title : article.title;
    setTitle(`${t("history")} · ${title}`);

    app.innerHTML = `
      <div class="article-toolbar">
        <a class="btn btn-secondary" href="#/article/${escapeHtml(slug)}">${escapeHtml(t("backToArticle"))}</a>
        <a class="btn btn-ghost" href="#/edit/${escapeHtml(slug)}">${escapeHtml(t("edit"))}</a>
      </div>
      <h1 class="page-title">${escapeHtml(t("revisionHistory"))}</h1>
      <p class="page-lead">${escapeHtml(t("revisionLead", { title }))}</p>
      <ul class="revision-list">
        ${revisions
          .map(
            (r, idx) => `
          <li>
            <strong>${escapeHtml(formatDate(r.createdAt))}</strong>
            <span class="muted">${escapeHtml(r.author)} · ${escapeHtml(r.summary)}${
              idx === 0 ? ` · ${escapeHtml(t("current"))}` : ""
            }</span>
            <div class="actions">
              <a class="btn btn-ghost" href="#/article/${escapeHtml(slug)}/revision/${escapeHtml(r.id)}">${escapeHtml(t("view"))}</a>
              ${
                idx === 0
                  ? ""
                  : `<button class="btn btn-secondary" data-restore="${escapeHtml(r.id)}">${escapeHtml(t("restore"))}</button>`
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
        const author = currentAuthor() || t("anonymous");
        if (!confirm(t("restoreConfirm"))) return;
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
  app.innerHTML = `<div class="loading">${escapeHtml(t("loadingRevision"))}</div>`;
  try {
    const revision = await api(
      `/api/articles/${encodeURIComponent(slug)}/revisions/${encodeURIComponent(id)}`
    );
    const title =
      I18n.getLang() === "es" ? revision.titleEs || revision.title : revision.title;
    const contentHtml =
      I18n.getLang() === "es"
        ? revision.htmlEs || revision.html
        : revision.html;
    setTitle(`${t("history")} · ${title}`);
    const { html } = enhanceArticleHtml(contentHtml);

    app.innerHTML = `
      <div class="article-toolbar">
        <a class="btn btn-secondary" href="#/article/${escapeHtml(slug)}/history">${escapeHtml(t("history"))}</a>
        <button class="btn btn-primary" id="restore-this">${escapeHtml(t("restoreThis"))}</button>
      </div>
      <h1 class="article-title">${escapeHtml(title)}</h1>
      <div class="article-meta meta-row">
        <span>${escapeHtml(revision.author)}</span>
        <span>${escapeHtml(formatDate(revision.createdAt))}</span>
        <span>${escapeHtml(revision.summary)}</span>
      </div>
      <div class="article-body">${html}</div>
    `;

    document.getElementById("restore-this").addEventListener("click", async () => {
      const author = currentAuthor() || t("anonymous");
      if (!confirm(t("restoreConfirm"))) return;
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
  setTitle(query ? `${t("search")}: ${query}` : t("search"));
  app.innerHTML = `<div class="loading">${escapeHtml(t("searching"))}</div>`;
  const data = await api(`/api/search?q=${encodeURIComponent(query || "")}`);

  app.innerHTML = `
    <h1 class="page-title">${escapeHtml(t("searchResults"))}</h1>
    <p class="page-lead">${
      query
        ? escapeHtml(
            t("resultsFor", {
              count: data.results.length,
              plural: data.results.length === 1 ? "" : I18n.getLang() === "es" ? "s" : "s",
              query,
            })
          )
        : escapeHtml(t("typeQuery"))
    }</p>
    ${articleListHtml(data.results)}
    ${
      query && !data.results.length
        ? `<div class="form-actions" style="margin-top:1rem">
            <a class="btn btn-primary" href="#/create?title=${encodeURIComponent(query)}">${escapeHtml(t("createNamed", { query }))}</a>
          </div>`
        : ""
    }
  `;
}

async function renderAll() {
  setTitle(t("allPages"));
  const data = await api("/api/articles?limit=5000&sort=title");
  app.innerHTML = `
    <h1 class="page-title">${escapeHtml(t("allPages"))}</h1>
    <p class="page-lead">${escapeHtml(t("allPagesLead", { total: data.total }))}</p>
    ${articleListHtml(data.articles)}
  `;
}

async function renderRecent() {
  setTitle(t("recentChanges"));
  const changes = await api("/api/recent?limit=40");
  app.innerHTML = `
    <h1 class="page-title">${escapeHtml(t("recentChanges"))}</h1>
    <p class="page-lead">${escapeHtml(t("recentPageLead"))}</p>
    <ul class="revision-list">
      ${changes
        .map((r) => {
          const title =
            I18n.getLang() === "es" ? r.titleEs || r.title : r.title;
          return `
        <li>
          <a href="#/article/${escapeHtml(r.slug)}"><strong>${escapeHtml(title)}</strong></a>
          <span class="muted">${escapeHtml(r.summary)} · ${escapeHtml(r.author)} · ${escapeHtml(formatDate(r.createdAt))}</span>
        </li>`;
        })
        .join("")}
    </ul>
  `;
}

async function renderCategories() {
  setTitle(t("categories"));
  const categories = await api("/api/categories");
  app.innerHTML = `
    <h1 class="page-title">${escapeHtml(t("categories"))}</h1>
    <p class="page-lead">${escapeHtml(t("categoriesLead"))}</p>
    <div class="category-cloud">
      ${categories
        .map(
          (c) =>
            `<a href="#/category/${encodeURIComponent(c.slug)}">${escapeHtml(I18n.categoryName(c.name))} (${c.count})</a>`
        )
        .join("")}
    </div>
  `;
}

async function renderCategory(name) {
  app.innerHTML = `<div class="loading">${escapeHtml(t("loadingCategory"))}</div>`;
  try {
    const category = await api(`/api/categories/${encodeURIComponent(name)}`);
    setTitle(I18n.categoryName(category.name));
    app.innerHTML = `
      <h1 class="page-title">${escapeHtml(I18n.categoryName(category.name))}</h1>
      <p class="page-lead">${escapeHtml(
        t("categoryLead", {
          count: category.articles.length,
          plural: category.articles.length === 1 ? "" : "s",
        })
      )}</p>
      ${articleListHtml(category.articles)}
    `;
  } catch (err) {
    app.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
  }
}

async function renderRandom() {
  app.innerHTML = `<div class="loading">${escapeHtml(t("findingRandom"))}</div>`;
  const article = await api("/api/articles/random");
  location.replace(`#/article/${article.slug}`);
}

function renderAuthForm({ mode }) {
  const isSignup = mode === "signup";
  if (currentUser) {
    setTitle(currentUser.username);
    app.innerHTML = `
      <section class="auth-panel">
        <h1 class="page-title">${escapeHtml(t("sessionRestored", { name: currentUser.username }))}</h1>
        <p class="page-lead">${escapeHtml(t("loggedInNotice", { name: currentUser.username }))}</p>
        <div class="form-actions">
          <a class="btn btn-primary" href="#/">${escapeHtml(t("goHome"))}</a>
          <button type="button" class="btn btn-ghost" id="auth-logout-page">${escapeHtml(t("logOut"))}</button>
        </div>
      </section>
    `;
    document.getElementById("auth-logout-page")?.addEventListener("click", async () => {
      try {
        await api("/api/auth/logout", { method: "POST" });
      } catch {
        /* still clear local session */
      }
      currentUser = null;
      renderAuthNav();
      router();
    });
    return;
  }

  setTitle(isSignup ? t("signupTitle") : t("loginTitle"));
  app.innerHTML = `
    <section class="auth-panel">
      <h1 class="page-title">${escapeHtml(isSignup ? t("signupTitle") : t("loginTitle"))}</h1>
      <p class="page-lead">${escapeHtml(isSignup ? t("signupLead") : t("loginLead"))}</p>
      <div id="auth-message"></div>
      <form class="form-stack auth-form" id="auth-form">
        <div class="form-field">
          <label for="username">${escapeHtml(t("username"))}</label>
          <input id="username" name="username" autocomplete="username" required minlength="3" maxlength="32" />
        </div>
        <div class="form-field">
          <label for="password">${escapeHtml(t("password"))}</label>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="${isSignup ? "new-password" : "current-password"}"
            required
            minlength="6"
            maxlength="128"
          />
          ${isSignup ? `<p class="muted form-hint">${escapeHtml(t("passwordHint"))}</p>` : ""}
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" type="submit">
            ${escapeHtml(isSignup ? t("createAccount") : t("signIn"))}
          </button>
        </div>
      </form>
      <p class="auth-switch">
        ${
          isSignup
            ? `${escapeHtml(t("haveAccount"))} <a href="#/login">${escapeHtml(t("signIn"))}</a>`
            : `${escapeHtml(t("noAccount"))} <a href="#/signup">${escapeHtml(t("signUp"))}</a>`
        }
      </p>
    </section>
  `;

  const form = document.getElementById("auth-form");
  const message = document.getElementById("auth-message");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      username: String(fd.get("username") || "").trim(),
      password: String(fd.get("password") || ""),
    };
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = isSignup ? t("creatingAccount") : t("signingIn");
    message.innerHTML = "";
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const data = await api(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      currentUser = data.user;
      localStorage.setItem("wikiAuthor", currentUser.username);
      sessionReady = true;
      renderAuthNav();
      if (location.hash === "#/" || location.hash === "") {
        router();
      } else {
        location.hash = "#/";
      }
    } catch (err) {
      message.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = isSignup ? t("createAccount") : t("signIn");
    }
  });
}

function renderLogin() {
  return renderAuthForm({ mode: "login" });
}

function renderSignup() {
  return renderAuthForm({ mode: "signup" });
}

async function router() {
  closeMobileNav();
  searchSuggest.hidden = true;
  window.scrollTo(0, 0);

  const { parts, params } = parseHash();
  const [root, a, b, c] = parts;

  try {
    if (!root) return renderHome();
    if (root === "login" || root === "signin") return renderLogin();
    if (root === "signup" || root === "register") return renderSignup();
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
      <h1 class="page-title">${escapeHtml(t("pageNotFound"))}</h1>
      <p class="page-lead">${escapeHtml(t("pageNotFoundLead"))}</p>
      <a class="btn btn-primary" href="#/">${escapeHtml(t("goHome"))}</a>
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
        .map((r) => {
          const a = I18n.localizeArticle(r);
          return `
        <a href="#/article/${escapeHtml(a.slug)}">
          <span class="suggest-title">${escapeHtml(a.displayTitle)}</span>
          <span class="suggest-summary">${escapeHtml(a.displaySummary || "")}</span>
        </a>`;
        })
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

I18n.setLang(I18n.getLang());
applyChrome();

(async () => {
  await refreshSession();
  if (!location.hash) {
    location.hash = "#/";
  } else {
    router();
  }
})();
