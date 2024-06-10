import Alpine from 'alpinejs';
import './style.css';

Alpine.data('data', () => ({
  header: '',
  footer: '',
  isLink: 'jobs',
  jobs: [],
  isMobile: false,
  async getList() {
    const res = await fetch('/api/jobs');
    const data = await res.json();
    this.jobs = data.data;
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

    fetch('./header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('./footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
