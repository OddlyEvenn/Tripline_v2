const { createClient } = require('redis');

let redisClient = null;
let useMemoryFallback = false;
const memoryCache = new Map();

// Memory Fallback implementation matching basic Redis methods
const memoryFallbackClient = {
  get: async (key) => {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    return item.value;
  },
  set: async (key, value, options) => {
    let expiry = null;
    if (options && options.EX) {
      expiry = Date.now() + options.EX * 1000;
    }
    memoryCache.set(key, { value: String(value), expiry });
    return 'OK';
  },
  del: async (key) => {
    return memoryCache.delete(key) ? 1 : 0;
  },
  ttl: async (key) => {
    const item = memoryCache.get(key);
    if (!item) return -2;
    if (item.expiry) {
      const remaining = Math.max(0, Math.round((item.expiry - Date.now()) / 1000));
      if (remaining === 0) {
        memoryCache.delete(key);
        return -2;
      }
      return remaining;
    }
    return -1; // No expiry
  }
};

async function initRedis() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`Connecting to Redis at ${redisUrl}...`);

  redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) => {
        if (retries >= 3) {
          console.warn('Redis reconnection failed 3 times. Falling back to in-memory cache.');
          useMemoryFallback = true;
          return false; // Stop reconnecting
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err.message);
    useMemoryFallback = true;
  });

  try {
    await redisClient.connect();
    console.log('Connected to Redis successfully.');
    useMemoryFallback = false;
  } catch (err) {
    console.warn('Could not establish initial connection to Redis. Using in-memory fallback cache.', err.message);
    useMemoryFallback = true;
  }
}

function getRedisClient() {
  if (useMemoryFallback || !redisClient) {
    return memoryFallbackClient;
  }
  return {
    get: async (key) => await redisClient.get(key),
    set: async (key, value, options) => {
      // redis v4 uses EX option inside an object
      return await redisClient.set(key, String(value), options);
    },
    del: async (key) => await redisClient.del(key),
    ttl: async (key) => await redisClient.ttl(key) // v4 has ttl or we get TTL using client.ttl
  };
}

module.exports = {
  initRedis,
  getRedisClient
};
