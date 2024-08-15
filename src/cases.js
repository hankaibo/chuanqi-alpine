import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl, buildQueryString} from './utils';
import './style.css';

window.Alpine = Alpine;

Alpine.data('headerData', () => ({
  headerHtml: '',
  // 导航栏数据
  isLink: 'cases',
  isMobile: window.matchMedia('(max-width: 768px)').matches,

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
    window.open(`products.html?pId=${pId}&index=${index}`, '_blank', 'noopener,noreferrer');
  },

  // 产品详情页面
  handleProductDetail(productId) {
    window.open(`product-detail.html?id=${productId}`, '_blank', 'noopener,noreferrer');
  },

  init() {
    getIndusties((data) => {
      // 导航栏使用数据
      this.parentIndustries = data;
      this.childIndustry = this.parentIndustries[0]?.children || [];
      this.grandsonIndustry = this.childIndustry[0]?.children || [];
    });
    this.$watch('childIndustry', (newValue) => {
      this.grandsonIndustry = newValue[0]?.children || [];
    });

    getCategories((data) => {
      // 导航栏
      this.parentCategories = data;
      this.childCategory = this.parentCategories[0]?.children || [];
      this.grandsonCategory = this.childCategory[0]?.children || [];
    });
    this.$watch('childCategory', (newValue) => {
      this.grandsonCategory = newValue[0]?.children || [];
    });

    const localHtml = this.isMobile ? './header-mobile.html' : './header.html';
    this.$nextTick(() => {
      fetch(localHtml)
        .then((response) => response.text())
        .then((data) => {
          this.headerHtml = data;
        })
        .catch((error) => console.error('Error loading header:', error));
    });
  },
}));

Alpine.data('footerData', () => ({
  footerHtml: '',
  isMobile: window.matchMedia('(max-width: 768px)').matches,

  handleTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  },

  init() {
    const localHtml = this.isMobile ? './footer-mobile.html' : './footer.html';
    this.$nextTick(() => {
      fetch(localHtml)
        .then((response) => response.text())
        .then((data) => {
          this.footerHtml = data;
        })
        .catch((error) => console.error('Error loading footer:', error));
    });
  },
}));

Alpine.data('data', () => ({
  // 页面数据
  tabs: [],
  tabsData: {
    tabSelected: 1,
    tabId: 'tabs',
    tabButtonClicked(tabButton, tab) {
      this.tabSelected = tabButton.id.replace(this.tabId + '-', '');
      this.tabRepositionMarker(tabButton);
      this.getCases(tab.id);
    },
    tabRepositionMarker(tabButton) {
      this.$refs.tabMarker.style.width = tabButton.offsetWidth + 'px';
      this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px';
    },
    tabContentActive(tabContent) {
      return this.tabSelected == tabContent.id.replace(this.tabId + '-content-', '');
    },
    tabButtonActive(tabContent) {
      const tabId = tabContent.id.split('-')?.[1];
      return this.tabSelected == tabId;
    },
  },
  tabContents: {}, // 缓存

  async getCases(id) {
    if (this.tabContents[id]) {
      return this.tabContents[id];
    }

    const params = {
      filters: {
        industryId: id,
      },
    };

    const queryString = buildQueryString(params);
    // 获取所有行业数据
    const res = await fetch(`/api/v1/cases/index?${queryString}`);
    const data = await res.json();
    this.tabContents[id] = data.data?.map((item) => {
      return {
        ...item,
        publishedAt: item.publishedAt.substring(0, 19).replace('T', ' '),
        imageUrl: getThumbnailUrl(item.cover.path),
      };
    });
  },

  handleDetail(item) {
    const {id} = item;
    window.open(`cases-detail.html?id=${id}`, '_blank', 'noopener,noreferrer');
  },

  init() {
    getIndusties((data) => {
      this.tabs = data;
      if (Array.isArray(data) && data.length) {
        this.getCases(data[0].id);
      }
    });
  },
}));

Alpine.start();
