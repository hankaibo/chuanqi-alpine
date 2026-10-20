# Tailwind CSS v3 → v4 升级 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Tailwind CSS 从 `3.4.19` 升级到 `4.3.3`,改用 `@tailwindcss/vite` 与 CSS-first `@theme` 配置,并在除「默认色板改为 oklch」外做到页面渲染与现状严格一致。

**Architecture:** 样式层从「PostCSS + `tailwind.config.js`」换成「`@tailwindcss/vite` 插件 + `src/style.css` 内的 `@theme` / `@source` / `@utility`」。`src/style.css` 成为唯一配置源,并在其中用 `@layer base` 兼容片段把 v4 改掉的 Preflight 行为钉回 v3。只对 7 处「取值会变」的类做等价修正,其余依赖 v4 的弃用别名保持不变。用产物 CSS 的规则级比对作为自动化闸门。

**Tech Stack:** Vite 8.3.4、Tailwind CSS 4.3.3、`@tailwindcss/vite` 4.3.3、Alpine.js 3.17.4、Swiper 14、pnpm 10、Node `>=22.22.1`。

**Spec:** `docs/superpowers/specs/2026-10-19-tailwind-v4-upgrade-design.md`

## Global Constraints

- 技术栈不变:不引入组件框架,不更换 Vite/Alpine;不改动页面 HTML 结构与视觉设计;页面 HTML 留在 `src/` 根目录。
- 后端 API 契约不变(`/api/v1/...`)。
- **渲染严格一致**:除「默认色板改为 oklch」这一项已批准的例外(spec §6.6),升级前后计算样式不得变化。所有已知静默差异按 spec §6 账本处置。
- 版本:`tailwindcss` 与 `@tailwindcss/vite` 均为 `4.3.3`;`postcss`、`autoprefixer` 必须移除;`postcss.config.cjs`、`tailwind.config.js` 必须删除。
- 不使用官方 codemod(`npx @tailwindcss/upgrade`)。
- 不采用 v4 新特性重写页面样式(本次只做等价迁移)。
- 不新增测试框架;每个任务的「测试」= `.superpowers/tw4/check-tN.sh` 断言脚本 + `pnpm build`。
- 每个任务结束必须:`pnpm build` 通过、`pnpm format:check` 全绿(仓库级)。
- **提交纪律(重要)**:工作树中存在三个与本任务无关的未提交改动,属于用户本地工作,**一律不得 stage、不得回滚**:
  1. `package.json` 删除了 `volta` 段;
  2. `src/news.js` 的 `item.cover?.path`(可选链兜底);
  3. `vite.config.js` 里一行被注释掉的备用 proxy target。因此**每个 commit 必须用精确文件路径 `git add`**,禁止 `git add -A` / `git add .`。
- `pnpm.overrides`、`engines`、`packageManager`、其余 11 个 HTML 入口配置均不动。

## Review Focus

以下五类是本升级最可能「悄悄改坏且不容易被肉眼发现」的地方,每一条都已在对应任务里固定了自动化验证:

1. **产物里出现「仅 v3 有」的工具类** —— 说明 `@source` 漏扫(片段/JS 没被扫到)或某页样式整块消失,页面会「看起来能用但样式掉了」。验证:Task 3 的比对报告 `仅 v3 有` 一节必须只剩白名单条目。
2. **Preflight 兼容层放错位置或被覆盖** —— `cursor:pointer` 若写进 `utilities` 之外的层且被后来规则盖掉,全站按钮没有手型(极易漏)。验证:`check-t1.sh` 断言 `src/style.css` 兼容层就位;Task 3 报告确认 base 层差异只有 spec §6 已列项。
3. **`jobs.html` 表格边框默认色** —— v4 默认边框色由 `#e5e7eb` 变为 `currentColor`,该表格唯一依赖它。漏改则边框变成 `#d8d8d8`(肉眼几乎不可辨,但确实是偏差)。验证:`check-t2.sh` 断言该处已显式写成 `border-gray-200`。
4. **`bg-right-bottom` → `bg-left-top`** —— v3 里 `bg-right-bottom` 是死类(配置 override),底图位置为 CSS 初值;漏改则首页产品区与关于页底图跳到右下。验证:`check-t2.sh` 断言全站无 `bg-right-bottom` 且两处含 `bg-left-top`。
5. **`shadow-sm` / `backdrop-blur-sm` 漏改** —— 这两个类名在 v4 里仍然存在但**取值变了**,不会报错、页面照常渲染,只是阴影/模糊值偏移。验证:`check-t2.sh` 断言全站无 `shadow-sm` / `backdrop-blur-sm`,且 `shadow-md`/`shadow-lg`/`hover:shadow`/`backdrop-blur-[10px]` 未被误伤。

