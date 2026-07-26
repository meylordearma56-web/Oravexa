/**
 * Weekly encyclopedia growth.
 *
 * Every 7 days (UTC calendar weeks since EPOCH), each main category gains a
 * random number of new catalog articles. Growth is deterministic from the
 * week index + category name so Render cold starts / reseeds keep the same
 * expanded catalog without relying on ephemeral disk.
 */

const { MAIN_CATEGORIES } = require("./generate-articles");

/** First growth lands one full week after this instant. */
const EPOCH_MS = Date.UTC(2026, 6, 19, 0, 0, 0); // 2026-07-19 → week 1 starts 2026-07-26
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Inclusive random range of new articles per category per week. */
const MIN_PER_CATEGORY = 12;
const MAX_PER_CATEGORY = 48;

function weekIndex(now = Date.now()) {
  const elapsed = Number(now) - EPOCH_MS;
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  return Math.floor(elapsed / WEEK_MS);
}

function hashSeed(text) {
  let h = 2166136261;
  const s = String(text);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 — deterministic PRNG from a 32-bit seed. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weeklyAdd(week, category) {
  if (week < 1) return 0;
  const rand = mulberry32(hashSeed(`oravexa-growth:v1:${week}:${category}`));
  const span = MAX_PER_CATEGORY - MIN_PER_CATEGORY + 1;
  return MIN_PER_CATEGORY + Math.floor(rand() * span);
}

function bonusForCategory(category, now = Date.now()) {
  const weeks = weekIndex(now);
  let sum = 0;
  for (let week = 1; week <= weeks; week += 1) {
    sum += weeklyAdd(week, category);
  }
  return sum;
}

function bonusesByCategory(now = Date.now()) {
  const out = {};
  for (const category of MAIN_CATEGORIES) {
    out[category] = bonusForCategory(category, now);
  }
  return out;
}

function totalBonus(now = Date.now()) {
  return MAIN_CATEGORIES.reduce(
    (sum, category) => sum + bonusForCategory(category, now),
    0
  );
}

function msUntilNextGrowth(now = Date.now()) {
  const weeks = weekIndex(now);
  const nextAt = EPOCH_MS + (weeks + 1) * WEEK_MS;
  return Math.max(0, nextAt - Number(now));
}

function snapshot(now = Date.now()) {
  const weeks = weekIndex(now);
  const byCategory = bonusesByCategory(now);
  const addedThisWeek = {};
  for (const category of MAIN_CATEGORIES) {
    addedThisWeek[category] = weeklyAdd(weeks, category);
  }
  return {
    week: weeks,
    minPerCategory: MIN_PER_CATEGORY,
    maxPerCategory: MAX_PER_CATEGORY,
    bonusArticles: totalBonus(now),
    byCategory,
    addedThisWeek: weeks >= 1 ? addedThisWeek : null,
    nextGrowthInMs: msUntilNextGrowth(now),
    epoch: new Date(EPOCH_MS).toISOString(),
  };
}

function logStatus(now = Date.now()) {
  const info = snapshot(now);
  if (info.week < 1) {
    console.log(
      `Weekly growth armed: first expansion in ~${Math.ceil(
        info.nextGrowthInMs / 3600000
      )}h (${MIN_PER_CATEGORY}–${MAX_PER_CATEGORY} articles per category)`
    );
    return info;
  }
  console.log(
    `Weekly growth: week ${info.week}, +${info.bonusArticles} catalog articles across ${MAIN_CATEGORIES.length} categories`
  );
  return info;
}

module.exports = {
  EPOCH_MS,
  WEEK_MS,
  MIN_PER_CATEGORY,
  MAX_PER_CATEGORY,
  MAIN_CATEGORIES,
  weekIndex,
  weeklyAdd,
  bonusForCategory,
  bonusesByCategory,
  totalBonus,
  msUntilNextGrowth,
  snapshot,
  logStatus,
};
