import Alpine from './bootstrap';

Alpine.data('data', () => ({
  jobs: [],
  async getList() {
    const res = await fetch('/api/v1/jobs');
    const data = await res.json();
    this.jobs = data.data;
  },
}));

Alpine.start();