---

### Task 1: 构建链切换到 Tailwind v4

**Files:**

- Modify: `package.json`(依赖)、`vite.config.js:1-15`(插件)、`src/style.css:1-33`(指令与配置)
- Delete: `postcss.config.cjs`、`tailwind.config.js`
- Regenerate: `pnpm-lock.yaml`
- Create(工作区,不提交): `.superpowers/tw4/baseline-v3/`、`.superpowers/tw4/check-t1.sh`
- Commit(仅此文件): `.github/workflows/static.yml`

**Interfaces:**

- Consumes: 无。
- Produces:
  - `vite.config.js` 默认导出中 `plugins: [tailwindcss(), htmlInclude()]`(`tailwindcss` 来自 `@tailwindcss/vite`)。
  - `src/style.css` 顶部依次为:`@import "tailwindcss" source(none);`、`@source "./**/*.{html,js}";`、`@theme { --color-primary: #4eb0b3; --breakpoint-3xl: 1792px; }`、`@layer base { button, [role="button"] { cursor: pointer } input::placeholder, textarea::placeholder { color: var(--color-gray-400) } }`、`@utility bg-right-2 { background-position: right 8px center; }`,`[x-cloak]` 规则、6 个 `@layer components` 组件类、`.gradient-box`、swiper 分页样式原样保留。
  - 供给后续任务:`bg-primary` 等自定义色、`3xl:` 断点、`bg-right-2` 在产物中可用。

- [ ] **Step 1: 捕获 v3 基线 CSS(必须在改动依赖之前)**

```bash
mkdir -p .superpowers/tw4/baseline-v3
pnpm build && cp dist/assets/*.css .superpowers/tw4/baseline-v3/
[ -n "$(ls -A .superpowers/tw4/baseline-v3)" ]
```

预期:命令全部退出码 0,`baseline-v3/` 内有若干 `.css`。

- [ ] **Step 2: 先提交 `static.yml` 的 prettier 修正(独立提交)**

`pnpm format:check` 在本计划开始前就因 `.github/workflows/static.yml` 的双引号风格失败(与 Tailwind 无关,但会挡住每个任务的格式检查)。若不希望保留此改动,执行 `git checkout -- .github/workflows/static.yml` 并改为每任务只检查自己触达的文件——默认保留。

```bash
git add .github/workflows/static.yml
git commit -m "chore: 修正 CI 工作流的 prettier 格式，使 pnpm check 可用"
```

- [ ] **Step 3: 增删依赖并删除旧配置文件**

```bash
pnpm remove tailwindcss postcss autoprefixer
pnpm add -D tailwindcss@4.3.3 @tailwindcss/vite@4.3.3
git rm postcss.config.cjs tailwind.config.js
```

预期:`package.json` 的 `devDependencies` 中 `tailwindcss` 为 `4.3.3`、新增 `@tailwindcss/vite`、不再有 `postcss`/`autoprefixer`。

- [ ] **Step 4: `vite.config.js` 换成 v4 插件**

在文件顶部加 `import tailwindcss from '@tailwindcss/vite';`,并把 `plugins: [htmlInclude()]` 改为 `plugins: [tailwindcss(), htmlInclude()]`。其余(11 个 `rolldownOptions.input`、`base`、`proxy`、`publicDir`)一律不动。

- [ ] **Step 5: 重写 `src/style.css` 的头部指令块**

用 `@import "tailwindcss" source(none);` 替换第 1–3 行的三条 `@tailwind` 指令,紧随其后写 `@source "./**/*.{html,js}";`(复刻原 `content: ['./src/**/*.{html,js}']` 语义),然后加入 `@theme`、`@layer base` 兼容层、`@utility bg-right-2`,如 Interfaces 所列。

**以下内容一行都不要改**:`[x-cloak]` 规则、`@layer components` 内的 6 个类(`.container-primary`、`.-container-primary`、`.nav-item--primary`、`.btn-primary`、`.btn-second`、`.divider-primary`)及其 `@apply` 内容、`.gradient-box`、`.swiper-pagination…` 两条规则。

