# Tailwind CSS v3 → v4 升级设计

- 日期:2026-10-19
- 状态:已评审(待实施)
- 范围:构建链与样式层升级,保留 Vite + Alpine.js + Tailwind 技术栈,页面渲染与现状严格一致
- 前置:v1 重构已落地(见 `2026-10-19-alpine-refactor-design.md`),本设计在其之上做工具链升级

## 1. 背景

当前样式层为 Tailwind CSS **3.4.19**,通过 PostCSS 接入:

- `package.json`:`tailwindcss`、`postcss`、`autoprefixer`(均 `devDependencies`)
- `postcss.config.cjs`:`tailwindcss` + `autoprefixer` 插件
- `tailwind.config.js`:`content: ['./src/**/*.{html,js}']`,扩展 `height.18` / `translate.18` / `colors.primary` / `animation.spin-1|2|3` / `screens.3xl`,并 **override**(非 extend)`backgroundPosition: { 'right-2': … }`
- `src/style.css`:`@tailwind base/components/utilities` + `[x-cloak]` + `@layer components`(6 个组件类,含 `@apply`)+ `.gradient-box` + swiper 分页样式
- 页面 11 个 HTML 入口 + `src/partials/*.html` 片段(构建期 `#include` 内联)

Tailwind 最新版本为 **4.3.3**,是一次破坏性大版本升级:配置改为 CSS-first(`@theme`)、构建改用 `@tailwindcss/vite`、默认样式(Preflight)与部分类名/取值语义有变。

## 2. 动机

- **现代化**:v4 是官方唯一在维护的版本线,CSS-first 配置、原生层叠、`@property` 支持、动态 spacing、更快的构建链。
- **可维护性**:删掉 `postcss.config.cjs` 与 `tailwind.config.js` 两个配置文件,配置与样式同处 `style.css` 一处可读。
- **构建链简化**:`@tailwindcss/vite` 内置前缀处理,去掉 `postcss` + `autoprefixer` 两个依赖。
- 此前 v1 重构已确立「依赖可升级到最新版本、不受浏览器兼容性约束」的原则,本次兑现。

## 3. 目标与非目标

### 目标

- Tailwind 升级到 `4.3.3`,`@tailwindcss/vite` 接入,删除 PostCSS 与 JS 配置。
- **渲染与现状严格一致**:除「默认色板改为 oklch」外,页面在升级前后的计算样式无差异。
- 验证可自动复现:构建产物 CSS 的规则级比对,而非只靠肉眼冒烟。

### 非目标(本次不做)

- 不引入组件框架、不改动后端 API 契约、不改动页面 HTML 结构与视觉设计。
- 不刻意采用 v4 新特性重写页面(container queries、`@starting-style`、`color-mix` 调色等)——本次只做等价迁移,避免与「严格一致」目标冲突。
- 不使用官方 codemod(`npx @tailwindcss/upgrade`):它会重命名 30+ 个类并大范围改写文件,而实测本仓库真正必须改的只有 7 处,手工改动更小、更可审计。
- 不新增自动化测试框架(v1 的既有边界不变)。

## 4. 决策记录

| #   | 决策       | 结论                                                                                                 |
| --- | ---------- | ---------------------------------------------------------------------------------------------------- |
| D1  | 一致性尺度 | **严格一致**:所有会静默变样的差异一律钉回 v3 行为(见 §6 账本)                                        |
| D2  | 配置形态   | **CSS-first**:配置迁入 `src/style.css` 的 `@theme`,删除 `tailwind.config.js`;不使用 `@config` 兼容层 |
| D3  | 默认色板   | **接受 v4 的 oklch 色板**(唯一批准的例外,理由见 §6.6)                                                |
| D4  | 类名策略   | 只改「取值会变」的类;v4 仍以弃用别名保留原值的类**不动**(见 §5.4)                                    |
| D5  | 源扫描范围 | 显式 `@source "./**/*.{html,js}"` 复刻 v3 的 `content` 语义,避免 `docs/`、`public/`、`svg/` 被扫入   |
| D6  | 边框默认色 | 只对唯一依赖该默认值的元素做单点显式修复,**不加**全局 base 覆盖(见 §6.1)                             |

