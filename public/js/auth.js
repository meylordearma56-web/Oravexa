const TOKEN_KEY = "oravexaSessionToken";

window.OravexaAuth = {
  currentUser: null,

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || "";
  },

  setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    this.currentUser = user || null;
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUser = null;
  },

  isLoggedIn() {
    return Boolean(this.currentUser);
  },

  async request(path, options = {}) {
    const { headers: extraHeaders, ...rest } = options;
    const token = this.getToken();
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
  },

  async restoreSession() {
    const token = this.getToken();
    if (!token) {
      this.currentUser = null;
      return null;
    }
    try {
      const data = await this.request("/api/auth/me");
      this.setSession(data.token || token, data.user);
      return data.user;
    } catch {
      this.clearSession();
      return null;
    }
  },

  async login(username, password) {
    const data = await this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    this.setSession(data.token, data.user);
    return data.user;
  },

  async register(username, password, displayName) {
    const data = await this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, displayName }),
    });
    this.setSession(data.token, data.user);
    return data.user;
  },

  async ownerLogin(code) {
    const data = await this.request("/api/auth/owner", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    this.setSession(data.token, data.user);
    return data.user;
  },

  async logout() {
    try {
      await this.request("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      // ignore network errors on logout
    }
    this.clearSession();
  },
};