**明确不迁移**(对应 spec §5.2):`height.18`、`translate.18`(v4 动态 spacing 天然等价)、`animation['spin-1'|'spin-2'|'spin-3']`(全站 0 引用)、`theme.backgroundPosition`(改由 `@utility bg-right-2` 承担)。

- [ ] **Step 6: 写 `.superpowers/tw4/check-t1.sh`**

```sh
#!/bin/sh
# Task 1 检查:构建链切换为 Tailwind v4,配置/兼容层/组件类就位,产物仍产出关键样式
set -e
cd /Users/hankaibo/project/chuanqi-alpine

# 1. v3 基线已捕获
[ -n "$(ls -A .superpowers/tw4/baseline-v3 2>/dev/null)" ]

# 2. 指令与配置迁移到位
grep -qF '@import "tailwindcss" source(none)' src/style.css
grep -qF '@source "./**/*.{html,js}"' src/style.css
grep -qF -- '--color-primary: #4eb0b3' src/style.css
grep -qF -- '--breakpoint-3xl: 1792px' src/style.css
grep -qF '@utility bg-right-2' src/style.css
! grep -qF '@tailwind ' src/style.css

# 3. Preflight 兼容层就位(Review Focus 第 2 条)
grep -qF '[role="button"]' src/style.css
grep -qF 'cursor: pointer' src/style.css
grep -qF 'color: var(--color-gray-400)' src/style.css

# 4. 原有样式内容未被误删
for t in '.container-primary' '.-container-primary' '.nav-item--primary' '.btn-primary' '.btn-second' '.divider-primary' '.gradient-box' 'swiper-pagination-bullet' '[x-cloak]'; do
  grep -qF -- "$t" src/style.css || { echo "FAIL: style.css 缺少 $t"; exit 1; }
done

# 5. 旧配置已删除、依赖已换
[ ! -f postcss.config.cjs ] && [ ! -f tailwind.config.js ]
node -e "const d=require('./package.json').devDependencies; if(d.postcss||d.autoprefixer) throw new Error('postcss/autoprefixer 未移除'); if(!/^4\./.test(d.tailwindcss)) throw new Error('tailwindcss 未升级到 v4'); if(!d['@tailwindcss/vite']) throw new Error('缺少 @tailwindcss/vite');"

# 6. 生产构建仍产出关键样式
pnpm build >/dev/null 2>&1
CSS=$(ls dist/assets/*.css | head -1)
grep -qF '.bg-primary' "$CSS"      # @theme 自定义色
grep -qF '.bg-right-2' "$CSS"      # @utility
grep -qF '.min-w-36' "$CSS"        # 只存在于 src/partials/popover.html → 证明片段被 @source 扫到
grep -qF '1792px' "$CSS"           # --breakpoint-3xl
echo "PASS: Task 1 — v4 构建链、配置、兼容层、组件类与产物样式全部就位"
```

- [ ] **Step 7: 运行 `check-t1.sh`**

Run: `sh .superpowers/tw4/check-t1.sh` Expected: 末行 `PASS: Task 1 — v4 构建链、配置、兼容层、组件类与产物样式全部就位`(失败则按 `FAIL:` 提示定位)

- [ ] **Step 8: 构建与格式检查**