## 5. 目标设计

### 5.1 依赖与构建链

`package.json`:

- 移除:`tailwindcss@3.4.19`、`postcss`、`autoprefixer`
- 新增:`tailwindcss@4.3.3`、`@tailwindcss/vite@4.3.3`(peer 支持 Vite `^8`)

删除文件:`postcss.config.cjs`、`tailwind.config.js`。

`vite.config.js` 仅改插件数组,其余(11 个 `rolldownOptions.input` 入口、`htmlInclude`、`publicDir`)不动:

```js
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, projectRoot);
  return {
    root: resolve(projectRoot, 'src'),
    // …
    plugins: [tailwindcss(), htmlInclude()],
    // …
  };
});
```

### 5.2 `src/style.css`(新的唯一配置源)

```css
@import 'tailwindcss' source(none);
@source "./**/*.{html,js}";

@theme {
  --color-primary: #4eb0b3;
  --breakpoint-3xl: 1792px;
}

/* v3 Preflight 兼容层:钉回 v3 行为 */
@layer base {
  button,
  [role='button'] {
    cursor: pointer;
  }

  input::placeholder,
  textarea::placeholder {
    color: var(--color-gray-400);
  }
}

@utility bg-right-2 {
  background-position: right 8px center;
}

[x-cloak] {
  display: none !important;
}

@layer components {
  /* 6 个组件类原样保留:v4 中 @layer components + @apply 仍可用,
     且全站无 hover:btn-primary 之类的「对组件类用变体」用法,无需改 @utility */
}

.gradient-box {
  /* 原样保留 */
}
.swiper-pagination… {
  /* 原样保留 */
}
```

配置迁移对照:

| v3 配置                                                | v4 处置                                       | 说明                                                      |
| ------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------- |
| `content: ['./src/**/*.{html,js}']`                    | `source(none)` + `@source "./**/*.{html,js}"` | 实测复刻原语义,`docs/` `public/` `svg/` 不再被扫          |
| `theme.extend.colors.primary`                          | `--color-primary`                             | `bg-primary`/`text-primary` 等 68 处不变                  |
| `theme.extend.screens['3xl']: 1792px`                  | `--breakpoint-3xl`                            | `3xl:` 变体(jobs.html 大量使用)不变                       |
| `theme.extend.height[18]: 4.5rem`                      | **删除**                                      | v4 动态 spacing:`h-18` = `18 × 0.25rem` = 4.5rem,取值相同 |
| `theme.extend.translate[18]: 4.5rem`                   | **删除**                                      | 同上,`translate-y-18` = 4.5rem                            |
| `theme.extend.animation['spin-1'\|'spin-2'\|'spin-3']` | **删除**                                      | 全站 0 引用(已核)                                         |
| `theme.backgroundPosition: {'right-2'}`(override)      | **删除** + `@utility bg-right-2`              | 见 §6.4                                                   |
| `corePlugins.preflight`(注释掉)                        | 不迁移                                        | v3 也未启用                                               |

### 5.3 构建期片段内联

`build/html-include.js` 在 `transformIndexHtml` pre 阶段把 `<!-- #include partials/x.html -->` 内联进页面。因此 `src/partials/*.html` 是真实的类来源文件,必须被 `@source` 覆盖——上述 `./**/*.{html,js}` 已包含。

### 5.4 需要修改的类(共 7 处)

| 位置                                                    | 改法                 | 原因(实测)                                                                          |
| ------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------- |
| `shadow-sm` ×5                                          | → `shadow-xs`        | v4 把 `shadow-sm` 重定义为 v3 的 `shadow` 取值;v4 `shadow-xs` 才等于 v3 `shadow-sm` |
| `backdrop-blur-sm` ×1(`partials/header-mobile.html:42`) | → `backdrop-blur-xs` | v4 `backdrop-blur-sm` = 8px,≠ v3 的 4px                                             |
| `bg-right-bottom` ×2(`index.html:139`、`about.html:22`) | → `bg-left-top`      | 见 §6.4                                                                             |

**明确不改**(v4.3.3 仍以弃用别名提供且取值与 v3 相同,均已用真实构建产物核对):

