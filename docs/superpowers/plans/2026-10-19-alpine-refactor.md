# Alpine.js 用法重构 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不更换技术栈的前提下,消除多页面重复的 Alpine 组件代码、改用 `Alpine.store` 与 async 数据层、把 header/footer 片段改为构建期内联,从而提升可维护性、首屏性能与代码现代化程度。

**Architecture:** 保留 Vite 多页应用 + Alpine.js + Tailwind CSS。新增 `src/bootstrap.js` 统一注册插件/store/公共组件;新增 `src/site/`(api、store、config)承载数据与状态;公共交互抽为 `src/components/` 下的具名 `Alpine.data`;用无依赖的 Vite 插件在构建期把 `src/partials/` 片段内联进页面,取代运行时 `fetch + x-html`。

**Tech Stack:** Vite 8.3.4、Alpine.js 3.17.4(`@alpinejs/collapse`)、Tailwind CSS 3.4.19、Swiper 14、`@popperjs/core`、`@wangeditor/editor`、pnpm 10。

**Spec:** `docs/superpowers/specs/2026-10-19-alpine-refactor-design.md`

## Global Constraints

- 技术栈不变:不引入组件框架,不更换 Alpine/Vite/Tailwind。
- 后端 API 契约不变:一切请求仍走 `/api/v1/...`。
- 不改动页面视觉与 Tailwind 类风格;仅允许增删用于「桌面/移动切换」的显隐类。
- 页面 HTML 保持在 `src/` 根目录,不移动。
- 桌面/移动分界沿用 **768px**(现有 `matchMedia('(max-width: 768px)')`)。
- 依赖与运行环境:`node >=22.22.1`、`pnpm >=10`。
- 每个任务结束必须:`pnpm format:check` 通过、`pnpm build` 通过,并完成该任务的冒烟检查。
- 不新增测试框架;验证 = 构建产物检查 + 人工冒烟。
- 已知例外:`products` 页的 `handleProductCategory` 行为与其它页不同(派发 `refreshCategory` 事件),重构必须保留。

## Review Focus

以下五类是本重构最可能"悄悄改坏"的地方,每一条都已在对应任务的冒烟步骤中固定验证:

1. **桌面/移动页头切换** —— 片段改为同时内联后,断点两侧必须正确互斥显示(768px),不能同时出现或同时消失。(Task 5)
2. **导航数据为空/请求失败** —— `industries`/`categories` 为空数组时,页头与移动菜单不得抛错(`?.` 兜底)。(Task 4)
3. **`products` 页导航特例** —— 页头点击产品分类必须派发 `refreshCategory` 并触发列表切换,而不是打开新窗口。(Task 1、Task 6)
4. **富文本详情页直链** —— 直接访问 `*-detail.html?id=...` 时,数据层仍能取到并渲染富文本。(Task 2、Task 3)
5. **缓存导致的陈旧数据** —— `cachedFetch`(sessionStorage,5 分钟)命中时页面仍应正常渲染;清缓存后应刷新。(Task 3)

---

### Task 1: 引导模块 + 共享 header/footer 组件(以 index 页为样本)

**Files:**

- Create: `src/components/header.js`
- Create: `src/components/footer.js`
- Create: `src/bootstrap.js`
- Modify: `src/index.js`
- Modify: `src/index.html:53`

**Interfaces:**

- Consumes: `getIndusties(cb)`、`getCategories(cb)`(来自现有 `src/header.js`,本任务暂不改);Alpine 3.x。
- Produces:
  - `src/components/header.js` → `export function headerData(page = '', productCategoryMode = 'navigate')`(Alpine.data 工厂)。字段:`headerHtml`、`isLink`(= `page`)、`isMobile`、`parentIndustries`、`childIndustry`、`grandsonIndustry`、`parentCategories`、`childCategory`、`grandsonCategory`;方法:`handleIndustry(pId, index = 0)`、`handleSolutionDetail(solutionId)`、`handleProductCategory(pId, index = 0)`、`handleProductDetail(productId)`、`init()`。`productCategoryMode` 仅 `'refresh'` 时派发 `refreshCategory` 事件,否则默认跳转;`isLink` 与行为互相独立。
  - `src/components/footer.js` → `export function footerData()`。字段:`footerHtml`、`isMobile`;方法:`handleTop()`、`init()`。
  - `src/bootstrap.js` → `export default Alpine`;副作用:注册 `collapse` 插件、注册 `Alpine.data('headerData', headerData)` 与 `Alpine.data('footerData', footerData)`、`import './style.css'`、DEV 下 `window.Alpine = Alpine`。

