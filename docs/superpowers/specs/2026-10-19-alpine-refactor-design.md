# Alpine.js 用法重构设计

- 日期:2026-10-19
- 状态:已评审(待实施)
- 范围:结构调整,保留 Vite + Alpine.js + Tailwind CSS 技术栈

## 1. 背景

本项目是使用 Vite 构建的多页面静态站点(MPA),技术栈为:

- Vite 8(多 HTML 入口)
- Tailwind CSS 3.4
- Alpine.js 3.17(`@alpinejs/collapse`)
- Swiper 14
- `@popperjs/core`(右下角浮层定位)
- `@wangeditor/editor`(只读富文本,按需动态加载)

每个页面是独立的 HTML 入口 + 独立 JS 模块。当前每个页面的 JS 各自做三件事:

1. 注册 `Alpine.data('headerData', …)` / `Alpine.data('footerData', …)` / `Alpine.data('data', …)`
2. 用 `fetch()` 拉取 `header.html` / `footer.html` / `popover.html` 片段,再用 `x-html` 注入
3. `window.Alpine = Alpine; Alpine.start();`

## 2. 问题

1. **大量重复**:`headerData`(约 60 行)与 `footerData`(约 20 行)在 10 个页面 JS 文件中逐字复制(`about.js`、`cases.js`、`news.js`、`product-detail.js` 等),约 800 行重复代码;除各页 `isLink` 不同外几乎完全一致。改一处导航逻辑要改十处。
2. **运行时拉取 HTML 片段**:`fetch + x-html` 被当作模板 include 使用,导致首屏闪烁/布局跳动、每次导航多一次请求、无构建期缓存哈希、SEO 不友好。
3. **巨型内联 `x-data`**:桌面导航三级下拉菜单状态机写在 `header.html`、Tab 逻辑与联系地址数据写在 `index.html`、移动端菜单状态写在 `header-mobile.html`,数据、逻辑、内容混杂在标记中,难以阅读与维护。
4. **回调式取数**:`getIndusties(cb)` / `getCategories(cb, …)` 使用回调而非 `Promise`/`async`,`cachedFetch` 缓存写入 `sessionStorage`。
5. **跨组件通信隐式**:通过 `window.dispatchEvent('set-swiper-index')` 全局事件在首页与页头之间通信,脆弱且难以追踪。
6. **Alpine 驱动 Swiper 生命周期**:全部放在 `$nextTick` 中 `new Swiper`,时序脆弱。

核心判断:Alpine 适合"为静态 HTML 增加交互",但当前被当作 SPA 框架使用(运行时注入 HTML + 全局状态),与其设计取向相悖。本次**不更换技术栈**,而是按 Alpine 的惯用法重整结构。

## 3. 目标与非目标

### 目标

- **可维护性**:消除 header/footer 等重复代码,公共逻辑单点维护。
- **性能**:去掉运行时片段请求与首屏闪烁,片段随页面打包并带缓存哈希。
- **现代化**:改用 `Alpine.store`、`async` 数据层、具名组件、构建期内联等现代惯用法;依赖升级不受浏览器兼容性约束。

### 非目标(本次不做)

- 不引入组件框架(不换成 Vue/Preact/Astro/Web Components)。
- 不改变后端 API 契约(`/api/v1/...` 保持不变)。
- 不改动页面 HTML 的视觉/布局与 Tailwind 类风格。
- **路线 C 增强项**:用现代 CSS `popover` + anchor positioning 替换 Popper、封装 `x-swiper` 指令——作为可选后续,不在本次范围。
- 不新增自动化测试框架(作为可选后续)。

## 4. 目标设计

### 4.1 目录结构

页面 HTML 保持在 `src/` 根目录不动(避免 `./images/...` 等相对资源路径大改),仅做片段归位与新增共享模块。

