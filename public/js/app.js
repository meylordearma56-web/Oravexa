const app = document.getElementById("app");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const searchSuggest = document.getElementById("search-suggest");
const navToggle = document.getElementById("nav-toggle");
const mainNav = document.querySelector(".main-nav");
const themeToggle = document.getElementById("theme-toggle");
const langToggle = document.getElementById("lang-toggle");
const authLangToggle = document.getElementById("auth-lang-toggle");
const authThemeToggle = document.getElementById("auth-theme-toggle");
const authScreen = document.getElementById("auth-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const ownerForm = document.getElementById("owner-form");
const authMessage = document.getElementById("auth-message");
const userChip = document.getElementById("user-chip");
const userChipName = document.getElementById("user-chip-name");
const userChipBadge = document.getElementById("user-chip-badge");
const logoutBtn = document.getElementById("logout-btn");
const presenceBtn = document.getElementById("presence-btn");
const presenceModal = document.getElementById("presence-modal");
const presenceBackdrop = document.getElementById("presence-backdrop");
const presenceClose = document.getElementById("presence-close");
const presenceSummary = document.getElementById("presence-summary");
const presenceChart = document.getElementById("presence-chart");
const presenceList = document.getElementById("presence-list");
const I18n = window.OravexaI18n;
const Auth = window.OravexaAuth;

let suggestTimer = null;
let appReady = false;
let heartbeatTimer = null;
let presenceRefreshTimer = null;

function t(key, vars) {
  return I18n.t(key, vars);
}

function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function syncThemeToggle() {
  const next = getTheme() === "dark" ? "light" : "dark";
  const label = next === "dark" ? t("themeToDark") : t("themeToLight");
  const title = next === "dark" ? t("themeTitleDark") : t("themeTitleLight");
  for (const btn of [themeToggle, authThemeToggle]) {
    if (!btn) continue;
    btn.setAttribute("aria-label", label);
    btn.title = title;
  }
}

function setTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("oravexaTheme", next);
  localStorage.removeItem("wikiTheme");
  syncThemeToggle();
}

function syncLangToggle() {
  for (const btn of [langToggle, authLangToggle]) {
    if (!btn) continue;
    btn.textContent = t("langSwitch");
    btn.setAttribute("aria-label", t("langLabel"));
    btn.title = t("langLabel");
  }
}

function applyAuthChrome() {
  const tagline = document.getElementById("auth-tagline");
  const note = document.getElementById("auth-note");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const tabOwner = document.getElementById("tab-owner");
  if (tagline) {
    tagline.textContent =
      ownerForm && !ownerForm.hidden ? t("authOwnerHint") : t("authTagline");
  }
  if (note) note.textContent = t("authNote");
  if (tabLogin) tabLogin.textContent = t("authSignIn");
  if (tabRegister) tabRegister.textContent = t("authCreateAccount");
  if (tabOwner) tabOwner.textContent = t("authOwner");

  const loginUser = document.querySelector('label[for="login-username"]');
  const loginPass = document.querySelector('label[for="login-password"]');
  const regDisplay = document.querySelector('label[for="register-display"]');
  const regUser = document.querySelector('label[for="register-username"]');
  const regPass = document.querySelector('label[for="register-password"]');
  const ownerCode = document.querySelector('label[for="owner-code"]');
  if (loginUser) loginUser.textContent = t("authUsername");
  if (loginPass) loginPass.textContent = t("authPassword");
  if (regDisplay) regDisplay.textContent = t("authDisplayName");
  if (regUser) regUser.textContent = t("authUsername");
  if (regPass) regPass.textContent = t("authPassword");
  if (ownerCode) ownerCode.textContent = t("authOwnerCode");

  const loginEmail = document.getElementById("login-username");
  const registerEmail = document.getElementById("register-username");
  if (loginEmail) loginEmail.placeholder = t("authEmailPlaceholder");
  if (registerEmail) registerEmail.placeholder = t("authEmailPlaceholder");

  const loginSubmit = loginForm?.querySelector(".auth-submit");
  const registerSubmit = registerForm?.querySelector(".auth-submit");
  const ownerSubmit = document.getElementById("owner-submit");
  if (loginSubmit) loginSubmit.textContent = t("authSignIn");
  if (registerSubmit) registerSubmit.textContent = t("authCreateAccount");
  if (ownerSubmit) ownerSubmit.textContent = t("authOwnerSubmit");
  if (logoutBtn) logoutBtn.textContent = t("logout");
  if (userChipBadge) userChipBadge.textContent = t("ownerBadge");
  if (presenceBtn) presenceBtn.textContent = t("presenceBtn");
  const presenceTitle = document.getElementById("presence-title");
  if (presenceTitle) presenceTitle.textContent = t("presenceTitle");
  if (presenceClose) {
    presenceClose.textContent = t("presenceClose");
    presenceClose.setAttribute("aria-label", t("presenceCloseLabel"));
  }
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
    const phoneUrl = "https://oravexa.onrender.com";
    footer.innerHTML = `
      <p><strong>Oravexa</strong> — ${escapeHtml(t("footerTagline"))}</p>
      <p class="muted">${escapeHtml(t("footerMeta"))}</p>
      <p class="footer-phone">
        <span class="footer-phone-label">iOS / Android / PC</span>
        <a class="footer-phone-link" href="${phoneUrl}" target="_blank" rel="noopener noreferrer">Oravexa</a>
      </p>
    `;
  }

  if (Auth.currentUser && userChip && userChipName) {
    const isOwner = Auth.currentUser.role === "owner";
    document.body.classList.toggle("is-owner", isOwner);
    userChip.hidden = false;
    userChipName.textContent =
      Auth.currentUser.displayName || Auth.currentUser.username;
    if (userChipBadge) {
      userChipBadge.hidden = !isOwner;
      userChipBadge.textContent = t("ownerBadge");
    }
    if (presenceBtn) {
      presenceBtn.hidden = !isOwner;
      presenceBtn.setAttribute("aria-hidden", isOwner ? "false" : "true");
      presenceBtn.textContent = t("presenceBtn");
    }
  } else if (userChip) {
    document.body.classList.remove("is-owner");
    userChip.hidden = true;
    if (presenceBtn) {
      presenceBtn.hidden = true;
      presenceBtn.setAttribute("aria-hidden", "true");
    }
  }

  applyAuthChrome();
  syncThemeToggle();
  syncLangToggle();
}