`rounded`(13 处)、`shadow` / `hover:shadow`、`backdrop-blur-[10px]`、`!bg-[#a7d8d9]`(v4 同时接受前置 `!` 与后置 `!`)、`flex-shrink-0`、`sm:flex-grow-0`、`ring-1`、`border-none`、`text-ellipsis`、`box-decoration-clone`、`outline-offset-0`。

### 5.5 不需要处理的项(已核对,附理由)

| 项 | 结论 |
| --- | --- |
| `space-x-*` / `space-y-*`(13 处) | v3 生成 `A > :not([hidden]) ~ :not([hidden])` + `margin-right/left`;v4 生成 `:where(A > :not(:last-child))` + `margin-inline-start/end`。机制不同但**总间距与外边缘对称性一致**,本项目用法(页脚列表、首页栅格、分页 `-space-x-px`)排布等价 |
| `bg-[url(...)]`、`bg-[length:…]`、`bg-[90%_75%]`、`bg-[hsla(…)]` 任意值 | v4 语法不变;Vite 仍会把 `url()` 重写/内联 |
| `divide-x` / `divide-y` | 均带显式颜色(`divide-[#353948]`),不依赖 v3 默认色 |
| `ring-1` / `ring-inset` / `ring-gray-300` | 显式宽度与颜色,不受 v4「`ring` 默认由 3px 变 1px」影响(全站无裸 `ring`) |
| `outline-none` | 全站未使用(只有 `outline-offset-0`) |
| `bg-opacity-*` / `text-opacity-*` | 全站未使用 |
| `transition` + `hover:-translate-y-*` | v4 的默认 `transition-property` 已包含 `transform, translate, scale, rotate`,过渡行为不变 |
| 相对 `url()` 路径 | `bg-[url(./images/…)]` 仍由 Vite 相对 CSS 文件解析 |

### 5.6 不需要处理的项(逐处核对,附证据)

- **`translate/rotate/scale` 的编译产物变了**(v3 → `transform`;v4 → 独立的 `translate`/`rotate`/`scale` CSS 属性)。已逐处核对全站 20 处位移用法:没有任何元素「既带 Tailwind 位移类、又被 Swiper/Popper 写入内联 `transform`」。Swiper 的 `transform` 只写在 `.swiper-wrapper`(无位移类),Popper 的 `transform` 只写在 `.tooltip`(无位移类);`.arrow` 的 `transform: rotate(45deg)` 来自内联 `<style>`,该元素也无 Tailwind 位移类。渲染等价。

## 6. 一致性账本(静默差异的处置)

| # | 差异 | v3 实际行为 | v4 默认行为 | 处置 |
| --- | --- | --- | --- | --- |
| 1 | 默认边框色 | Preflight `*,::before,::after { border: 0 solid #e5e7eb }`(gray-200) | `border-color: currentColor` | 全站只有 `jobs.html:27` 的 `<ul class="border text-[#d8d8d8]">` 依赖它 → 显式写成 `border-gray-200`。**不**加全局 base 覆盖:那会把 v4 刻意移除的隐式默认重新引入到今后所有标记里。实测 v4 的 `gray-200` 精确等于 `#e5e7eb`,逐字节一致 |
| 2 | `<button>` 光标 | Preflight `button,[role=button]{cursor:pointer}` | 取消该规则(浏览器默认光标) | `@layer base` 兼容片段钉回,采用 v3 原样选择器(不加 `:not(:disabled)`,以保持一致) |
| 3 | `::placeholder` 颜色 | `#9ca3af`(gray-400) | `color-mix(in oklab, currentcolor 50%, transparent)` | 兼容片段钉回。全站仅 1 处 `<input placeholder>`(`partials/header.html` 搜索框) |
| 4 | `bg-right-bottom` | **失效**:v3 配置 override 了 `backgroundPosition`,产物中不存在该规则 → 底图位置取 CSS 初值 `0% 0%` | 生效为 `background-position: right bottom` | 两处改写为 `bg-left-top`(= `left top` = `0% 0%`),保住现有渲染。`about.html` 的 `3xl:bg-[90%_75%]` 保留 |
| 5 | `translate/rotate/scale` 机制 | 编译进 `transform` | 编译为独立 CSS 属性 | 见 §5.6,已逐处核对,无需处置 |

