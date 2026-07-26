const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const SESSION_DAYS = 30;
const OWNER_CODE = process.env.ORAVEXA_OWNER_CODE || "Cursor";
const OWNER_USERNAME = "owner";

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

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
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
    throw new Error("Owner code is required");
  }
  if (submitted !== OWNER_CODE) {
    throw new Error("Invalid owner code");
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
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  data.sessions[token] = {
    token,
    userId,
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  return data.sessions[token];
}

function register({ username, password, displayName }) {
  const data = load();
  cleanExpiredSessions(data);

  const key = normalizeUsername(username);
  if (!key || key.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!/^[a-z0-9._-]+$/i.test(key)) {
    throw new Error("Username can only use letters, numbers, . _ -");
  }
  if (!password || String(password).length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (data.users[key]) {
    throw new Error("That username is already taken");
  }

  const { salt, hash } = hashPassword(String(password));
  const now = new Date().toISOString();
  const user = {
    id: crypto.randomBytes(8).toString("hex"),
    username: key,
    displayName: String(displayName || username).trim() || key,
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
  const user = data.users[key];
  if (!user || !verifyPassword(String(password || ""), user.salt, user.passwordHash)) {
    throw new Error("Invalid username or password");
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

  // Sliding expiry: extend session when used
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
  logout,
  extractToken,
  USERS_PATH,
  OWNER_CODE,
};