```
src/
├── bootstrap.js          # 新:注册插件/store/公共组件,不 start
├── site/
│   ├── api.js            # 新:async 取数层(统一封装 cachedFetch)
│   ├── store.js          # 新:Alpine.store('site', …)
│   └── config.js         # 新:静态站点数据(菜单、联系方式、popover 条目)
├── components/
│   ├── header.js         # 新:Alpine.data('header', (page) => …)
│   ├── nav-menu.js       # 新:桌面向导菜单状态机(原 header.html 内联)
│   ├── mobile-nav.js     # 新:移动端菜单状态
│   ├── footer.js         # 新:页脚行为
│   ├── tabs.js           # 新:首页工程案例 Tab(原 index.html 内联)
│   └── popover.js        # 新:右下角浮层(保留 Popper)
├── partials/             # 移动:构建期片段
│   ├── header.html
│   ├── header-mobile.html
│   ├── footer.html
│   ├── footer-mobile.html
│   └── popover.html
├── index.js / about.js / …   # 变瘦:只注册本页组件 + Alpine.start()
├── style.css / utils.js / fetch-cache.js / read-only-editor.js   # 保留
└── *.html                # 页面保持原位
```

### 4.2 数据与状态层

**`site/api.js`** —— 把回调式取数改为返回 Promise 的 `async` 函数,统一错误处理:

```js
export const getIndustries = () => cachedFetch('/api/v1/industries/index');
export const getCategories = () => cachedFetch('/api/v1/categories/index');
export const getProducts = () => fetch('/api/v1/products/index').then((r) => r.json());
export const getCases = (industryId) => {
  /* buildQueryString + fetch */
};
export const getAbout = () => fetch('/api/v1/about/1').then((r) => r.json());
export const getNews = (page, size) => fetch(`/api/v1/news?currentPage=${page}&pageSize=${size}`).then((r) => r.json());
export const submitMessage = (form) => fetch('/api/v1/messages', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(form)});
```

`fetch-cache.js` 保留(继续作为 `cachedFetch` 的缓存实现),由 `api.js` 统一调用。

**`site/store.js`** —— 用 `Alpine.store('site')` 收拢"全局共享、只取一次"的数据:

```js
Alpine.store('site', {
  industries: [],
  categories: [],
  config: siteConfig, // 菜单、各办事处电话地址等静态数据
  isMobile: matchMedia('(max-width: 768px)').matches,
  swiperIndex: 0, // 替代原 window 'set-swiper-index' 事件
  loaded: false,
  async load() {
    // 幂等:多组件调用只真正请求一次
    if (this.loaded) return;
    const [industries, categories] = await Promise.all([getIndustries(), getCategories()]);
    this.industries = industries;
    this.categories = categories;
    this.loaded = true;
  },
});
```

约定:

- header / footer / 页面组件统一从 `$store.site` 读数据,不再各自持有一份。
- **UI 局部状态**(下拉菜单 `pIndex/cIndex`、选中项等)留在组件内,不进 store。
- 跨组件通信(`swiperIndex`)由 `window` 全局事件改为 store 字段,header 通过 `$watch` 响应。

### 4.3 组件层

全部公共逻辑改为 `Alpine.data` 具名注册:

| 组件           | 职责                                                        | 数据来源                       |
| -------------- | ----------------------------------------------------------- | ------------------------------ |
| `header(page)` | 页头外壳,`x-data="header('cases')"` 传入当前页名            | `$store.site`                  |
| `navMenu`      | 桌面三级下拉菜单状态机(原 `header.html` 内联 `x-data`)      | store 的 industries/categories |
| `mobileNav`    | 移动端菜单 `open/openIndustry/openCategory`                 | store                          |
| `footer`       | 页脚行为(`handleTop`、年份)                                 | —                              |
| `tabs`         | 首页工程案例 Tab(原 `index.html` 内联逻辑)+ 触发 `getCases` | store                          |
| `popover`      | 右下角浮层,Popper 定位                                      | `site/config.js`               |

约定:

