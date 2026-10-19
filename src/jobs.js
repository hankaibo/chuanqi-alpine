import Alpine from './bootstrap';
import {getIndusties, getCategories} from './header';

Alpine.data('data', () => ({
  jobs: [],
  async getList() {
    const res = await fetch('/api/v1/jobs');
    const data = await res.json();
    this.jobs = data.data;
  },
}));

Alpine.start();