function showAuthMessage(text, type = "error") {
  if (!authMessage) return;
  authMessage.hidden = !text;
  authMessage.textContent = text || "";
  authMessage.classList.toggle("is-error", type === "error");
  authMessage.classList.toggle("is-ok", type === "ok");
}

function setAuthTab(whichtab) {
  const which =
    whichtab === "register" || whichtab === "owner" ? whichtab : "login";
  document.getElementById("tab-login")?.classList.toggle("is-active", which === "login");
  document
    .getElementById("tab-register")
    ?.classList.toggle("is-active", which === "register");
  document.getElementById("tab-owner")?.classList.toggle("is-active", which === "owner");
  if (loginForm) loginForm.hidden = which !== "login";
  if (registerForm) registerForm.hidden = which !== "register";
  if (ownerForm) ownerForm.hidden = which !== "owner";
  showAuthMessage("");
  applyAuthChrome();
}

function showAuthScreen() {
  document.body.classList.add("auth-locked");
  document.body.classList.remove("is-authenticated");
  document.body.classList.remove("is-owner");
  stopPresenceHeartbeat();
  closePresenceModal();
  if (authScreen) {
    authScreen.hidden = false;
    authScreen.setAttribute("aria-hidden", "false");
  }
  if (appShell) {
    appShell.hidden = true;
    appShell.setAttribute("aria-hidden", "true");
  }
  appReady = false;
  applyAuthChrome();
  setAuthTab("login");
}

function enterApp() {
  document.body.classList.remove("auth-locked");
  document.body.classList.add("is-authenticated");
  if (authScreen) {
    authScreen.hidden = true;
    authScreen.setAttribute("aria-hidden", "true");
  }
  if (appShell) {
    appShell.hidden = false;
    appShell.setAttribute("aria-hidden", "false");
  }
  appReady = true;
  applyChrome();
  startPresenceHeartbeat();
  if (!location.hash) {
    location.hash = "#/";
  } else {
    router();
  }
}

function stopPresenceHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startPresenceHeartbeat() {
  stopPresenceHeartbeat();
  if (!Auth.isLoggedIn()) return;

  const beat = () => {
    Auth.heartbeat().catch(() => {});
  };
  beat();
  heartbeatTimer = setInterval(beat, 25000);
}

function formatSeenAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 8000) return t("presenceJustNow");
  if (ms < 60000) return t("presenceSecondsAgo", { n: Math.floor(ms / 1000) });
  return t("presenceMinutesAgo", { n: Math.max(1, Math.floor(ms / 60000)) });
}

function closePresenceModal() {
  if (presenceRefreshTimer) {
    clearInterval(presenceRefreshTimer);
    presenceRefreshTimer = null;
  }
  if (presenceModal) {
    presenceModal.hidden = true;
    document.body.classList.remove("presence-open");
  }
}

async function renderPresenceChart(data) {
  if (!presenceChart || !presenceList || !presenceSummary) return;

  const total = Math.max(data.onlineCount || 0, 1);
  const ownersPct = Math.round(((data.owners || 0) / total) * 100);
  const usersPct = Math.round(((data.users || 0) / total) * 100);
  const totalUsers = data.totalUsers || 0;
  const summaryKey =
    (data.users || 0) === 1 ? "presenceSummaryOne" : "presenceSummary";

  presenceSummary.textContent = t(summaryKey, {
    count: data.onlineCount || 0,
    owners: data.owners || 0,
    users: data.users || 0,
    totalUsers,
  });

  presenceChart.innerHTML = `
    <div class="presence-bars" role="img" aria-label="${escapeHtml(t("presenceTitle"))}">
      <div class="presence-bar-row">
        <span class="presence-bar-label">${escapeHtml(t("presenceAccountsCreated"))}</span>
        <div class="presence-bar-track">
          <div class="presence-bar-fill is-user" style="width:100%"></div>
        </div>
        <span class="presence-bar-count">${totalUsers}</span>
      </div>
      <div class="presence-bar-row">
        <span class="presence-bar-label">${escapeHtml(t("presenceOwners"))}</span>
        <div class="presence-bar-track">
          <div class="presence-bar-fill is-owner" style="width:${ownersPct}%"></div>
        </div>
        <span class="presence-bar-count">${data.owners || 0}</span>
      </div>
      <div class="presence-bar-row">
        <span class="presence-bar-label">${escapeHtml(t("presenceUsers"))}</span>
        <div class="presence-bar-track">
          <div class="presence-bar-fill is-user" style="width:${usersPct}%"></div>
        </div>
        <span class="presence-bar-count">${data.users || 0}</span>
      </div>
    </div>
  `;

  const people = data.online || [];
  if (!people.length) {
    presenceList.innerHTML = `<li class="presence-empty">${escapeHtml(t("presenceEmpty"))}</li>`;
    return;
  }

  presenceList.innerHTML = people
    .map((person) => {
      const name = person.displayName || person.username;
      const role =
        person.role === "owner" ? t("ownerBadge") : t("presenceUsers");
      return `
        <li class="presence-person ${person.role === "owner" ? "is-owner" : ""}">
          <span class="presence-person-name">${escapeHtml(name)}</span>
          <span class="presence-person-role">${escapeHtml(role)}</span>
          <span class="presence-person-seen">${escapeHtml(formatSeenAgo(person.lastSeenAt))}</span>
        </li>
      `;
    })
    .join("");
}

async function openPresenceModal() {
  if (!presenceModal || Auth.currentUser?.role !== "owner") return;

  presenceModal.hidden = false;
  document.body.classList.add("presence-open");
  if (presenceSummary) presenceSummary.textContent = t("presenceLoading");
  if (presenceChart) presenceChart.innerHTML = "";
  if (presenceList) presenceList.innerHTML = "";

  const load = async () => {
    try {
      const data = await Auth.getPresence();
      await renderPresenceChart(data);
    } catch (err) {
      if (presenceSummary) {
        presenceSummary.textContent = err.message || t("presenceError");
      }
    }
  };

  await load();
  if (presenceRefreshTimer) clearInterval(presenceRefreshTimer);
  presenceRefreshTimer = setInterval(load, 10000);
}

function onThemeClick() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

function onLangClick() {
  const next = I18n.getLang() === "es" ? "en" : "es";
  I18n.setLang(next);
  applyChrome();
  if (appReady) router();
}

themeToggle?.addEventListener("click", onThemeClick);
authThemeToggle?.addEventListener("click", onThemeClick);
langToggle?.addEventListener("click", onLangClick);
authLangToggle?.addEventListener("click", onLangClick);

document.querySelectorAll("[data-auth-tab]").forEach((btn) => {
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAuthTab(btn.dataset.authTab);
  });
});

