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
    fetch('../header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('../footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
