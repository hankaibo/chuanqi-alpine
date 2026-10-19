import {getIndustries, getCategories} from './api';

/**
 * 注册站点级共享状态。
 * 数据只取一次(幂等),页头/页脚/页面组件统一从这里读取。
 */
function registerSiteStore(Alpine) {
  Alpine.store('site', {
    industries: [],
    categories: [],
    isMobile: matchMedia('(max-width: 768px)').matches,
    swiperIndex: 0,
    loaded: false,

    async load() {
      if (this.loaded) return;
      const [industries, categories] = await Promise.all([getIndustries(), getCategories()]);
      this.industries = industries;
      this.categories = categories;
      this.loaded = true;
    },
  });
}

export {registerSiteStore};