// Event delegation fallback for stubborn mobile taps
authScreen?.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-auth-tab]");
  if (!tab || !authScreen.contains(tab)) return;
  event.preventDefault();
  setAuthTab(tab.dataset.authTab);
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  showAuthMessage("");
  try {
    await Auth.login(String(fd.get("username") || ""), String(fd.get("password") || ""));
    enterApp();
  } catch (err) {
    showAuthMessage(err.message, "error");
  }
});

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(registerForm);
  showAuthMessage("");
  try {
    await Auth.register(
      String(fd.get("username") || ""),
      String(fd.get("password") || ""),
      String(fd.get("displayName") || "")
    );
    enterApp();
  } catch (err) {
    showAuthMessage(err.message, "error");
  }
});

ownerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(ownerForm);
  showAuthMessage("");
  try {
    await Auth.ownerLogin(String(fd.get("code") || ""));
    enterApp();
  } catch (err) {
    showAuthMessage(err.message, "error");
  }
});

logoutBtn?.addEventListener("click", async () => {
  stopPresenceHeartbeat();
  closePresenceModal();
  await Auth.logout();
  showAuthScreen();
});

presenceBtn?.addEventListener("click", () => {
  openPresenceModal();
});
presenceClose?.addEventListener("click", () => closePresenceModal());
presenceBackdrop?.addEventListener("click", () => closePresenceModal());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && presenceModal && !presenceModal.hidden) {
    closePresenceModal();
  }
});

async function api(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const token = Auth.getToken();
  const res = await fetch(path, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    <ul class="article-list article-list-with-images">
      ${articles
        .map((raw) => {
          const a = I18n.localizeArticle(raw);
          const img = a.image
            ? `<img class="article-list-thumb" src="${escapeHtml(a.image)}" alt="${escapeHtml(a.imageAlt || a.displayTitle)}" loading="lazy" />`
            : `<span class="article-list-thumb is-empty" aria-hidden="true"></span>`;
          return `
        <li>
          <a href="#/article/${escapeHtml(a.slug)}">
            ${img}
            <span class="article-list-copy">
              <span class="title">${escapeHtml(a.displayTitle)}</span>
              <span class="summary">${escapeHtml(a.displaySummary || "")}</span>
              <span class="meta-row">
                <span>${escapeHtml(t("updated"))} ${escapeHtml(formatDate(a.updatedAt))}</span>
                ${(a.displayCategories || [])
                  .map((c) => `<span class="pill">${escapeHtml(c)}</span>`)
                  .join("")}
              </span>
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
        <div class="hero-identity">
          <img
            class="hero-logo"
            src="/logo.svg"
            width="112"
            height="112"
            alt=""
            decoding="async"
          />
          <p class="hero-brand">Oravexa</p>
        </div>
        <h1>${escapeHtml(t("heroHeadline"))}</h1>
        <p>${escapeHtml(t("heroLead"))}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#/article/oravexa">${escapeHtml(t("startReading"))}</a>
          <a class="btn btn-secondary" href="#/create">${escapeHtml(t("writeArticle"))}</a>
        </div>
      </div>
    </section>

    <div class="stats-inline">
      <div><strong>${Number(stats.articles).toLocaleString()}</strong> ${escapeHtml(t("articles"))}</div>
      <div><strong>${Number(stats.categories).toLocaleString()}</strong> ${escapeHtml(t("categoriesCount"))}</div>
      <div><strong>${Number(stats.revisions).toLocaleString()}</strong> ${escapeHtml(t("revisions"))}</div>
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
          ${
            article.image
              ? `<figure class="article-cover">
                  <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.imageAlt || localized.displayTitle)}" loading="eager" />
                </figure>`
              : ""
          }
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
        <label for="categories">${escapeHtml(t("categoriesLabel"))} <span class="muted">${escapeHtml(t("commaSeparated"))}</span></label>
        <input id="categories" name="categories" value="${escapeHtml((article?.categories || []).join(", "))}" placeholder="Science, History" />
      </div>
      <div class="form-field">
        <label for="author">${escapeHtml(t("yourName"))}</label>
        <input id="author" name="author" value="${escapeHtml(
          Auth.currentUser?.displayName ||
            Auth.currentUser?.username ||
            localStorage.getItem("wikiAuthor") ||
            ""
        )}" placeholder="${escapeHtml(t("anonymous"))}" />
      </div>
      <div class="form-field">
        <label for="content">${escapeHtml(t("contentMd"))}</label>
        <textarea id="content" name="content" required placeholder="# Heading&#10;&#10;${escapeHtml(t("startWriting"))}">${escapeHtml(article?.content || "")}</textarea>
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
      content: String(fd.get("content") || "").trim(),
      categories: String(fd.get("categories") || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      author:
        String(fd.get("author") || "").trim() ||
        Auth.currentUser?.displayName ||
        Auth.currentUser?.username ||
        t("anonymous"),
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
        const author =
          Auth.currentUser?.displayName ||
          Auth.currentUser?.username ||
          localStorage.getItem("wikiAuthor") ||
          t("anonymous");
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
      const author =
        Auth.currentUser?.displayName ||
        Auth.currentUser?.username ||
        localStorage.getItem("wikiAuthor") ||
        t("anonymous");
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
  const data = await api("/api/articles?limit=100&sort=title");
  app.innerHTML = `
    <h1 class="page-title">${escapeHtml(t("allPages"))}</h1>
    <p class="page-lead">${escapeHtml(t("allPagesLead", { total: data.total }))}</p>
    ${
      data.total > data.articles.length
        ? `<p class="muted">${escapeHtml(
            t("showingFirst", {
              shown: data.articles.length,
              total: data.total,
            })
          )}</p>`
        : ""
    }
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
    const category = await api(
      `/api/categories/${encodeURIComponent(name)}?limit=100&offset=0`
    );
    const total = category.total ?? category.count ?? category.articles.length;
    setTitle(I18n.categoryName(category.name));
    app.innerHTML = `
      <h1 class="page-title">${escapeHtml(I18n.categoryName(category.name))}</h1>
      <p class="page-lead">${escapeHtml(
        t("categoryLead", {
          count: total,
          plural: total === 1 ? "" : "s",
        })
      )}</p>
      ${
        total > category.articles.length
          ? `<p class="muted">${escapeHtml(
              t("showingFirst", {
                shown: category.articles.length,
                total,
              })
            )}</p>`
          : ""
      }
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
      <h1 class="page-title">${escapeHtml(t("pageNotFound"))}</h1>
      <p class="page-lead">${escapeHtml(t("pageNotFoundLead"))}</p>
      <a class="btn btn-primary" href="#/">${escapeHtml(t("goHome"))}</a>
    `;
  } catch (err) {
    app.innerHTML = `<div class="notice notice-error">${escapeHtml(err.message)}</div>`;
  }
}

searchForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInput?.value.trim() || "";
  location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : "#/search";
  if (searchSuggest) searchSuggest.hidden = true;
});

