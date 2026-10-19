/**
 * 首页「工程案例」Tab。
 * 行业列表(`industries`)与 `getCases` / `industryCase` / `handleCaseDetail`
 * 由父级 `data` 作用域提供。
 */
function tabs() {
  return {
    tabSelected: 1,
    tabId: '',

    init() {
      this.tabId = this.$id('tabs');
    },

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
      const tabId = tabContent.id.split('-').slice(-1);
      return this.tabSelected == tabId;
    },
  };
}

export {tabs};