### 6.6 唯一批准的例外:默认色板 oklch

v4 把默认调色板从 hex 改为 `oklch()`。实测(把 v4 `theme.css` 的 oklch 反算回 sRGB,与本仓库 v3 产物中的 hex 逐个比对),本项目用到的 13 个默认色里 8 个存在单通道 ≤3/255 的偏差:

```
gray-50 / gray-100 / gray-200 / slate-200              完全一致
slate-500  #64748b → #62748e   Δ2
slate-600  #475569 → #45556c   Δ2
slate-700  #334155 → #314158   Δ2
gray-400   #9ca3af → #99a1af   Δ3
gray-500 / gray-700 / slate-900                        Δ0–1
```

**批准接受**(D3)。理由:这是 Tailwind v4 的官方默认且被官方描述为「同一批颜色,改用现代色空间表达」;偏差约 1%,不影响设计意图;反向钉回会让项目永久自带一份偏离上游的定制色板。

**其余「非视觉」的 v4 新增内容一并接受、不逐条钉回**:`@layer properties` 与 `@property` 块、Preflight 对表单控件新增的 `border-radius: 0` / `opacity: 1`、`table { border-color: inherit }`、`:-moz-focusring`(仅 Firefox)、`[hidden]` 规则附带 `!important`。这些不改变现有页面的计算样式。

## 7. 验证策略

沿用项目现状:无测试框架,验证 = 自动化工件比对 + 构建 + 人工冒烟。本次**新增**可自动复现的产物级比对,作为「严格一致」的硬证据。

### 7.1 基线捕获(必须在改动依赖之前执行)

在 v3 状态下 `pnpm build`,把 `dist/assets/*.css` 复制到 `.superpowers/tw4/baseline-v3/`。

### 7.2 产物 CSS 规则级比对

新增脚本 `.superpowers/tw4/diff-css.mjs`(工作区,不进提交):

1. 读取 v3 基线与 v4 新产物 CSS;
2. 归一化:过滤 Vite 内联的 `url(data:…)`;把 `oklch()` 与 `color-mix(srgb, oklch() α, transparent)` 折算为 `rgb()/rgba()`;v4 独有的 `@layer properties` / `@property` 标记为「已知新增」而不报差异;
3. 解析为「媒体查询 + 选择器 → 声明列表」记录;
4. 输出三类清单:**仅 v3 有 / 仅 v4 有 / 同名取值不同**。

判定标准:

- 「仅 v3 有」中不得出现页面仍在使用的工具类(否则说明 `@source` 漏扫或类名被删);
- 「同名取值不同」逐条必须能对应到 §5.4 的 7 处修正或 §6.6 的 oklch 色板;
- 其余全部归类为「v4 已知新增」并记录理由。

### 7.3 命令与冒烟

- `pnpm format:check` + `pnpm build`(即仓库既有 `pnpm check`)。
- 人工冒烟(沿用 v1 清单,重点覆盖本次风险面):
  - 每页桌面/移动:页头/页脚渲染、下拉菜单悬停、移动端菜单、页脚链接与回顶;
  - 首页:竖向 Swiper、产品内层轮播、行业悬浮遮罩、案例 Tab、富文本、资讯、留言提交、右下角客服气泡;
  - `products.html`:折叠面板 + 页头分类点击走 `refreshCategory`;
  - `product-detail` / `solution-detail`:页头分类点击应**跳转**;
  - **本次专项**:`news.html` 分页骨架屏与分页按钮阴影(v3 的 `shadow-sm` 那 5 处)、`header-mobile` 打开时的遮罩模糊(`backdrop-blur`)、`jobs.html` 表格边框色、`about.html` / `index.html` 底图位置、搜索框占位符颜色。

## 8. 分阶段实施

每阶段结束都必须 `pnpm build` 通过,才进入下一阶段。