- [ ] **Step 1: 创建 `src/components/header.js`**

把各页重复的 `headerData` 提取为带参工厂。签名 `headerData(page = '', productCategoryMode = 'navigate')`,内部:`isLink: page`,其余字段与现有完全一致。**保留 products 页例外**(注意:`product-detail`/`solution-detail` 的 `isLink` 也是 `products`,但它们用默认跳转,故行为由第二个参数决定,而非 `page`),`handleProductCategory` 体内:

```js
handleProductCategory(pId, index = 0) {
  if (productCategoryMode === 'refresh') {
    window.dispatchEvent(new CustomEvent('refreshCategory', { detail: { pId, index } }));
    return;
  }
  window.open(`products.html?pId=${pId}&index=${index}`, '_blank', 'noopener,noreferrer');
}
```

`init()` 内容原样搬自现有页面(仍用 `getIndusties`/`getCategories` 回调 + `fetch(header.html/header-mobile.html)` + `$nextTick`)。导入 `from '../header'`。

- [ ] **Step 2: 创建 `src/components/footer.js`**

`footerData()` 原样搬运现有 `footerData`(字段 `footerHtml`、`isMobile`,方法 `handleTop`、`init` 中 `fetch(footer.html/footer-mobile.html)`)。

- [ ] **Step 3: 创建 `src/bootstrap.js`**

```js
import Alpine from 'alpinejs';
import collapse from '@alpinejs/collapse';
import './style.css';
import {headerData} from './components/header';
import {footerData} from './components/footer';

Alpine.plugin(collapse);
Alpine.data('headerData', headerData);
Alpine.data('footerData', footerData);
if (import.meta.env.DEV) window.Alpine = Alpine;
export default Alpine;
```

- [ ] **Step 4: 迁移 `src/index.js`**

- 删除文件顶部 `import Alpine from 'alpinejs';`、`import './style.css';`、`window.Alpine = Alpine;`。
- 改为 `import Alpine from './bootstrap';`。
- **删除** `Alpine.data('headerData', …)`(第 18–87 行)与 `Alpine.data('footerData', …)`(若有)。
- 保留 `Alpine.data('popoverData', …)` 与 `Alpine.data('data', …)`、`Alpine.start()`。

- [ ] **Step 5: 迁移 `src/index.html` 的页头包裹**

把第 53 行

```html
<div x-data="headerData" x-html="headerHtml"></div>
```

改为

```html
<div x-data="headerData('index')" x-html="headerHtml"></div>
```

- [ ] **Step 6: 构建验证**

Run: `pnpm build` Expected: 构建成功,无报错。

- [ ] **Step 7: 冒烟验证(index 页)**

Run: `pnpm dev`,打开首页。检查:

- 页头渲染,滚动到第 1 屏时页头为白底黑字(依赖 `swiperIndex`+`isLink`),后续屏为半透明黑底白字。
- 悬停「行业应用」「产品中心」出现三级下拉。
- 页面无重复页头(确认只渲染一份)。
- 富文本(关于我们)与资讯列表正常。

- [ ] **Step 8: Commit**

```bash
git add src/components/header.js src/components/footer.js src/bootstrap.js src/index.js src/index.html
git commit -m "refactor: 抽取共享 header/footer 组件与引导模块(index 页样本)"
```

---

### Task 2: 迁移其余所有页面到共享组件

**Files:**

