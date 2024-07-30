/**
 * 获取行业数据
 */
async function getIndusties(cb) {
  // 缓存行业
  const INDUSTRY_KEY = '__industry__';
  const cachedIndustryData = sessionStorage.getItem(INDUSTRY_KEY);
  if (cachedIndustryData && cachedIndustryData !== '{}') {
    const data = JSON.parse(cachedIndustryData);
    handleSetIndustry(data, cb);
  } else {
    fetch('/api/v1/industries/index')
      .then((res) => res.json())
      .then((data) => {
        handleSetIndustry(data, cb);
        sessionStorage.setItem(INDUSTRY_KEY, JSON.stringify(data));
      });
  }
}
function handleSetIndustry(data, cb) {
  if (typeof cb === 'function') {
    cb(data);
  }
}

/**
 * 获取产品的分类
 */
async function getCategories(cb) {
  // 缓存产品分类
  const CATEGORY_KEY = '__categroy__';
  const cachedData = sessionStorage.getItem(CATEGORY_KEY);
  if (cachedData && cachedData !== '{}') {
    const data = JSON.parse(cachedData);
    handleSetCategory(data, cb);
  } else {
    fetch('/api/v1/categories/index')
      .then((res) => res.json())
      .then((data) => {
        handleSetCategory(data, cb);
        sessionStorage.setItem(CATEGORY_KEY, JSON.stringify(data));
      });
  }
}
function handleSetCategory(data, cb) {
  if (typeof cb === 'function') {
    cb(data);
  }
}

export {getIndusties, getCategories};