Run: `pnpm format:check && pnpm build` Expected: 两者均退出码 0

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml vite.config.js src/style.css
git rm --cached postcss.config.cjs tailwind.config.js 2>/dev/null || true
git commit -m "build: 升级 Tailwind CSS v4 并改用 @tailwindcss/vite + CSS-first @theme"
```

注意:`postcss.config.cjs`、`tailwind.config.js` 已在 Step 3 用 `git rm` 移出索引;此处**不得** `git add -A`(见 Global Constraints 的提交纪律)。

---

### Task 2: 7 处取值一致性修正

**Files:**

- Modify: `src/partials/header.html:83`、`src/news.html:110`、`src/index.html:330,335,352`(`shadow-sm` → `shadow-xs`)
- Modify: `src/partials/header-mobile.html:42`(`backdrop-blur-sm` → `backdrop-blur-xs`)
- Modify: `src/index.html:139`、`src/about.html:22`(`bg-right-bottom` → `bg-left-top`)
- Modify: `src/jobs.html:27`(`border` → `border-gray-200`)
- Create(工作区,不提交): `.superpowers/tw4/check-t2.sh`

**Interfaces:**

- Consumes: Task 1 的 v4 构建链(`shadow-xs`/`backdrop-blur-xs`/`bg-left-top` 在 v4 中均存在且取值等于 v3 对应类)。
- Produces: 页面类名与 v4 取值对齐;`src/jobs.html` 第 27 行 `<ul>` 带显式 `border-gray-200`。

- [ ] **Step 1: 5 处 `shadow-sm` → `shadow-xs`**

`src/partials/header.html:83`、`src/news.html:110`、`src/index.html:330`、`src/index.html:335`、`src/index.html:352`。只替换该 token(`shadow-sm` → `shadow-xs`);同一行里的 `rounded-md`、`border-neutral-200/70`、`sm:flex-grow-0`、`-space-x-px` 等一律不动。

- [ ] **Step 2: 1 处 `backdrop-blur-sm` → `backdrop-blur-xs`**

`src/partials/header-mobile.html:42`(移动端菜单遮罩层)。注意 `src/index.html:110` 的 `backdrop-blur-[10px]` 是任意值语法,**不要动**。

- [ ] **Step 3: 2 处 `bg-right-bottom` → `bg-left-top`**

`src/index.html:139`、`src/about.html:22`。理由见 spec §6.4:v3 中该类的规则不存在(配置 override 了 `backgroundPosition`),底图实际位于 CSS 初值 `0% 0%`;`bg-left-top` 即 `left top` = `0% 0%`,保持现有渲染。`src/about.html:22` 的 `3xl:bg-[90%_75%]` 保留不动。

- [ ] **Step 4: `src/jobs.html:27` 显式补默认边框色**

把 `<ul class="border text-[#d8d8d8]">` 改为 `<ul class="border border-gray-200 text-[#d8d8d8]">`(v4 的 `gray-200` 精确等于 v3 的默认边框色 `#e5e7eb`)。全站只有这一处依赖 v3 的隐式默认边框色(spec §6.1)。

- [ ] **Step 5: 写 `.superpowers/tw4/check-t2.sh`**

```sh
#!/bin/sh
# Task 2 检查:7 处取值修正到位,且未误伤同类(Review Focus 第 3、4、5 条)
set -e
cd /Users/hankaibo/project/chuanqi-alpine

# shadow-sm → shadow-xs(5 处)
[ "$(grep -ro 'shadow-xs' src | wc -l | tr -d ' ')" -ge 5 ]
! grep -rq 'shadow-sm' src
grep -qF 'shadow-md' src/index.html        # 同类,不应被改
grep -qF 'shadow-lg' src/industry.html     # 同类,不应被改
grep -qF 'hover:shadow' src/news.html      # v4 别名,取值等于 v3 的 shadow,不应被改

# backdrop-blur-sm → backdrop-blur-xs(1 处)
grep -qF 'backdrop-blur-xs' src/partials/header-mobile.html
! grep -rq 'backdrop-blur-sm' src
grep -qF 'backdrop-blur-[10px]' src/index.html   # 任意值,不应被改

# bg-right-bottom → bg-left-top(2 处)
! grep -rq 'bg-right-bottom' src
grep -qF 'bg-left-top' src/index.html
grep -qF 'bg-left-top' src/about.html
grep -qF '3xl:bg-[90%_75%]' src/about.html        # 3xl 位置覆盖保留

# jobs.html 默认边框色单点修复
grep -qF 'border-gray-200' src/jobs.html
! grep -rqF 'class="border text-[#d8d8d8]"' src

# 产物里确实生成了新类名
pnpm build >/dev/null 2>&1
CSS=$(ls dist/assets/*.css | head -1)
for t in '.shadow-xs' '.backdrop-blur-xs' '.bg-left-top' '.border-gray-200'; do
  grep -qF -- "$t" "$CSS" || { echo "FAIL: 产物缺少 $t"; exit 1; }
done
echo "PASS: Task 2 — 7 处取值修正完成，同类未被误伤"
```

- [ ] **Step 6: 运行 `check-t2.sh`**

Run: `sh .superpowers/tw4/check-t2.sh` Expected: 末行 `PASS: Task 2 — 7 处取值修正完成，同类未被误伤`

- [ ] **Step 7: 构建与格式检查**