- Modify: `src/about.js`、`src/cases.js`、`src/cases-detail.js`、`src/industry.js`、`src/jobs.js`、`src/news.js`、`src/news-detail.js`、`src/product-detail.js`、`src/products.js`、`src/solution-detail.js`
- Modify: `src/about.html`、`cases.html`、`cases-detail.html`、`industry.html`、`jobs.html`、`news.html`、`news-detail.html`、`product-detail.html`、`products.html`、`solution-detail.html`

**Interfaces:**

- Consumes: Task 1 的 `src/bootstrap.js`、`headerData(page)`、`footerData()`。
- Produces: 所有页面统一 `import Alpine from './bootstrap'`。

- [ ] **Step 1: 逐页删除重复定义并改导入**

对每个 `src/*.js`:

- 顶部改为 `import Alpine from './bootstrap';`,删除 `import Alpine from 'alpinejs';`、`import './style.css';`、`window.Alpine = Alpine;`。
- 删除 `Alpine.data('headerData', …)` 与 `Alpine.data('footerData', …)` 整块。
- `products.js`:额外删除 `import collapse from '@alpinejs/collapse';` 与 `Alpine.plugin(collapse);`(已由 bootstrap 统一注册)。
- 保留各页 `Alpine.data('data', …)` 与 `Alpine.start()`。

- [ ] **Step 2: 逐页改页头包裹的 `x-data` 参数**

将各页 `<div x-data="headerData" x-html="headerHtml"></div>` 改为传入页名,页名取值如下:

| 文件                   | 参数                                |
| ---------------------- | ----------------------------------- |
| `about.html`           | `headerData('about')`               |
| `cases.html`           | `headerData('cases')`               |
| `cases-detail.html`    | `headerData('cases')`               |
| `industry.html`        | `headerData('industries')`          |
| `jobs.html`            | `headerData('jobs')`                |
| `news.html`            | `headerData('news')`                |
| `news-detail.html`     | `headerData('news')`                |
| `product-detail.html`  | `headerData('products')`            |
| `products.html`        | `headerData('products', 'refresh')` |
| `solution-detail.html` | `headerData('products')`            |

> `productCategoryMode` 仅 `products.html` 传 `'refresh'`;`product-detail.html`/`solution-detail.html` 虽 `isLink === 'products'`,仍用默认跳转。

页脚包裹 `<div x-data="footerData" x-html="footerHtml"></div>` 保持不变(无需参数)。

- [ ] **Step 3: 构建验证**

Run: `pnpm build` Expected: 构建成功。

- [ ] **Step 4: 冒烟验证(全部页面)**

逐页打开,检查页头/页脚渲染、下拉菜单、页脚回顶按钮。 **重点** `products.html`:点击页头「产品中心」下的分类,页面内 Tab 列表应刷新(派发 `refreshCategory`),**不**打开新窗口。

- [ ] **Step 5: Commit**

```bash
git add src/*.js src/*.html
git commit -m "refactor: 全部页面迁移到共享 header/footer 组件"
```

---

### Task 3: async 数据层 `src/site/api.js`,移除旧 `src/header.js`

**Files:**

- Create: `src/site/api.js`
- Delete: `src/header.js`
- Modify: `src/components/header.js`、`src/index.js`、`src/products.js`、`src/about.js` 等所有引用 `./header` 的文件

**Interfaces:**

- Consumes: `cachedFetch`(`src/fetch-cache.js`)、`buildQueryString`(`src/utils.js`)。
- Produces:
  - `getIndustries(): Promise<Industry[]>`
  - `getCategories(): Promise<Category[]>`
  - `getProducts(): Promise<Product[]>`
  - `getCases(industryId): Promise<Case[]>`
  - `getAbout(id = 1): Promise<About>`
  - `getNews(currentPage = 1, pageSize = 4): Promise<{ data: News[] }>`
  - `submitMessage(form): Promise<Response>`

- [ ] **Step 1: 创建 `src/site/api.js`**