1. **Phase 0 — 基线**:v3 状态下构建并保存基线 CSS(§7.1)。
2. **Phase 1 — 构建链切换**:依赖增删、删两个配置文件、`vite.config.js` 换插件、`style.css` 迁移(`@import` + `@source` + `@theme` + 兼容层 + `@utility`)。此阶段不动任何类名。
3. **Phase 2 — 类一致性修正**:§5.4 的 7 处。
4. **Phase 3 — 产物比对与收口**:建立 §7.2 脚本,逐条判定差异并归零或记录。
5. **Phase 4 — 清理**:搜索仓库是否残留 v3 引用(`tailwind.config`、`postcss`、`@tailwind ` 指令、文档描述),更新 `docs`/`README` 中相关表述;`pnpm check` 全绿。

## 9. 风险与缓解

| 风险                                                     | 缓解                                                                                                |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Preflight 变化未被完全枚举,造成局部视觉漂移              | §7.2 的规则级比对把「仅 v3 有 / 仅 v4 有」全部列出并逐条判定;§6 已枚举并处置已知项                  |
| `@source` 漏扫导致某些类不再生成                         | 比对中「仅 v3 有」一栏即为检测器;Phase 3 必须归零                                                   |
| v4 仍支持弃用别名,但未来大版本会移除                     | D4 已明确取舍:本次优先「改动最小 + 严格一致」,并在本设计记录这 10 个依赖别名的类,便于未来一次性迁移 |
| `translate` 属性化与 Swiper/Popper 内联 `transform` 冲突 | §5.6 已逐处核对无重叠元素;冒烟清单含轮播与气泡专项                                                  |
| 无自动化测试,回归靠人工                                  | 新增产物 CSS 比对作为自动化闸门(§7.2);冒烟作为兜底                                                  |

## 10. 后续可选(不在本次范围)

- 一次性把弃用别名类迁移到 v4 正式类名(`rounded` → `rounded-sm` 等),为 v5 做准备。
- 钉回 v3 hex 色板(预留:若 oklch 的 1% 偏差在实机被判定不可接受,可在 `@theme` 中覆盖用到的 13 个色)。
- 引入 Playwright 冒烟 + 截图像素比对,替代 CSS 规则级比对。
- 采用 v4 新特性重写样式层(container queries、`@starting-style`、`color-mix`)。

## 附录 A:关键实测证据

均在临时目录安装 `tailwindcss@4.3.3` / `@tailwindcss/cli@4.3.3` 后用 CLI 编译真实取值得到,未污染仓库。

| 结论 | 证据 |
| --- | --- |
| 弃用别名仍可用且取值与 v3 相同 | `.rounded{border-radius:.25rem}`、`.shadow{--tw-shadow:0 1px 3px 0 rgb(0 0 0/.1),…}`、`.blur{--tw-blur:blur(8px)}`、`.backdrop-blur{--tw-backdrop-blur:blur(8px)}`、`.flex-shrink-0`、`.flex-grow-0` 均正常生成 |
| `shadow-sm` / `backdrop-blur-sm` 取值确实改变 | v4 `.shadow-sm` = `0 1px 3px 0 …, 0 1px 2px -1px …`(v3 的 `shadow`);v4 `--blur-sm` = 8px(v3 的 `backdrop-blur-sm` = 4px) |
| `border` 不再设默认色 | v4 `.border{border-style:var(--tw-border-style);border-width:1px}`,无 `border-color`;Preflight `*{border:0 solid}` |
| 前置 `!` 与后置 `!` 均支持 | `.\!bg-red-500{…!important}` 与 `.bg-red-500\!{…!important}` 同时生成 |
| `bg-right-2` / `bg-left-top` | 前者需自定义(v4 无);`bg-left-top` 生成 `background-position: left top` |
| v3 Preflight 确有按钮手型 | v3 产物中含 `button,[role=button]{cursor:pointer}` |
| v3 产物中无 `bg-right-bottom` | 与 `theme.backgroundPosition` override 一致,证实该处底图位置为 CSS 初值 |
| `@source` 精确复刻 content 语义 | `source(none)` + `@source "./**/*.{html,js}"` 只扫 `src` 下的 html/js,`docs/*.md` 中的类名未被生成 |
| v4 动态 spacing 覆盖自定义 `h-18`/`translate-y-18` | `.h-18{height:calc(var(--spacing) * 18)}`、`.translate-y-18{translate: …}`,值均为 4.5rem |
| oklch 色板偏差量化 | 见 §6.6 的逐色对照 |