searchInput?.addEventListener("input", () => {
  const q = searchInput.value.trim();
  clearTimeout(suggestTimer);
  if (q.length < 2) {
    if (searchSuggest) searchSuggest.hidden = true;
    return;
  }
  suggestTimer = setTimeout(async () => {
    try {
      const data = await api(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
      if (!searchSuggest) return;
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
      if (searchSuggest) searchSuggest.hidden = true;
    }
  }, 180);
});

document.addEventListener("click", (e) => {
  if (searchForm && searchSuggest && !searchForm.contains(e.target)) {
    searchSuggest.hidden = true;
  }
});

navToggle?.addEventListener("click", () => {
  if (!mainNav) return;
  const open = mainNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

mainNav?.addEventListener("click", (e) => {
  if (e.target.closest("a")) closeMobileNav();
});

window.addEventListener("hashchange", () => {
  if (appReady) router();
});

async function waitForServerReady(maxMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.ready) return true;
      }
    } catch {
      // Server may still be waking / reseeding after Render sleep.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function bootClient() {
  if (!window.OravexaI18n || !window.OravexaAuth) {
    console.error("Oravexa failed to load auth/i18n scripts");
    showAuthScreen();
    showAuthMessage("App failed to load. Please refresh.", "error");
    return;
  }

  I18n.setLang(I18n.getLang());
  applyAuthChrome();
  syncThemeToggle();
  syncLangToggle();

  if (authScreen) {
    authScreen.hidden = false;
    const tagline = document.getElementById("auth-tagline");
    if (tagline) tagline.textContent = t("authChecking");
  }

  try {
    await waitForServerReady();
    const user = await Auth.restoreSession();
    if (user) {
      enterApp();
    } else {
      showAuthScreen();
    }
  } catch (err) {
    console.error(err);
    showAuthScreen();
    showAuthMessage(err.message || "Could not restore session", "error");
  }
}

bootClient();
