import Alpine from './bootstrap';
import {getIndusties, getCategories} from './header';
import {getThumbnailUrl} from './utils';

Alpine.data('data', () => ({
  // 页面数据
  tabs: [],
  tabContents: [],
  tabsData: {
    tabSelected: 1,
    tabId: 'tabs',
    tabButtonClicked(tabButton, tab) {
      this.tabSelected = tabButton.id.replace(this.tabId + '-', '');
      this.tabRepositionMarker(tabButton);
      this.tabContents = tab.children.map((item) => {
        return {
          ...item,
          productList: item.productList?.map((it) => ({
            ...it,
            imageUrl: getThumbnailUrl(it.cover),
          })),
        };
      });
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

  async getIndustry(pId, index) {
    getIndusties((data) => {
      let industry = null;
      if (pId) {
        industry = data.find((item) => item.id === pId);
      } else {
        industry = data[0];
      }

      this.tabs = industry?.children || [];

      if (index && index !== 'undefined') {
        this.tabContents = this.tabs[index]?.children;
      } else {
        this.tabSelected = index;
        this.tabContents = this.tabs[0]?.children;
      }
    });
  },

  handleDetail(item) {
    const {id} = item;
    window.location.href = `product-detail.html?id=${id}`;
  },

  handleRefresh(evt) {
    const {pId, index} = evt.detail;
    this.getIndustry(pId, index);
  },

  init() {
    const searchParams = new URLSearchParams(location.search);
    const pId = searchParams.get('pId');
    const index = searchParams.get('index');

    this.getIndustry(pId, index);

    //
    window.addEventListener('refreshCategory', this.handleRefresh.bind(this));
  },
}));

Alpine.start();