规则:`industries`/`categories` 走 `cachedFetch`(保留 sessionStorage 缓存);其余直接 `fetch(...).then(r => r.json())`。`getCases` 内部用 `buildQueryString({ filters: { industryId } })` 拼 URL。签名见上。

- [ ] **Step 2: 更新调用方**

- `src/components/header.js`:`getIndusties(cb)` → `await getIndustries()`;`getCategories(cb)` → `await getCategories()`(改成 `async init()`)。
- `src/index.js`、`src/products.js`、`src/about.js`:把 `getIndusties`/`getCategories` 回调写法改为 `await`,并改导入路径为 `./site/api`。
- 导入语句里的 `getIndusties`(拼写)统一改为 `getIndustries`。

- [ ] **Step 3: 删除旧文件**

```bash
git rm src/header.js
```

- [ ] **Step 4: 构建验证**

Run: `pnpm build` Expected: 构建成功;`grep -rn "getIndusties" src` 无输出。

- [ ] **Step 5: 冒烟验证**

检查:

- `products.html` 按 URL 的 `pId/index` 正确选中分类与 Tab。
- 各 `*-detail.html?id=...` 直链能加载富文本(见 Review Focus 第 4 条)。
- 打开 DevTools Network:首次加载命中 `/api/v1/industries/index`、`/api/v1/categories/index`;刷新(5 分钟内)应从 sessionStorage 命中不再请求(见 Review Focus 第 5 条)。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: 引入 async 数据层 site/api.js,移除旧 header.js 回调"
```

---

### Task 4: `Alpine.store('site')` 收拢共享数据

**Files:**

- Create: `src/site/store.js`
- Modify: `src/bootstrap.js`、`src/components/header.js`

**Interfaces:**

- Consumes: Task 3 的 `getIndustries`、`getCategories`。
- Produces: `registerSiteStore(Alpine)`;注册出 `Alpine.store('site')`,含字段 `industries: []`、`categories: []`、`isMobile: boolean`、`swiperIndex: number`、`loaded: boolean`,方法 `async load()`(幂等)。

- [ ] **Step 1: 创建 `src/site/store.js`**

```js
export function registerSiteStore(Alpine) {
  Alpine.store('site', {
    industries: [],
    categories: [],
    isMobile: matchMedia('(max-width: 768px)').matches,
    swiperIndex: 0,
    loaded: false,
    async load() {
      if (this.loaded) return;
      const [industries, categories] = await Promise.all([getIndustries(), getCategories()]);
      this.industries = industries;
      this.categories = categories;
      this.loaded = true;
    },
  });
}
```

- [ ] **Step 2: 在 `src/bootstrap.js` 注册**

导入并在 `Alpine.data(...)` 之后、`export default` 之前调用 `registerSiteStore(Alpine)`。

- [ ] **Step 3: `src/components/header.js` 改读 store**

- `init()` 改为 `await this.$store.site.load()`,随后在 header 组件内以 `$store.site.industries` / `$store.site.categories` 初始化下拉所需的三级列表。
- 移除组件内自持的 `parentIndustries`/`parentCategories` 取数与 `$watch` 逻辑,改为 `$watch('$store.site.industries', …)`(或提供 getter),保证 store 就绪后下拉列表联动。
- `isMobile` 改读 `$store.site.isMobile`。

- [ ] **Step 4: 空数据兜底检查**

确认下拉渲染用 `?.`(例如 `$store.site.industries[0]?.children || []`),当数组为空时不抛错。

- [ ] **Step 5: 构建验证**

Run: `pnpm build` Expected: 构建成功。

- [ ] **Step 6: 冒烟验证**

- 页头下拉、移动菜单数据正常。
- 临时在 DevTools 中把 `Alpine.store('site').industries = []` 后重新展开菜单,页面不报错(见 Review Focus 第 2 条)。

- [ ] **Step 7: Commit**

```bash
git add src/site/store.js src/bootstrap.js src/components/header.js
git commit -m "refactor: 引入 Alpine.store('site') 收拢导航共享数据"
```

---

### Task 5: 构建期 `#include` 内联,取代 `fetch + x-html`

