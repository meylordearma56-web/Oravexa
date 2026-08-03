const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const SESSION_DAYS = 30;
const ONLINE_MS = 90 * 1000;
/** Documented owner password. Always accepted (Render env can drift). */
const DEFAULT_OWNER_CODE = "Cursor";
const OWNER_USERNAME = "owner";

function ownerCodes() {
  const fromEnv = String(process.env.ORAVEXA_OWNER_CODE || "").trim();
  const codes = new Set([DEFAULT_OWNER_CODE]);
  if (fromEnv) codes.add(fromEnv);
  return codes;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function defaultStore() {
  return { users: {}, sessions: {} };
}

function load() {
  ensureDataDir();
  if (!fs.existsSync(USERS_PATH)) {
    const data = defaultStore();
    save(data);
    return data;
  }
  return JSON.parse(fs.readFileSync(USERS_PATH, "utf8"));
}

function save(data) {
  ensureDataDir();
  const tmp = `${USERS_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, USERS_PATH);
}

function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email) {
  const value = String(email || "").trim();
  // Practical email check: local@domain.tld
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function emailLocalPart(email) {
  const local = String(email || "").split("@")[0] || "";
  return local.trim() || "User";
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.username,
    displayName: user.displayName,
    role: user.role || "user",
    createdAt: user.createdAt,
  };
}

function ensureOwnerUser(data) {
  let user = data.users[OWNER_USERNAME];
  if (!user) {
    const { salt, hash } = hashPassword(crypto.randomBytes(24).toString("hex"));
    user = {
      id: crypto.randomBytes(8).toString("hex"),
      username: OWNER_USERNAME,
      displayName: "Owner",
      role: "owner",
      salt,
      passwordHash: hash,
      createdAt: new Date().toISOString(),
    };
    data.users[OWNER_USERNAME] = user;
  } else if (user.role !== "owner") {
    user.role = "owner";
    user.displayName = user.displayName || "Owner";
  }
  return user;
}

function loginWithOwnerCode(code) {
  const submitted = String(code || "").trim();
  if (!submitted) {
    throw new Error("Owner password is required");
  }
  if (!ownerCodes().has(submitted)) {
    throw new Error("Invalid owner password");
  }

  const data = load();
  cleanExpiredSessions(data);
  const user = ensureOwnerUser(data);
  const session = createSession(data, user.id);
  save(data);

  return {
    user: publicUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const { hash } = hashPassword(password, salt);
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(expectedHash, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function cleanExpiredSessions(data) {
  const now = Date.now();
  let changed = false;
  for (const [token, session] of Object.entries(data.sessions)) {
    if (new Date(session.expiresAt).getTime() <= now) {
      delete data.sessions[token];
      changed = true;
    }
  }
  return changed;
}

function createSession(data, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  data.sessions[token] = {
    token,
    userId,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
  };
  return data.sessions[token];
}

function register({ username, password, displayName }) {
  const data = load();
  cleanExpiredSessions(data);

  const key = normalizeUsername(username);
  if (!isValidEmail(key)) {
    throw new Error("Enter a valid email address");
  }
  if (!password || String(password).length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (data.users[key]) {
    throw new Error("That email is already registered");
  }

  const { salt, hash } = hashPassword(String(password));
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomBytes(8).toString("hex"),
    username: key,
    displayName:
      String(displayName || "").trim() || emailLocalPart(key),
    role: "user",
    salt,
    passwordHash: hash,
    createdAt: now,
  };

  data.users[key] = user;
  const session = createSession(data, user.id);
  save(data);

  return { user: publicUser(user), token: session.token, expiresAt: session.expiresAt };
}

function login({ username, password }) {
  const data = load();
  cleanExpiredSessions(data);

  const key = normalizeUsername(username);
  if (!isValidEmail(key)) {
    throw new Error("Enter a valid email address");
  }
  const user = data.users[key];
  if (!user || !verifyPassword(String(password || ""), user.salt, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  const session = createSession(data, user.id);
  save(data);
  return { user: publicUser(user), token: session.token, expiresAt: session.expiresAt };
}

function findUserById(data, userId) {
  return Object.values(data.users).find((u) => u.id === userId) || null;
}

function getSessionUser(token) {
  if (!token) return null;
  const data = load();
  if (cleanExpiredSessions(data)) save(data);

  const session = data.sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    delete data.sessions[token];
    save(data);
    return null;
  }

  const user = findUserById(data, session.userId);
  if (!user) return null;

  // Sliding expiry + presence: extend session when used
  const now = new Date().toISOString();
  session.lastSeenAt = now;
  session.expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  save(data);

  return {
    user: publicUser(user),
    token,
    expiresAt: session.expiresAt,
  };
}

function heartbeat(token) {
  const session = getSessionUser(token);
  if (!session) {
    throw new Error("Not logged in");
  }
  return { ok: true, at: new Date().toISOString() };
}

function requireOwner(token) {
  const session = getSessionUser(token);
  if (!session) {
    throw Object.assign(new Error("Not logged in"), { status: 401 });
  }
  if (session.user.role !== "owner") {
    throw Object.assign(new Error("Owners only"), { status: 403 });
  }
  return session;
}

function getOnlinePresence(token) {
  requireOwner(token);

  const data = load();
  cleanExpiredSessions(data);
  const cutoff = Date.now() - ONLINE_MS;
  const byUser = new Map();

  for (const session of Object.values(data.sessions)) {
    const seenAt = session.lastSeenAt || session.createdAt;
    if (!seenAt || new Date(seenAt).getTime() < cutoff) continue;

    const user = findUserById(data, session.userId);
    if (!user) continue;

    const prev = byUser.get(user.id);
    if (!prev || new Date(seenAt).getTime() > new Date(prev.lastSeenAt).getTime()) {
      byUser.set(user.id, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role || "user",
        lastSeenAt: seenAt,
      });
    }
  }

  const online = Array.from(byUser.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
  const owners = online.filter((u) => u.role === "owner").length;
  const users = online.length - owners;

  const allAccounts = Object.values(data.users);
  const totalOwners = allAccounts.filter((u) => u.role === "owner").length;
  const totalUsers = allAccounts.length - totalOwners;

  return {
    onlineCount: online.length,
    owners,
    users,
    totalAccounts: allAccounts.length,
    totalOwners,
    totalUsers,
    checkedAt: new Date().toISOString(),
    onlineMs: ONLINE_MS,
    online,
  };
}

function logout(token) {
  if (!token) return true;
  const data = load();
  if (data.sessions[token]) {
    delete data.sessions[token];
    save(data);
  }
  return true;
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  if (req.headers["x-session-token"]) {
    return String(req.headers["x-session-token"]).trim();
  }
  if (req.body && req.body.token) {
    return String(req.body.token).trim();
  }
  return null;
}

module.exports = {
  register,
  login,
  loginWithOwnerCode,
  getSessionUser,
  heartbeat,
  getOnlinePresence,
  logout,
  extractToken,
  USERS_PATH,
  DEFAULT_OWNER_CODE,
  ownerCodes,
  ONLINE_MS,
};
