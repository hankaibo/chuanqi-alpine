import Alpine from 'alpinejs';
import './style.css';

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'news',
  loading: false,
  // 新闻数据
  newsList: [],
  total: 0,
  queryParams: {
    currentPage: 1,
    pageSize: 10,
  },
  async getList() {
    this.loading = true;
    const res = await fetch(`/api/v1/news?pageSize=${this.queryParams.pageSize}&currentPage=${this.queryParams.currentPage}`);
    const data = await res.json();
    this.loading = false;
    this.newsList = data?.data.map((item) => {
      const {cover} = item;
      let thumbnailUrl;
      if (cover) {
        const separator = cover.path.includes('files/') ? 'files/' : cover.path?.includes('files\\') ? 'files\\' : '';
        const [http, name] = cover.path.split(separator);
        thumbnailUrl = `${http}files/thumbnail_${name.split('.')[0]}.webp`;
      }
      return {
        ...item,
        imageUrl: thumbnailUrl,
      };
    });
    this.total = data.total;
  },
  handleDetail(item) {
    const {id} = item;
    window.location.href = `news-detail.html?id=${id}`;
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
      fetch('/api/v1/industries')
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
      fetch('/api/v1/categories')
        .then((res) => res.json())
        .then((data) => {
          this.handleSetCategory(data);
          sessionStorage.setItem(CATEGORY_KEY, JSON.stringify(data));
        });
    }
  },
}));

Alpine.start();
