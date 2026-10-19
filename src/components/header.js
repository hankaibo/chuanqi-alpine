/**
 * 页头组件。
 * @param {string} page 当前页面标识,用于导航高亮(isLink)。
 * @param {'navigate'|'refresh'} productCategoryMode 产品分类点击行为:
 *   - 'navigate'(默认):打开 products.html;
 *   - 'refresh':派发 refreshCategory 事件(仅 products 列表页使用)。
 */
function headerData(page = '', productCategoryMode = 'navigate') {
  return {
    // 导航栏数据
    isLink: page,
    swiperIndex: 0, // 当前最外部 swiper 的索引，方便切换 header 样式

    parentIndustries: [],
    childIndustry: [],
    grandsonIndustry: [],

    parentCategories: [],
    childCategory: [],
    grandsonCategory: [],

    //
    handleIndustry(pId, index = 0) {
      window.open(`industry.html?pId=${pId}&index=${index}`, '_blank', 'noopener,noreferrer');
    },

    handleSolutionDetail(solutionId) {
      window.open(`solution-detail.html?id=${solutionId}`, '_blank', 'noopener,noreferrer');
    },

    // 产品分类页面
    handleProductCategory(pId, index = 0) {
      if (productCategoryMode === 'refresh') {
        window.dispatchEvent(
          new CustomEvent('refreshCategory', {
            detail: {
              pId,
              index,
            },
          }),
        );
        return;
      }
      window.open(`products.html?pId=${pId}&index=${index}`, '_blank', 'noopener,noreferrer');
    },

    // 产品详情页面
    handleProductDetail(productId) {
      window.open(`product-detail.html?id=${productId}`, '_blank', 'noopener,noreferrer');
    },

    async init() {
      await this.$store.site.load();

      // 导航栏使用数据
      this.parentIndustries = this.$store.site.industries;
      this.childIndustry = this.parentIndustries[0]?.children || [];
      this.grandsonIndustry = this.childIndustry[0]?.children || [];

      this.parentCategories = this.$store.site.categories;
      this.childCategory = this.parentCategories[0]?.children || [];
      this.grandsonCategory = this.childCategory[0]?.children || [];

      this.$watch('childIndustry', (newValue) => {
        this.grandsonIndustry = newValue[0]?.children || [];
      });
      this.$watch('childCategory', (newValue) => {
        this.grandsonCategory = newValue[0]?.children || [];
      });

      window.addEventListener('set-swiper-index', (event) => {
        this.swiperIndex = event.detail;
      });
    },
  };
}

export {headerData};
