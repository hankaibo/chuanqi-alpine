import {menuList} from '../site/config';

/**
 * 桌面端导航下拉状态机。
 * 行业/产品的三级数据与 handle* 方法仍由父级 `headerData` 作用域提供。
 */
function navMenu() {
  return {
    menuList,

    pIndex: 0,
    cIndex: 0,
    pId: '',
    navigationMenuOpen: false,
    navigationMenu: '',
    navigationMenuCloseDelay: 200,
    navigationMenuCloseTimeout: null,

    navigationMenuLeave() {
      const that = this;
      this.navigationMenuCloseTimeout = setTimeout(() => {
        that.navigationMenuClose();
      }, this.navigationMenuCloseDelay);
    },

    navigationMenuReposition() {
      this.navigationMenuClearCloseTimeout();
    },

    navigationMenuClearCloseTimeout() {
      clearTimeout(this.navigationMenuCloseTimeout);
    },

    navigationMenuClose() {
      this.navigationMenuOpen = false;
      this.navigationMenu = '';
    },
  };
}

export {navMenu};