Run: `pnpm format:check && pnpm build` Expected: 两者均退出码 0

- [ ] **Step 8: Commit**

```bash
git add src/partials/header.html src/partials/header-mobile.html src/news.html src/index.html src/about.html src/jobs.html
git commit -m "fix: 按 Tailwind v4 取值对齐 7 处类名(阴影/背景模糊/背景位置/默认边框色)"
```

---

### Task 3: 产物 CSS 规则级比对与收口

**Files:**

- Create(工作区,不提交): `.superpowers/tw4/diff-css.mjs`、`.superpowers/tw4/after-v4/`、`.superpowers/tw4/report.md`、`.superpowers/tw4/check-t3.sh`
- Modify: 仅当报告暴露真实漏网时,修改对应源文件

**Interfaces:**

- Consumes: `.superpowers/tw4/baseline-v3/*.css`(Task 1 捕获)、Task 2 之后的 `dist/assets/*.css`。
- Produces: `.superpowers/tw4/report.md`,含四个小节标题**必须**精确为 `## 仅 v3 有`、`## 仅 v4 有`、`## 同名取值不同`、`## oklch 色板例外(已批准)`,条目以 `- ` 开头。

- [ ] **Step 1: 复制升级后的产物 CSS**

```bash
mkdir -p .superpowers/tw4/after-v4
pnpm build && cp dist/assets/*.css .superpowers/tw4/after-v4/
```

- [ ] **Step 2: 写 `.superpowers/tw4/diff-css.mjs`**

命令行:`node .superpowers/tw4/diff-css.mjs .superpowers/tw4/baseline-v3 .superpowers/tw4/after-v4 .superpowers/tw4/report.md`

归一化与解析规则(spec §7.2):

1. 把 CSS 解析为 `(媒体上下文, 选择器) → 声明列表`。
   - 进入 `@media (<cond>) { … }` 时把条件串压平(去掉空白)后压入媒体上下文;`@layer <name> { … }` 仅解包(并把 `<name>` 记为层)。
   - **跳过** `@property`、`@supports`、`@keyframes` 及其内容(以及 v4 独有的 `@layer properties` 整块)。
   - v3 侧(v3 无原生 layer):**只保留选择器中含 `.` 的规则**,以此排除 Preflight 的纯元素选择器(`html`、`h1`、`ol,ul`、`button`、`img` 等)。v4 侧:保留 `@layer utilities` 内的规则,以及所有层外的规则(`.gradient-box`、`[x-cloak]`、swiper 分页等自定义样式)。
2. 选择器归一化:压缩空白;保持转义(`.\!border-l-0`、`.py-2\.5`、`.border-neutral-200\/70`)原样,两侧一致即可。
3. 声明归一化:
   - 把 `url(data:…)` 替换为 `url(<inline>)`(Vite 会把小图片内联成 base64);
   - 把 `oklch(L% C H)` 与 `color-mix(in oklab|srgb, <color> <p>%, transparent)` 折算为 `rgb()/rgba()`(用 spec §6.6 的换算公式);
   - 压缩空白、统一引号。
4. 输出 `report.md`,四个小节标题精确如下,条目以 `- ` 开头:
   - `## 仅 v3 有` / `## 仅 v4 有`:格式 `- <媒体上下文> <选择器>`;
   - `## 同名取值不同`:**脚本无法自动归类的差异**,即真正的漏网。格式 `- <选择器>`,下辖缩进行 `  - v3: …` 与 `  - v4: …`;
   - `## oklch 色板例外(已批准)`:已归类的色板例外,格式同上,末行附 `共 N 条`。
5. 归类规则:对每个「两侧都存在但声明串不同」的条目,逐条比较其差异声明——当且仅当**所有**差异声明都满足「属性属于颜色类(`color`、`background-color`、`border-*-color`、`fill`、`stroke`、`--tw-*-color`、`--tw-*-opacity`)且两侧都能解析为颜色值」时,归入 `oklch 色板例外`;否则归入 `同名取值不同`。

- [ ] **Step 3: 生成报告并逐条判定**

Run: `node .superpowers/tw4/diff-css.mjs .superpowers/tw4/baseline-v3 .superpowers/tw4/after-v4 .superpowers/tw4/report.md`

**允许出现且必须能对上理由的条目(白名单)**,其余一律视为漏网、必须修到消失:

| 小节 | 允许条目 | 理由 |
| --- | --- | --- |
| 仅 v3 有 | `.shadow-sm`、`.backdrop-blur-sm` | Task 2 已等价改名为 `shadow-xs`/`backdrop-blur-xs`(spec §5.4) |
| 仅 v3 有 | 含 `space-x-` / `space-y-` / `divide-x` / `divide-y` 的旧选择器(`> :not([hidden]) ~ :not([hidden])`) | v4 机制改为 `:where(… > :not(:last-child))`,本项目用法渲染等价(spec §5.5) |
| 仅 v4 有 | `.shadow-xs`、`.backdrop-blur-xs`、`.bg-left-top`、`.border-gray-200` | Task 2 引入 |
| 仅 v4 有 | 上述 `space-*` / `divide-*` 的新选择器 | 同上 |
| 同名取值不同 | **必须为空**(0 条) | 该小节只接收脚本无法归类为色板例外的差异;非空即真实漏网,必须回到源文件修掉后重跑 |
| oklch 色板例外(已批准) | 全部条目 | 已批准的 oklch 默认色板例外(spec §6.6,D3);条目数与 spec §6.6 的 8 个色存在量级一致 |

判定时注意:媒体条件串在 v3 是 `(min-width:1024px)`、在 v4 是 `(width>=1024px)`,属**同一语义**,归一化阶段需折算为同一形式(如统一为 `min-width:1024px`),否则所有断点规则都会被误报为「仅 v3 有 / 仅 v4 有」。

- [ ] **Step 4: 写 `.superpowers/tw4/check-t3.sh`**

```sh
#!/bin/sh
# Task 3 检查:产物比对报告已产出,白名单外的差异一律判失败
set -e
cd /Users/hankaibo/project/chuanqi-alpine
R=.superpowers/tw4/report.md
[ -s "$R" ]
section() { awk -v s="$1" '$0 ~ "^## "s {f=1;next} /^## /{f=0} f' "$R" | grep '^- ' || true; }

for s in '仅 v3 有' '仅 v4 有' '同名取值不同' 'oklch 色板例外(已批准)'; do
  grep -qF "## $s" "$R" || { echo "FAIL: report 缺少小节 $s"; exit 1; }
done

# 「同名取值不同」是脚本无法归类为色板例外的真实漏网 → 必须为空
if [ -n "$(section '同名取值不同')" ]; then
  echo "FAIL: 存在无法归类的取值差异:"; section '同名取值不同'; exit 1
fi

# 「仅 v3 有」只允许已等价改名的两个类 + space/divide 的旧选择器
section '仅 v3 有' | grep -vE 'shadow-sm|backdrop-blur-sm|space-[xy]-|divide-[xy]' && {
  echo "FAIL: 仅 v3 有 出现白名单外条目"; exit 1; } || true

# 「仅 v4 有」只允许 Task 2 引入的四个类 + space/divide 的新选择器
section '仅 v4 有' | grep -vE 'shadow-xs|backdrop-blur-xs|bg-left-top|border-gray-200|space-[xy]-|divide-[xy]' && {
  echo "FAIL: 仅 v4 有 出现白名单外条目"; exit 1; } || true

echo "PASS: Task 3 — 产物 CSS 比对收口，差异全部可解释"
```

- [ ] **Step 5: 运行 `check-t3.sh`**

Run: `sh .superpowers/tw4/check-t3.sh` Expected: 末行 `PASS: Task 3 — 产物 CSS 比对收口,差异全部可解释`。若报告里出现白名单外的条目,**不要修改白名单来通过**:回到源文件修掉真实漏网,再重跑 Step 1–5。

- [ ] **Step 6: 提交(仅当本任务产生源码修改)**

```bash
git add <本任务实际改动的源文件>
git commit -m "fix: 收口产物 CSS 比对发现的样式差异"
```

若报告零漏网、本任务无源码改动,跳过提交,并把报告路径与结论记入 ledger。

---

### Task 4: 清理残留与文档收尾

**Files:**

- Modify: `README.md:37-66`(目录结构清单)
- Modify: 仅在存在残留时改动的其他文件
- Create(工作区,不提交): `.superpowers/tw4/check-t4.sh`

**Interfaces:**

- Consumes: Task 1–3 的成果。
- Produces: 仓库内无 v3 时代残留引用;`pnpm check` 全绿。

