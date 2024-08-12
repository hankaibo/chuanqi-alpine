import Alpine from 'alpinejs';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl} from './untils';
import './style.css';

window.Alpine = Alpine;

Alpine.data('headerData', () => ({
  headerHtml: '',
  // 导航栏数据
  isLink: 'news',
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
  isMobile: window.matchMedia('(max-width: 768px)').matches,

  handleTop() {
    window.scrollTo({top: 0, behavior: 'smooth'});
  },

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
  loading: false,
  // 新闻数据
  newsList: [],
  total: 0,
  hasNextPage: false,
  queryParams: {
    currentPage: 1,
    pageSize: 10,
  },
  async getList() {
    this.loading = true;
    const res = await fetch(`/api/v1/news?pageSize=${this.queryParams.pageSize}&currentPage=${this.queryParams.currentPage}`);
    const data = await res.json();
    this.loading = false;
    this.hasNextPage = data.hasNextPage;
    this.newsList = data?.data.map((item) => {
      return {
        ...item,
        publishedAt: item.publishedAt.substring(0, 19).replace('T', ' '),
        imageUrl: getThumbnailUrl(item.cover.path),
      };
    });
    this.total = data.total;
  },
  handleDetail(item) {
    const {id} = item;
    window.open(`news-detail.html?id=${id}`, '_blank', 'noopener,noreferrer');
  },
  handleNext() {
    this.queryParams.currentPage += 1;
    this.getList();
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // 平滑滚动
    });
  },
  handlePrevious() {
    this.queryParams.currentPage -= 1;
    if (this.queryParams.currentPage < 1) {
      this.queryParams.currentPage = 1;
    }
    this.getList();
    window.scrollTo({
      top: 0,
      behavior: 'smooth', // 平滑滚动
    });
  },
}));

Alpine.start();
