import Alpine from "alpinejs";
import "./style.css";

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'news',
  loading: false,
  // 新闻数据
  newsList: [],
  total: 0,
  queryParams: {
    count: 10,
    page: 1,
  },
  async getList() {
    this.loading = true;
    const res = await fetch(`/api/news?count=${this.queryParams.count}&page=${this.queryParams.page}`);
    const data = await res.json();
    this.loading = false;
    this.newsList = data.data;
    this.total = data.total;
  },
  handleDetail(item) {
    const { id } = item;
    window.location.href = `news-detail.html?id=${id}`
  },

  init() {
    const cachedData = sessionStorage.getItem('parentCategories');
    if (cachedData && cachedData !== '{}') {
      const data = JSON.parse(cachedData);
      this.parentCategories = data;
      this.childCategory = this.parentCategories[0];
      this.grandsonCategory = this.childCategory.children;
    } else {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          this.parentCategories = data;
          this.childCategory = this.parentCategories[0];
          this.grandsonCategory = this.childCategory.children;
          sessionStorage.setItem('parentCategories', JSON.stringify(data))
        })
    }

    fetch('../header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('../footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