- [ ] **Step 1: 搜索 v3 时代残留**

```bash
rg -n --glob '!node_modules' --glob '!dist' --glob '!.superpowers' 'tailwind\.config|postcss|@tailwind |Tailwind CSS 3|3\.4\.19' .
```

预期命中:**只允许**出现在历史文档中——`docs/superpowers/specs/2026-10-19-alpine-refactor-design.md:12`、`docs/superpowers/plans/2026-10-19-alpine-refactor.md:9`(它们是 v1 当时状态的历史记录,**不要改写**),以及本次新增的 `docs/superpowers/specs/2026-10-19-tailwind-v4-upgrade-design.md`(其中「3.4.19」「postcss」是在描述被替换掉的旧状态)。`pnpm-lock.yaml` 的 `postcss` 条目也应已随依赖移除而消失——若仍在,说明 Step 3 的依赖移除没生效,回 Task 1 处理。

- [ ] **Step 2: 更新 `README.md` 的目录结构**

从目录结构清单中**删除** `postcss.config.cjs` 与 `tailwind.config.js` 两行;同时修正 `src/` 子树(它在 v1 重构后就已过时:`header.html`/`header-mobile.html`/`footer.html`/`footer-mobile.html`/`popover.html` 已移入 `src/partials/`,并新增了 `src/bootstrap.js`、`src/site/`、`src/components/`)。保持既有排版风格(`│   ├── ` 前缀对齐)。

- [ ] **Step 3: 写并运行 `.superpowers/tw4/check-t4.sh`**

```sh
#!/bin/sh
# Task 4 检查:v3 残留已清理,README 与仓库现状一致,整体 check 全绿
set -e
cd /Users/hankaibo/project/chuanqi-alpine
[ ! -f postcss.config.cjs ] && [ ! -f tailwind.config.js ]
! grep -qF 'postcss.config.cjs' README.md
! grep -qF 'tailwind.config.js' README.md
grep -qF 'src/partials/' README.md
! grep -qF '@tailwind ' src/style.css
[ ! -e node_modules/postcss ] || true
sh .superpowers/tw4/check-t1.sh >/dev/null
sh .superpowers/tw4/check-t2.sh >/dev/null
sh .superpowers/tw4/check-t3.sh >/dev/null
pnpm check >/dev/null
echo "PASS: Task 4 — 残留清理、README 同步、Task 1–3 与 pnpm check 全绿"
```

Run: `sh .superpowers/tw4/check-t4.sh` Expected: 末行 `PASS: Task 4 — 残留清理、README 同步、Task 1–3 与 pnpm check 全绿`

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: 同步 README 目录结构，移除已删除的 v3 配置文件"
```

---

## 完成后的交付与人工冒烟(不属于任何任务,由人执行)

自动化验证到这里结束。剩余必须由人在浏览器完成的冒烟(沿用 v1 清单,并叠加本次专项):

1. 每页桌面/移动:页头/页脚渲染、下拉菜单悬停与关闭、移动端菜单展开、页脚链接与回顶。
2. 首页:竖向 Swiper、产品内层轮播、行业悬浮遮罩、案例 Tab、富文本、资讯、留言提交、右下角客服气泡。
3. `products.html`:折叠面板 + 页头分类点击走 `refreshCategory`;`product-detail` / `solution-detail`:页头分类点击应**跳转**。
4. **本次专项**:
   - 全站按钮鼠标悬停应为手型(Task 1 兼容层);
   - 页头搜索框占位符颜色为 `#9ca3af` 系(Task 1 兼容层);
   - `news.html` 分页骨架屏与分页按钮的阴影(v3 的 `shadow-sm` 那 5 处);
   - 移动端菜单展开时遮罩仍有背景模糊(header-mobile 的 `backdrop-blur`);
   - `jobs.html` 招聘表格外框颜色(`border-gray-200`);
   - `about.html`「关于」页与首页产品区的底图位置(应仍在左上,即 `bg-left-top`);
   - 桌面下拉菜单、产品黄条、案例卡片仍能正常出现(验证没有整块样式丢失);
   - 首页竖向 Swiper、产品内层轮播、右下角客服气泡定位仍正常(验证 v4 把 `translate-*` 编译为独立 CSS 属性后,未与 Swiper/Popper 的内联 `transform` 冲突,spec §5.6)。