- **共享导航动作**(`handleIndustry` / `handleProductCategory` / `handleSolutionDetail` / `handleProductDetail`)统一放在 `header` 组件上,子组件靠 Alpine 作用域继承调用,不再各页重复。
- **页面组件**保留原名 `data`(使 `<main x-data="data">` 的改动最小),只删掉其中重复的 header/footer 部分。
- 内联的 `x-data="{...}"` 大对象(nav / tabs / 联系地址 / popover 条目)全部移出 HTML:逻辑进组件,静态数据进 `site/config.js`。

### 4.4 构建期内联机制

用一个**无第三方依赖的自定义 Vite 插件**(约 30 行)在构建期把片段内联进页面:

```html
<div x-data="header('cases')">
  <!-- #include partials/header.html -->
  <!-- #include partials/header-mobile.html -->
</div>
```

- 插件在 `transformIndexHtml`(pre 阶段)读取并递归替换 `#include` 指令。
- 桌面 / 移动两套 header 同时内联,用 Tailwind `hidden lg:block` / `lg:hidden` 切换,**不再用 JS 判断 `isMobile` 切换片段**(消除首屏闪烁;`isMobile` 仅保留给 Swiper 等行为逻辑)。
- 从 `vite.config.js` 的 `build.rolldownOptions.input` 中**移除** `header` / `footer` / `popover` 的独立入口(不再单独产出文件)。

收益:首屏无闪烁、无额外请求、片段随页面打包并带缓存哈希、SEO 友好。

### 4.5 页面引导

**`src/bootstrap.js`**(不 `start`):注册 `collapse` 插件 + `Alpine.store('site')` + 所有公共组件,并 `export default Alpine`。

**各页 `xxx.js` 变瘦**:

```js
import Alpine from './bootstrap';
// 本页专属的 Swiper / 数据逻辑
Alpine.data('data', () => ({/* 仅本页 */}));
Alpine.start(); // 每个页面各自 start 一次
```

## 5. 验证策略

项目没有测试框架,验证 = 构建 + 人工冒烟:

- 命令:`pnpm format:check`、`pnpm build`。
- 冒烟清单(逐页):
  - 桌面/移动页头渲染、三级下拉菜单悬浮与关闭、移动端菜单展开
  - 页脚链接与回顶
  - 首页:竖向 Swiper、产品内层轮播(自动播放)、行业悬浮遮罩、案例 Tab 切换(触发 `getCases`)、关于我们富文本、资讯列表、留言表单提交
  - `products.html`:折叠面板(`collapse` 插件)
  - 各详情页:富文本按需加载
  - `about.html`:天地图渲染

## 6. 分阶段实施

每阶段都可独立构建与验证:

1. **抽公共组件去重**(仍用运行时 fetch)——立竿见影、风险最低
2. **引入 store + async 取数层**
3. **构建期内联**,移除 `fetch + x-html`,调整 `vite.config.js`
4. **抽内联 `x-data` 为组件**;跨组件通信改走 store
5. **清理**旧 `header.js` 回调、无用分支、`window.Alpine`

## 7. 风险与缓解

| 风险                                                 | 缓解                                                                                               |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 构建期内联可能影响 Vite 对 HTML 内资源 URL 的重写    | 内联在 `transformIndexHtml` pre 阶段执行,随后交由 Vite 处理;每阶段执行 `pnpm build` 并人工核对产物 |
| 桌面/移动 header 同时内联可能产生重复 DOM 或样式冲突 | 明确 `hidden lg:block` / `lg:hidden` 切换;逐页冒烟                                                 |
| 逐页迁移期间新旧代码并存                             | 按阶段推进,每阶段结束构建通过、冒烟通过再进入下一阶段                                              |
| 无自动化测试,回归风险靠人工                          | 提供明确冒烟清单;可选后续引入 Playwright 冒烟                                                      |

## 8. 后续可选(不在本次范围)

- 路线 C:现代 CSS `popover` + anchor positioning 替换 Popper;封装 `x-swiper` 统一 Swiper 生命周期。
- 引入 Playwright 冒烟测试守住重构。
- 依赖升级到最新版本(不设浏览器兼容下限)。
