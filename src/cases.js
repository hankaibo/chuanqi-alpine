import Alpine from 'alpinejs';
import './style.css';

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'cases',
  loading: false,
  // 行业数据
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
      this.$refs.tabMarker.style.height = tabButton.offsetHeight + 'px';
      this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px';
    },
    tabContentActive(tabContent) {
      return this.tabSelected == tabContent.id.replace(this.tabId + '-content-', '');
    },
    tabButtonActive(tabContent) {
      const tabId = tabContent.id.split('-')?.[1];
      return this.tabSelected == tabId;
    },
    init() {
      this.tabRepositionMarker(this.$refs.tabButtons.firstElementChild);
    },
  },
  tabContents: {},

  async getList() {
    this.loading = true;
    // 获取所有行业数据
    const res = await fetch('/api/industries/roots');
    const data = await res.json();
    this.loading = false;
    this.tabs = data;
    // 默认查询第1个行业的所有案例
    if (Array.isArray(data) && data.length) {
      this.getCases(data[0].id);
    }
  },

  async getCases(id) {
    if (this.tabContents[id]) {
      return this.tabContents[id];
    }
    this.loading = true;
    // 获取所有行业数据
    const res = await fetch(`/api/cases/industry/${id}`);
    const data = await res.json();
    this.loading = false;
    this.tabContents[id] = data;
  },

  handleDetail(item) {
    const { id } = item;
    window.location.href = `cases-detail.html?id=${id}`;
  },

  handleSetIndustry(data) {
    // 导航栏使用数据
    this.parentIndustries = data;
    this.childIndustry = this.parentIndustries[0] || [];
  },

  handleSetCategory(data) {
    // 导航栏
    this.parentCategories = data;
    this.childCategory = this.parentCategories[0];
    this.grandsonCategory = this.childCategory?.children || [];
  },

  init() {
    // 缓存行业
    const INDUSTRY_KEY = '__industry__';
    const cachedIndustryData = sessionStorage.getItem(INDUSTRY_KEY);
    if (cachedIndustryData && cachedIndustryData !== '{}') {
      const data = JSON.parse(cachedIndustryData);
      this.handleSetIndustry(data);
    } else {
      fetch('/api/industries')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetIndustry(data);
          sessionStorage.setItem(INDUSTRY_KEY, JSON.stringify(data));
        });
    }

    // 缓存产品分类
    const CATEGORY_KEY = '__categroy__';
    const cachedData = sessionStorage.getItem(CATEGORY_KEY);
    if (cachedData && cachedData !== '{}') {
      const data = JSON.parse(cachedData);
      this.handleSetCategory(data);
    } else {
      fetch('/api/categories')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetCategory(data);
          sessionStorage.setItem(CATEGORY_KEY, JSON.stringify(data));
        });
    }

    fetch('./header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('./footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