**Files:**

- Create: `build/html-include.js`
- Move: `src/header.html` → `src/partials/header.html`;`src/header-mobile.html` → `src/partials/header-mobile.html`;`src/footer.html` → `src/partials/footer.html`;`src/footer-mobile.html` → `src/partials/footer-mobile.html`;`src/popover.html` → `src/partials/popover.html`
- Modify: `vite.config.js`、`src/components/header.js`、`src/components/footer.js`、全部页面 HTML

**Interfaces:**

- Produces: Vite 插件 `htmlInclude()`;页面中可用 `<!-- #include partials/xxx.html -->` 指令(路径相对当前 HTML 文件)。

- [ ] **Step 1: 创建 `build/html-include.js`**

```js
import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const INCLUDE_RE = /<!--\s*#include\s+(.+?)\s*-->/g;

export default function htmlInclude() {
  return {
    name: 'html-include',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const baseDir = dirname(ctx.filename ?? ctx.path);
        let out = html;
        let guard = 0;
        while (INCLUDE_RE.test(out) && guard++ < 20) {
          out = out.replace(INCLUDE_RE, (_, file) => readFileSync(resolve(baseDir, file), 'utf-8'));
        }
        return out;
      },
    },
  };
}
```

> 注意:`INCLUDE_RE` 带 `g` 标志,在 `while` 中 `test` 会推进 `lastIndex`;若一次替换后仍有残留,循环继续。实现时改用每次新建正则或 `out.match(INCLUDE_RE)` 判断,避免 `lastIndex` 副作用。

- [ ] **Step 2: 移动片段并注册插件**

- `git mv` 五个片段到 `src/partials/`。
- `vite.config.js`:导入 `htmlInclude` 并加入 `plugins: [htmlInclude()]`;从 `build.rolldownOptions.input` 中**删除** `header`、`header-mobile`、`footer`、`footer-mobile`、`popover` 五个入口。

- [ ] **Step 3: 消除片段根节点的 `x-data`,改为外层包裹提供作用域**

- `src/partials/header.html`:根 `<header … x-data="headerData" …>` 删除 `x-data="headerData"`,并加 `hidden md:block`。
- `src/partials/header-mobile.html`:根 `<header …>` 加 `md:hidden`,保留其内部 `x-data`(Task 6 再抽组件)。
- `src/partials/footer.html`、`footer-mobile.html`:根加 `hidden md:block` / `md:hidden`(与现有 footer 切换方式一致)。

- [ ] **Step 4: 改页面 HTML 为 include**

把每页 `<div x-data="headerData('xxx')" x-html="headerHtml"></div>` 改为:

```html
<div x-data="headerData('xxx')">
  <!-- #include partials/header.html -->
  <!-- #include partials/header-mobile.html -->
</div>
```

页脚同理:`<div x-data="footerData"><!-- #include partials/footer.html --><!-- #include partials/footer-mobile.html --></div>`。首页 popover:`<div x-data="popoverData"><!-- #include partials/popover.html --></div>`(popover 的定位与 `x-show` 处理留到 Task 6)。

- [ ] **Step 5: 从组件中删除运行时 fetch**

`src/components/header.js` 与 `footer.js`:删除 `headerHtml`/`footerHtml` 字段、`isMobile ? fetch(...)` 逻辑、`$nextTick` 包裹;`init()` 只保留数据处理。

- [ ] **Step 6: 构建验证 + 产物断言**

Run: `pnpm build` Expected: 构建成功;**且** `ls dist` 中不再单独出现 `header.html` / `footer.html`(验证入口已移除)。

```bash
test ! -f dist/header.html && test ! -f dist/footer.html && echo "OK: 片段已内联"
grep -l "传麒" dist/index.html >/dev/null && echo "OK: 首页已内联页头/页脚标记"
```

- [ ] **Step 7: 冒烟验证**

Run: `pnpm dev` 与 `pnpm build && pnpm preview`,检查:

- 首屏无页头闪烁(内联后应立即显示)。
- 桌面窗口显示桌面页头,缩到 <768px 显示移动页头,**任意断点只有一份页头可见**(见 Review Focus 第 1 条)。
- 页脚在桌面/移动正确切换。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: header/footer 片段改为构建期内联,移除运行时 fetch+x-html"
```

---

### Task 6: 抽取 navMenu / mobileNav / footer 静态数据,收纳进 `site/config.js`

**Files:**

- Create: `src/site/config.js`、`src/components/nav-menu.js`、`src/components/mobile-nav.js`、`src/components/popover.js`
- Modify: `src/bootstrap.js`、`src/partials/header.html`、`src/partials/header-mobile.html`、`src/partials/footer.html`、`src/partials/footer-mobile.html`、`src/partials/popover.html`
- Modify: `src/index.js`、`src/index.html`

**Interfaces:**

- Produces:
  - `src/site/config.js` → `export const menuList`、`export const popoverItems`、`export const footerProducts`、`export const footerSolutions`、`export const footerCases`。
  - `navMenu`(桌面下拉状态机:`navigationMenuOpen`、`navigationMenu`、`navigationMenuCloseDelay`、`pIndex`、`cIndex`、`pId` 及 `navigationMenu*`/`reposition`/`clear`/`close` 方法)。
  - `mobileNav`(`open`、`openIndustry`、`openCategory`)。
  - `popover`(`show(tooltip)`/`hide(tooltip)`,保留 Popper)。

- [ ] **Step 1: 创建 `src/site/config.js`**

把 `header.html`/`header-mobile.html` 内联的 `menus`/`menuList`、`footer.html`/`footer-mobile.html` 内联的 `products`/`solutions`/`cases`、`popover.html` 内联的 `items` 提取为常量导出。

- [ ] **Step 2: 创建三个组件模块并按 Task 1 的模式注册进 `src/bootstrap.js`**

`navMenu`/`mobileNav`/`popover` 从内联 `x-data` 原样搬运逻辑,数据改读 `src/site/config.js`。

- [ ] **Step 3: 片段 HTML 改用组件名**

- `partials/header.html` 的 `<nav x-data="{…}">` → `<nav x-data="navMenu">`。
- `partials/header-mobile.html` 的根 `<header x-data="{…}">` → `<header x-data="mobileNav" …>`(`parentIndustries`/`parentCategories` 及 `handle*` 仍从父级 `headerData` 作用域继承)。
- `partials/footer.html`、`footer-mobile.html` 中三个 `<ul x-data="{…}">` → 移除内联 `x-data`,改由 `footer` 组件暴露 `footerProducts`/`footerSolutions`/`footerCases`(或模板内 `x-data="footer"` 外层作用域)。
- `partials/popover.html`:移除内联 `x-data`,条目读 `popoverItems`。

- [ ] **Step 4: 首页 popover 包裹调整**

`src/index.js` 若定义了 `popoverData`,将其逻辑迁入 `src/components/popover.js` 并从 index 删除;`index.html` 的 popover 包裹与 `x-show="!isMobile"` 改读 `$store.site.isMobile`。

- [ ] **Step 5: 构建验证**

Run: `pnpm build` Expected: 构建成功。

- [ ] **Step 6: 冒烟验证**

- 桌面三级下拉:悬停展开、移动鼠标到面板不关闭(close-delay 生效)、移开关闭。
- 移动端菜单三项展开/收起。
- 页脚三列静态列表显示正确。
- 首页右下角浮层:悬停电话/QQ/微信显示 Popper 气泡与箭头。
- `products.html` 页头分类点击仍走 `refreshCategory`(Review Focus 第 3 条)。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: 抽取 navMenu/mobileNav/popover 组件,静态数据收进 site/config.js"
```

---

### Task 7: 抽取 tabs 组件,`swiperIndex` 改走 store

**Files:**

- Create: `src/components/tabs.js`
- Modify: `src/index.js`、`src/index.html`、`src/components/header.js`

**Interfaces:**

