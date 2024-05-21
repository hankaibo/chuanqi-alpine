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
    fetch('../header.html')
      .then((res) => res.text())
      .then((text) => (this.header = text));
    fetch('../footer.html')
      .then((res) => res.text())
      .then((text) => (this.footer = text));
  },
}));

Alpine.start();
