// 定义缓存过期时间（毫秒）
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5分钟

// 定义默认的缓存存储，使用 localStorage 或 sessionStorage
const DEFAULT_STORAGE = 'sessionStorage';

/**
 * 生成缓存键
 * @param {string} url
 * @param {object} options
 * @returns {string}
 */
function generateCacheKey(url, options) {
  return JSON.stringify({url, options});
}

/**
 * 检查缓存是否有效
 * @param {object} cacheItem
 * @returns {boolean}
 */
function checkCacheValid(cacheItem) {
  return cacheItem && Date.now() - cacheItem.timestamp < CACHE_EXPIRATION;
}

/**
 * 获取存储对象
 * @param {string} storageType
 * @returns {Storage}
 */
function getStorage(storageType) {
  return storageType === 'sessionStorage' ? sessionStorage : localStorage;
}

/**
 * 缓存 fetch 请求
 * @param {string} url
 * @param {object} options
 * @param {string} storageType
 * @returns {Promise<any>}
 */
async function cachedFetch(url, options = {}, storageType = DEFAULT_STORAGE) {
  const cacheKey = generateCacheKey(url, options);
  const storage = getStorage(storageType);

  const cachedItem = JSON.parse(storage.getItem(cacheKey));

  if (checkCacheValid(cachedItem)) {
    return cachedItem.data;
  }

  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      throw new Error(`请求失败：${res.status}`);
    }

    const data = await res.json();

    const cacheValue = {
      data,
      timestamp: Date.now(),
    };
    storage.setItem(cacheKey, JSON.stringify(cacheValue));

    return data;
  } catch (error) {
    if (cachedItem) {
      return cachedItem.data;
    }
    throw error;
  }
}

function clearCache(storageType = DEFAULT_STORAGE) {
  const storage = getStorage(storageType);
  storage.clear();
}

function removeCacheItem(url, options = {}, storageType = DEFAULT_STORAGE) {
  const cacheKey = generateCacheKey(url, options);
  const storage = getStorage(storageType);
  storage.removeItem(cacheKey);
}

export {cachedFetch, clearCache, removeCacheItem};
