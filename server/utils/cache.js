// ============================================================
// ELIMUPLUS - SIMPLE IN-MEMORY CACHE
// ============================================================

const cache = new Map();

const DEFAULT_TTL = 60 * 1000; // 60 seconds

const set = (key, value, ttl = DEFAULT_TTL) => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttl
  });
};

const get = (key) => {
  const item = cache.get(key);

  if (!item) {
    return undefined;
  }

  if (Date.now() >= item.expiresAt) {
    cache.delete(key);
    return undefined;
  }

  return item.value;
};

const del = (key) => {
  cache.delete(key);
};

module.exports = {
  get,
  set,
  del
};
