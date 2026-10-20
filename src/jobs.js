import Alpine from './bootstrap';
import {apiUrl} from './site/api-base';

Alpine.data('data', () => ({
  jobs: [],
  async getList() {
    const res = await fetch(apiUrl('/api/v1/jobs'));
    const data = await res.json();
    this.jobs = data.data;
  },
}));

Alpine.start();