- Consumes: `$store.site`(industries/categories/swiperIndex)、`getCases`(Task 3)。
- Produces: `tabs`(首页工程案例 Tab:`tabSelected`、`tabId`、`tabButtonClicked`、`tabRepositionMarker`、`tabContentActive`、`tabButtonActive`,并触发 `getCases`)。

- [ ] **Step 1: 创建 `src/components/tabs.js`**

把 `index.html` 第 229–249 行内联的 Tab 逻辑抽出为 `tabs` 组件,注册进 `src/bootstrap.js`。

- [ ] **Step 2: `index.html` 改用 `x-data="tabs"`**

`index.html` 的工程案例区块 `<div x-data="{ tabSelected:1, … }">` → `<div x-data="tabs">`。

- [ ] **Step 3: `swiperIndex` 改走 store**

- `index.js` 的 `handleInitSwiper` 中 `this.$dispatch('set-swiper-index', realIndex)` → `this.$store.site.swiperIndex = realIndex`;删除 `window.addEventListener('set-swiper-index', …)`。
- `components/header.js` 中读取 `swiperIndex` 改为 `$store.site.swiperIndex`(模板里 `:class` 表达式同步改为 `$store.site.swiperIndex`)。

- [ ] **Step 4: 构建验证**

Run: `pnpm build` Expected: 构建成功;`grep -rn "set-swiper-index" src` 无输出。

- [ ] **Step 5: 冒烟验证**

- 首页竖向 Swiper 滚动切换后,页头在首屏变白底黑字、后续屏变透明黑底(store 联动生效)。
- 工程案例 Tab:点击不同行业,内容与底部标记移动、案例数据加载。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: 抽取 tabs 组件,swiperIndex 改为 store 通信"
```

---

### Task 8: 清理与全站回归

**Files:**

- Modify: 视残留而定

**Interfaces:**

- Consumes: 前序所有任务产出。

- [ ] **Step 1: 清理残留**

- 确认无 `window.Alpine = Alpine;`(除 bootstrap 中 DEV 分支)。
- 确认无 `x-html` 引用(除必要处)与 `fetch('.../header*.html')`。
- 确认无重复的 `Alpine.plugin(collapse)`。
- 删除被替代的空文件/无用导入。

```bash
grep -rn "x-html\|window.Alpine\|set-swiper-index" src || echo "OK: 无残留"
```

- [ ] **Step 2: 全站构建与格式化**

Run: `pnpm format:check && pnpm build` Expected: 均通过。

- [ ] **Step 3: 全站冒烟回归(逐页清单)**

- 首页:竖向 Swiper、产品内层轮播自动播放、行业悬浮遮罩、案例 Tab、关于我们富文本、资讯、留言表单提交。
- `products.html`:折叠面板 + 页头分类点击刷新 Tab。
- 各详情页(`cases-detail`/`news-detail`/`product-detail`/`solution-detail`):直链加载富文本。
- `about.html`:地图渲染、富文本。
- `industry.html`/`cases.html`/`news.html`/`jobs.html`:列表与分页/跳转。
- 所有页:页头(桌面/移动)、页脚(桌面/移动)、回顶。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: 清理重构残留并完成全站回归"
```

---

## Self-Review

- **Spec coverage**:spec 第 4.1 目录结构 → Task 1/3/4/5/6;4.2 数据与状态 → Task 3/4;4.3 组件层 → Task 1/2/6/7;4.4 构建期内联 → Task 5;4.5 引导 → Task 1;第 5 节验证 → 各任务冒烟 + Task 8;第 6 节五阶段 → 对应上述任务。
- **Review Focus 与任务对应**:第 1 条→Task 5;第 2 条→Task 4;第 3 条→Task 1/6;第 4 条→Task 2/3;第 5 条→Task 3。
- **命名一致性**:`headerData(page)`、`footerData()`、`getIndustries`/`getCategories`、`registerSiteStore`、`htmlInclude` 在定义与引用处一致。
- **超出范围**:路线 C(Popper 替换、`x-swiper` 指令)与测试框架未列入,符合 spec 非目标。
