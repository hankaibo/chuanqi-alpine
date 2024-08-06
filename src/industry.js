import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl} from './untils';
import './style.css';

window.Alpine = Alpine;

Alpine.data('headerData', () => ({
  headerHtml: '',
  // 导航栏数据
  isLink: 'industries',

  parentIndustries: [],
  childIndustry: [],
  grandsonIndustry: [],

  parentCategories: [],
  childCategory: [],
  grandsonCategory: [],

  //
  handleIndustry(pId, index = 0) {
    window.open(`industry.html?pId=${pId}&index=${index + 1}`, '_blank', 'noopener,noreferrer');
  },

  handleSolutionDetail(solutionId) {
    window.open(`solution-detail.html?id=${solutionId}`, '_blank', 'noopener,noreferrer');
  },

  // 产品分类页面
  handleProductCategory(pId, index = 0) {
    window.open(`products.html?pId=${pId}&index=${index + 1}`, '_blank', 'noopener,noreferrer');
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

    this.$nextTick(() => {
      fetch('./header.html')
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

  init() {
    this.$nextTick(() => {
      fetch('./footer.html')
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
  tabContents: [],
  tabsData: {
    tabSelected: 1,
    tabId: 'tabs',
    tabButtonClicked(tabButton, tab) {
      this.tabSelected = tabButton.id.replace(this.tabId + '-', '');
      this.tabRepositionMarker(tabButton);
      this.tabContents = tab.children.map((item) => {
        return {
          ...item,
          productList: item.productList?.map((it) => ({
            ...it,
            imageUrl: getThumbnailUrl(it.cover),
          })),
        };
      });
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

  async getIndustry(pId, index) {
    getIndusties((data) => {
      let industry = null;
      if (pId) {
        industry = data.find((item) => item.id === pId);
      } else {
        industry = data[0];
      }

      this.tabs = industry?.children || [];

      if (index && index !== 'undefined') {
        this.tabContents = this.tabs[index]?.children;
      } else {
        this.tabSelected = index;
        this.tabContents = this.tabs[0]?.children;
      }
    });
  },

  handleDetail(item) {
    const {id} = item;
    window.location.href = `product-detail.html?id=${id}`;
  },

  handleRefresh(evt) {
    const {pId, index} = evt.detail;
    this.getIndustry(pId, index);
  },

  init() {
    const searchParams = new URLSearchParams(location.search);
    const pId = searchParams.get('pId');
    const index = searchParams.get('index');

    this.getIndustry(pId, index);

    //
    window.addEventListener('refreshCategory', this.handleRefresh.bind(this));
  },
}));

Alpine.start();
