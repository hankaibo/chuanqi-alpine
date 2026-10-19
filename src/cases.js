import Alpine from './bootstrap';
import {getCases as fetchCases} from './site/api';
import {getThumbnailUrl} from './utils';

Alpine.data('data', () => ({
  // 页面数据
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
      this.$refs.tabMarker.style.left = tabButton.offsetLeft + 'px';
    },
    tabContentActive(tabContent) {
      return this.tabSelected == tabContent.id.replace(this.tabId + '-content-', '');
    },
    tabButtonActive(tabContent) {
      const tabId = tabContent.id.split('-')?.[1];
      return this.tabSelected == tabId;
    },
  },
  tabContents: {}, // 缓存

  async getCases(id) {
    if (this.tabContents[id]) {
      return this.tabContents[id];
    }

    const data = await fetchCases(id);
    this.tabContents[id] = data.data?.map((item) => {
      return {
        ...item,
        publishedAt: item.publishedAt.substring(0, 19).replace('T', ' '),
        imageUrl: getThumbnailUrl(item.cover.path),
      };
    });
  },

  handleDetail(item) {
    const {id} = item;
    window.open(`cases-detail.html?id=${id}`, '_blank', 'noopener,noreferrer');
  },

  async init() {
    await this.$store.site.load();
    const data = this.$store.site.industries;
    this.tabs = data;
    if (Array.isArray(data) && data.length) {
      this.getCases(data[0].id);
    }
  },
}));

Alpine.start();
