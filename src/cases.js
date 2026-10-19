import Alpine from './bootstrap';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl, buildQueryString} from './utils';

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

    const params = {
      filters: {
        industryId: id,
      },
    };

    const queryString = buildQueryString(params);
    // 获取所有行业数据
    const res = await fetch(`/api/v1/cases/index?${queryString}`);
    const data = await res.json();
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

  init() {
    getIndusties((data) => {
      this.tabs = data;
      if (Array.isArray(data) && data.length) {
        this.getCases(data[0].id);
      }
    });
  },
}));

Alpine.start();
