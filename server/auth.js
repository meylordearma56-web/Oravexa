const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);

const DATA_DIR = path.join(__dirname, "..", "data");
const AUTH_PATH = path.join(DATA_DIR, "auth.json");
const COOKIE_NAME = "oravexa_session";
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultAuth() {
  return {
    users: {},
    sessions: {},
  };
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(AUTH_PATH)) {
    const db = defaultAuth();
    save(db);
    return db;
  }
  const db = JSON.parse(fs.readFileSync(AUTH_PATH, "utf8"));
  if (!db.users) db.users = {};
  if (!db.sessions) db.sessions = {};
  return db;
}

function save(db) {
  ensureDataDir();
  const tmp = `${AUTH_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, AUTH_PATH);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt,
  };
}

function parseCookies(header = "") {
  const out = {};
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function sessionCookie(token, maxAgeMs = SESSION_MS) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

async function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derived = await scrypt(password, salt, 64);
  return {
    salt,
    hash: derived.toString("hex"),
  };
}

async function verifyPassword(password, salt, hash) {
  const derived = await scrypt(password, salt, 64);
  const left = Buffer.from(derived.toString("hex"), "utf8");
  const right = Buffer.from(hash, "utf8");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .replace(/\s+/g, " ");
}

function validateCredentials(username, password) {
  const name = normalizeUsername(username);
  if (name.length < 3 || name.length > 32) {
    throw new Error("Username must be 3–32 characters");
  }
  if (!/^[a-zA-Z0-9_\- ]+$/.test(name)) {
    throw new Error(
      "Username can only use letters, numbers, spaces, hyphens, and underscores"
    );
  }
  const pass = String(password || "");
  if (pass.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (pass.length > 128) {
    throw new Error("Password is too long");
  }
  return { username: name, password: pass };
}

function pruneExpiredSessions(db) {
  const now = Date.now();
  let changed = false;
  for (const [token, session] of Object.entries(db.sessions)) {
    if (new Date(session.expiresAt).getTime() <= now) {
      delete db.sessions[token];
      changed = true;
    }
  }
  return changed;
}

function createSession(db, user) {
  pruneExpiredSessions(db);
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();
  db.sessions[token] = {
    token,
    userId: user.id,
    username: user.username,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_MS).toISOString(),
  };
  save(db);
  return token;
}

function getSessionUser(db, token) {
  if (!token) return null;
  pruneExpiredSessions(db);
  const session = db.sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    delete db.sessions[token];
    save(db);
    return null;
  }
  const user =
    Object.values(db.users).find((u) => u.id === session.userId) || null;
  return publicUser(user);
}

function destroySession(db, token) {
  if (token && db.sessions[token]) {
    delete db.sessions[token];
    save(db);
  }
}

async function signup(username, password) {
  const creds = validateCredentials(username, password);
  const db = load();
  const key = creds.username.toLowerCase();
  if (db.users[key]) {
    throw new Error("That username is already taken");
  }
  const { salt, hash } = await hashPassword(creds.password);
  const user = {
    id: crypto.randomBytes(8).toString("hex"),
    username: creds.username,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };
  db.users[key] = user;
  const token = createSession(db, user);
  return { user: publicUser(user), token };
}

async function login(username, password) {
  const creds = validateCredentials(username, password);
  const db = load();
  const user = db.users[creds.username.toLowerCase()];
  if (!user) {
    throw new Error("Invalid username or password");
  }
  const ok = await verifyPassword(
    creds.password,
    user.passwordSalt,
    user.passwordHash
  );
  if (!ok) {
    throw new Error("Invalid username or password");
  }
  const token = createSession(db, user);
  return { user: publicUser(user), token };
}

function logout(token) {
  const db = load();
  destroySession(db, token);
}

function me(token) {
  const db = load();
  return getSessionUser(db, token);
}

function getTokenFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[COOKIE_NAME] || null;
}

function attachUser(req, _res, next) {
  try {
    const token = getTokenFromRequest(req);
    req.sessionToken = token;
    req.user = me(token);
  } catch {
    req.sessionToken = null;
    req.user = null;
  }
  next();
}

module.exports = {
  COOKIE_NAME,
  SESSION_MS,
  signup,
  login,
  logout,
  me,
  getTokenFromRequest,
  attachUser,
  sessionCookie,
  clearSessionCookie,
  AUTH_PATH,
};
