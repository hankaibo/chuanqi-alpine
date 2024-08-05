import {cachedFetch} from './fetch-cache';
/**
 * 获取行业数据
 */
async function getIndusties(cb) {
  // 缓存行业
  const data = await cachedFetch('/api/v1/industries/index');
  if (typeof cb === 'function') {
    cb(data);
  }
}

/**
 * 获取产品的分类
 */
async function getCategories(cb) {
  // 缓存产品分类
  const data = await cachedFetch('/api/v1/categories/index');
  if (typeof cb === 'function') {
    cb(data);
  }
}

async function getCategoriesAndProducts(category, cb) {
  const promises = category.children.map(async (item) => {
    const {id} = item;
    const data = await cachedFetch(`/api/v1/categories/${id}/products`);
    return data;
  });

  const results = await Promise.all(promises);

  if (typeof cb === 'function') {
    cb(results);
  }
}

function handleTop() {
  const el = document.querySelector('.top');
  el.scrollIntoView({behavior: 'smooth', block: 'start'});
}
function handleLink(path) {
  if (typeof path === 'string') {
    this.$router.push({path});
  } else {
    const {chineseName, englishName, parentName} = path;
    const tabs = JSON.stringify(path.children.map((it) => ({id: it.id, name: it.name})));
    this.$router.push({
      name: parentName,
      query: {chineseName, englishName, tabs},
    });
  }
}

export {getIndusties, getCategories, getCategoriesAndProducts};
