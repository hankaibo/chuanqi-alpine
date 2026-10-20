#!/usr/bin/env node
// 产物 CSS 规则级比对:把两次构建的 CSS 解析成「(媒体上下文, 选择器) → 声明集合」后逐条比对。
//
// 用途:本项目没有视觉回归测试,升级 Tailwind(或任何会影响样式产物的依赖)时,
// 用这份报告代替肉眼,确认没有「静默变样」。
//
// 用法:
//   node scripts/css-diff.mjs <基线目录> <新产物目录> [报告路径]
//   pnpm css:diff        # 构建后与 scripts/css-baseline/ 比对
//   pnpm css:baseline    # 确认变更符合预期后,用当前产物刷新基线
//
// 退出码:0 = 无差异;1 = 有差异(报告里逐条列出);2 = 用法错误。
//
// 归一化原则:只折算「写法不同但渲染等价」的机制差异,任何会影响计算值的改动都必须报出来。
//   - theme 变量(@theme 产物)与 @property 初值求值
//   - --tw-* 内部机制变量在求值后丢弃
//   - calc() 求值;rem 按 16px 根字号折算为 px
//   - 颜色统一折算为 rgb(r,g,b,a)(hex / oklch / color-mix)
//   - translate/rotate/scale 独立属性折算回统一的 transform 表达式
//   - box-shadow 变量链求值后丢弃透明/零尺寸阴影项
//   - 逻辑属性(padding-inline 等)与简写按 LTR/horizontal-tb 展开为物理长属性
//   - 单位数 line-height 按同规则 font-size 折算为 px
//   - 供应商前缀属性在有标准同名属性时不参与比较
//   - 媒体条件 (width>=N) 与 (min-width:N) 视为同一语义

import fs from 'node:fs';
import path from 'node:path';

const [, , baseDir, nextDir, reportArg] = process.argv;
if (!baseDir || !nextDir) {
  console.error('usage: node scripts/css-diff.mjs <baseDir> <nextDir> [reportPath]');
  process.exit(2);
}
if (!fs.existsSync(baseDir) || !fs.existsSync(nextDir)) {
  console.error(`目录不存在: ${!fs.existsSync(baseDir) ? baseDir : nextDir}`);
  process.exit(2);
}
const reportPath = reportArg ?? 'css-report.md';

/* ------------------------------------------------------------------ 解析 */

function parseNodes(css) {
  const nodes = [];
  let i = 0;
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;
    if (css[i] === '}') {
      i++;
      continue;
    }
    const brace = css.indexOf('{', i);
    if (brace === -1) break;
    const semi = css.indexOf(';', i);
    if (semi !== -1 && semi < brace) {
      i = semi + 1;
      continue;
    }
    const prelude = css.slice(i, brace).trim();
    let depth = 1;
    let j = brace + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    nodes.push({prelude, body: css.slice(brace + 1, j - 1)});
    i = j;
  }
  return nodes;
}

function parseDecls(body) {
  const out = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      out.push(body.slice(start, i));
      start = i + 1;
    }
  }
  out.push(body.slice(start));
  return out.map((d) => d.trim()).filter(Boolean);
}

function splitDecl(d) {
  const i = d.indexOf(':');
  return i === -1 ? null : [d.slice(0, i).trim(), d.slice(i + 1).trim()];
}

function splitTopLevel(s, sep) {
  const out = [];
  let depth = 0;
  let quote = null;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      if (ch === '\\') i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth++;
    else if (ch === ')' || ch === ']') depth--;
    else if (ch === sep && depth === 0) {
      out.push(s.slice(start, i));
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

/* --------------------------------------------------------- theme/property */

function collectThemeVars(nodes, vars) {
  for (const n of nodes) {
    if (/^@layer\s+theme\b/.test(n.prelude)) {
      for (const r of parseNodes(n.body)) {
        if (r.prelude.startsWith('@')) continue;
        for (const d of parseDecls(r.body)) {
          const kv = splitDecl(d);
          if (kv && kv[0].startsWith('--')) vars[kv[0]] = kv[1];
        }
      }
    } else if (n.prelude.startsWith('@media') || n.prelude.startsWith('@supports')) {
      collectThemeVars(parseNodes(n.body), vars);
    }
  }
}

function collectPropertyInitials(css, vars) {
  const re = /@property\s+(--[\w-]+)\s*\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const init = /initial-value\s*:\s*([^;]+)/.exec(m[2]);
    if (init) vars[m[1]] = init[1].trim();
  }
}

/* --------------------------------------------------------------- 颜色 */

const NAMED_COLORS = {
  transparent: [0, 0, 0, 0],
  white: [255, 255, 255, 1],
  black: [0, 0, 0, 1],
};

function oklchToRgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  return lin.map((x) => Math.max(0, Math.min(255, Math.round(255 * gamma(x)))));
}

function parseColorFn(fn) {
  const m = /^(oklch|color-mix|rgba?|hsla?)\(([\s\S]*)\)$/i.exec(fn.trim());
  if (!m) return null;
  const name = m[1].toLowerCase();
  const body = m[2];

  if (name === 'oklch') {
    const [main, alphaPart] = body.split('/');
    const [L, C, H] = main.trim().split(/\s+/);
    const rgb = oklchToRgb(parseFloat(L) / (L.includes('%') ? 100 : 1), parseFloat(C), parseFloat(H));
    let alpha = 1;
    if (alphaPart !== undefined) {
      alpha = alphaPart.includes('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
    }
    return [...rgb, alpha];
  }

  if (name === 'color-mix') {
    const args = splitTopLevel(body, ',');
    if (args.length < 3) return null;
    // 与 transparent 混合 = 该颜色降低 alpha(预乘 alpha 插值)
    let solid = null;
    let pct = 100;
    for (const it of args.slice(1)) {
      const pm = /^(.*?)(?:\s+([\d.]+)%)?$/.exec(it.trim());
      if (it.includes('transparent')) {
        pct = pm[2] !== undefined ? 100 - parseFloat(pm[2]) : pct;
        continue;
      }
      const col = parseColorToken(pm[1].trim());
      if (col) {
        solid = col;
        if (pm[2] !== undefined) pct = parseFloat(pm[2]);
      }
    }
    if (!solid) return null;
    return [solid[0], solid[1], solid[2], +(solid[3] * (pct / 100)).toFixed(4)];
  }

  if (name === 'rgb' || name === 'rgba') {
    const [main, alphaPart] = body.split('/');
    const nums = main
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (nums.length < 3) return null;
    const ch = nums.slice(0, 3).map((x) => (x.endsWith('%') ? Math.round((parseFloat(x) / 100) * 255) : parseFloat(x)));
    let alpha = 1;
    if (alphaPart !== undefined) alpha = parseFloat(alphaPart);
    else if (nums[3] !== undefined) alpha = parseFloat(nums[3]);
    if (alphaPart !== undefined && alphaPart.includes('%')) alpha = parseFloat(alphaPart) / 100;
    return [...ch, alpha];
  }

  return null;
}

function parseColorToken(tok) {
  const t = tok.trim();
  if (!t) return null;
  if (NAMED_COLORS[t.toLowerCase()]) return NAMED_COLORS[t.toLowerCase()];
  const m = /^#([0-9a-f]{3,8})$/i.exec(t);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4)
      h = h
        .split('')
        .map((c) => c + c)
        .join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    return [r, g, b, a];
  }
  if (/^(oklch|color-mix|rgba?|hsla?)\(/i.test(t)) return parseColorFn(t);
  return null;
}

function fmtColor([r, g, b, a]) {
  return `rgb(${r},${g},${b},${Math.abs(a - 1) < 1e-6 ? 1 : +a.toFixed(4)})`;
}

function canonColors(value) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    const rest = value.slice(i);
    const fn = /^(oklch|color-mix|rgba?|hsla?)\(/i.exec(rest);
    if (fn) {
      let depth = 0;
      let j = i + fn[1].length;
      for (; j < value.length; j++) {
        if (value[j] === '(') depth++;
        else if (value[j] === ')') {
          depth--;
          if (depth === 0) {
            j++;
            break;
          }
        }
      }
      const raw = value.slice(i, j);
      const c = parseColorFn(raw);
      out += c ? fmtColor(c) : raw;
      i = j;
      continue;
    }
    if (value[i] === '#') {
      const m = /^#([0-9a-f]{3,8})(?![\w-])/i.exec(rest);
      if (m) {
        const c = parseColorToken(m[0]);
        out += c ? fmtColor(c) : m[0];
        i += m[0].length;
        continue;
      }
    }
    const nm = /^(transparent|white|black)(?![\w-])/i.exec(rest);
    if (nm) {
      out += fmtColor(NAMED_COLORS[nm[1].toLowerCase()]);
      i += nm[1].length;
      continue;
    }
    out += value[i];
    i++;
  }
  return out;
}

/* ---------------------------------------------------------------- 数值 */

function fmtNumber(n) {
  return String(+n.toFixed(6));
}

function evalExpr(s) {
  let i = 0;
  const skip = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  function primary() {
    skip();
    if (s[i] === '(') {
      i++;
      const r = sum();
      skip();
      if (s[i] === ')') i++;
      return r;
    }
    if (s[i] === '-') {
      i++;
      const r = primary();
      return r && {v: -r.v, u: r.u};
    }
    const m = /^(\d*\.?\d+)([a-z%]*)/i.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return {v: parseFloat(m[1]), u: (m[2] || '').toLowerCase()};
  }
  function product() {
    let l = primary();
    if (!l) return null;
    for (;;) {
      skip();
      const op = s[i];
      if (op !== '*' && op !== '/') break;
      i++;
      const r = primary();
      if (!r) return null;
      l = op === '*' ? {v: l.v * r.v, u: l.u || r.u} : {v: l.v / r.v, u: l.u};
    }
    return l;
  }
  function sum() {
    let l = product();
    if (!l) return null;
    for (;;) {
      skip();
      const op = s[i];
      if (op !== '+' && op !== '-') break;
      i++;
      const r = product();
      if (!r) return null;
      if (l.u && r.u && l.u !== r.u) return null;
      l = {v: op === '+' ? l.v + r.v : l.v - r.v, u: l.u || r.u};
    }
    return l;
  }
  const r = sum();
  if (!r) return null;
  skip();
  return i >= s.length ? r : null;
}

function resolveCalcs(value) {
  let v = value;
  for (let k = 0; k < 12; k++) {
    const m = /calc\(([^()]*)\)/.exec(v);
    if (!m) break;
    const r = evalExpr(m[1]);
    v = r ? v.slice(0, m.index) + fmtNumber(r.v) + r.u + v.slice(m.index + m[0].length) : v.slice(0, m.index) + `__CALC__${m[1]}__` + v.slice(m.index + m[0].length);
  }
  return v.replace(/__CALC__([\s\S]*?)__/g, 'calc($1)');
}

const remToPx = (v) => v.replace(/(-?\d*\.?\d+)rem\b/g, (m, n) => `${fmtNumber(parseFloat(n) * 16)}px`);

/* ------------------------------------------------------------ 声明归一化 */

// 逻辑属性 → 物理长属性;padding/margin/inset/border 简写 → 长属性。
// 扩展方向固定为 LTR + horizontal-tb。
const LOGICAL = {
  'padding-inline': ['padding-left', 'padding-right'],
  'padding-block': ['padding-top', 'padding-bottom'],
  'margin-inline': ['margin-left', 'margin-right'],
  'margin-block': ['margin-top', 'margin-bottom'],
  'inset-inline': ['left', 'right'],
  'inset-block': ['top', 'bottom'],
};
const SHORTHAND = {
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  inset: ['top', 'right', 'bottom', 'left'],
  'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  'border-style': ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
  'border-color': ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
};

function expandBox(props) {
  for (const [k, targets] of Object.entries(LOGICAL)) {
    if (!props.has(k)) continue;
    const v = props.get(k);
    props.delete(k);
    for (const t of targets) props.set(t, v);
  }
  for (const [k, targets] of Object.entries(SHORTHAND)) {
    if (!props.has(k)) continue;
    const parts = splitTopLevel(props.get(k), ' ')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) continue;
    let vals;
    if (parts.length === 1) vals = [parts[0], parts[0], parts[0], parts[0]];
    else if (parts.length === 2) vals = [parts[0], parts[1], parts[0], parts[1]];
    else if (parts.length === 3) vals = [parts[0], parts[1], parts[2], parts[1]];
    else vals = [parts[0], parts[1], parts[2], parts[3]];
    props.delete(k);
    targets.forEach((t, i) => props.set(t, vals[i]));
  }
}

function normalizeLineHeight(props) {
  const lh = props.get('line-height');
  const fs = props.get('font-size');
  if (lh && fs && /^\d*\.?\d+$/.test(lh) && /^(-?[\d.]+)px$/.test(fs)) {
    props.set('line-height', `${+(parseFloat(lh) * parseFloat(fs)).toFixed(2)}px`);
  }
}

// 偏移/模糊/扩散全为 0 的阴影不可见(常用于占位)
function isZeroShadow(s) {
  const toks = splitTopLevel(s, ' ')
    .map((t) => t.trim())
    .filter(Boolean);
  if (!toks.length) return true;
  if (!/^(currentcolor|rgb\()/.test(toks[toks.length - 1])) return false;
  const lengths = toks.slice(0, -1).filter((t) => /^-?[\d.]+(px|rem|em)?$/.test(t));
  return lengths.length > 0 && lengths.every((t) => parseFloat(t) === 0);
}

// animation 简写:关键帧名可以出现在任意位置,统一挪到末尾再比较
function normalizeAnimation(v) {
  const parts = splitTopLevel(v, ' ')
    .map((s) => s.trim())
    .filter(Boolean);
  const isTime = (s) => /^-?[\d.]+m?s$/.test(s);
  const isEase = (s) => /^(cubic-bezier|steps|linear|ease)/.test(s);
  const isCount = (s) => s === 'infinite' || /^\d*\.?\d+$/.test(s);
  const isKeyword = (s) => /^(normal|reverse|alternate|alternate-reverse|none|forwards|backwards|both|running|paused)$/.test(s);
  return [
    ...parts.filter(isTime),
    ...parts.filter((p) => !isTime(p) && (isEase(p) || isCount(p) || isKeyword(p))),
    ...parts.filter((p) => !isTime(p) && !isEase(p) && !isCount(p) && !isKeyword(p)),
  ].join(' ');
}

// transition-property 是集合语义:顺序/新增项不影响既有属性的过渡效果
function transitionEquivalent(a, b) {
  const norm = (s) =>
    new Set(
      s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
    );
  const A = norm(a);
  const B = norm(b);
  if (A.size !== B.size) return false;
  for (const x of A) if (!B.has(x)) return false;
  return true;
}

/* ------------------------------------------------------------ 规则抽取 */

function normMedia(cond) {
  return cond
    .replace(/\s+/g, '')
    .replace(/\(width>=([^)]+)\)/g, (m, v) => `(min-width:${v})`)
    .replace(/\(width<=([^)]+)\)/g, (m, v) => `(max-width:${v})`)
    .replace(/(min-width|max-width):(-?\d*\.?\d+)rem/g, (m, p, n) => `${p}:${fmtNumber(parseFloat(n) * 16)}px`);
}

const normSelector = (sel) =>
  sel
    .split(',')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .join(',');

function collectRules(nodes, ctx, rules) {
  for (const n of nodes) {
    if (/^@media\b/.test(n.prelude)) {
      const cond = normMedia(n.prelude.slice(6).trim());
      collectRules(parseNodes(n.body), {...ctx, media: ctx.media ? `${ctx.media} and ${cond}` : cond}, rules);
    } else if (/^@layer\b/.test(n.prelude)) {
      const name = n.prelude.slice(6).trim();
      if (name === 'theme' || name === 'properties') continue;
      collectRules(parseNodes(n.body), {...ctx, layer: name}, rules);
    } else if (n.prelude.startsWith('@')) {
      continue; // @supports / @keyframes / @property / @font-face … 不参与规则比对
    } else {
      for (const sel of splitTopLevel(n.prelude, ',')) {
        rules.push({...ctx, selector: normSelector(sel), body: n.body});
      }
    }
  }
}

const COLOR_PROP = /^(color|background-color|border(-(top|right|bottom|left))?-color|outline-color|fill|stroke|text-decoration-color|caret-color|accent-color|--tw-[\w-]*color|--tw-[\w-]*-opacity)$/;

function buildMap(file) {
  const css = fs.readFileSync(file, 'utf8');
  const propertyVars = {};
  collectPropertyInitials(css, propertyVars);
  const themeVars = {};
  const nodes = parseNodes(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  collectThemeVars(nodes, themeVars);

  const rules = [];
  collectRules(nodes, {media: '', layer: null}, rules);
  const map = new Map();

  for (const rule of rules) {
    const sel = rule.selector;
    // 只要含类名的规则,以及 [attr] 这类自定义规则;纯元素选择器(Preflight)不比对
    if (!sel.includes('.') && !sel.startsWith('[')) continue;

    const decls = parseDecls(rule.body).map(splitDecl).filter(Boolean);
    const scope = {};
    for (const [k, v] of decls) if (k.startsWith('--')) scope[k] = v;

    const lookup = (name) => scope[name] ?? themeVars[name] ?? propertyVars[name];
    const resolve = (v) => {
      let cur = v;
      for (let k = 0; k < 20; k++) {
        const next = cur.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (m, name, fb) => {
          const val = lookup(name);
          if (val !== undefined && !/^(initial|inherit|unset|revert)$/.test(val.trim())) return val;
          if (fb !== undefined && fb.trim() !== '') return fb.trim();
          return '';
        });
        if (next === cur) break;
        cur = next;
      }
      return cur;
    };

    const props = new Map();
    for (const [k, v] of decls) {
      if (k.startsWith('--tw-')) continue; // 机制变量:仅参与求值,不参与比较
      props.set(k, resolve(v));
    }

    // transform:v3 的 transform 表达式 / v4 的 translate、rotate、scale 独立属性 → 统一表达式
    const hasTransformMech = ['transform', 'translate', 'rotate', 'scale'].some((k) => props.has(k)) || ['--tw-translate-x', '--tw-rotate', '--tw-scale-x'].some((k) => scope[k] !== undefined);
    if (hasTransformMech) {
      const v = (k, d) => (scope[k] !== undefined ? resolve(scope[k]) : d);
      let tx = '0';
      let ty = '0';
      if (props.has('translate')) {
        const p = splitTopLevel(props.get('translate'), ' ')
          .map((s) => s.trim())
          .filter(Boolean);
        tx = p[0] ?? '0';
        ty = p[1] ?? '0';
      } else {
        tx = v('--tw-translate-x', '0');
        ty = v('--tw-translate-y', '0');
      }
      const rot = props.has('rotate') ? props.get('rotate') : v('--tw-rotate', '0');
      let sx = '1';
      let sy = '1';
      if (props.has('scale')) {
        const p = splitTopLevel(props.get('scale'), ' ')
          .map((s) => s.trim())
          .filter(Boolean);
        sx = p[0] ?? '1';
        sy = p[1] ?? p[0] ?? '1';
      } else {
        sx = v('--tw-scale-x', '1');
        sy = v('--tw-scale-y', '1');
      }
      const skx = v('--tw-skew-x', '0');
      const sky = v('--tw-skew-y', '0');
      const pctToNum = (x) => (/^-?[\d.]+%$/.test(x) ? String(parseFloat(x) / 100) : x);
      for (const k of ['transform', 'translate', 'rotate', 'scale']) props.delete(k);
      props.set('transform', `translate(${tx},${ty}) rotate(${rot}) skew(${skx},${sky}) scale(${pctToNum(sx)},${pctToNum(sy)})`);
    }

    for (const [k, v0] of [...props.entries()]) {
      let v = resolveCalcs(v0);
      v = remToPx(v);
      v = v.replace(/url\((['"]?)data:[^)]*\1\)/g, 'url(<inline>)');
      v = v.replace(/\s+/g, ' ').trim();
      v = canonColors(v);
      v = v
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ',')
        .trim();
      // 渐变方向可能放在 --tw-gradient-position 里
      if (k === 'background-image' && scope['--tw-gradient-position'] !== undefined) {
        const pos = resolve(scope['--tw-gradient-position'])
          .replace(/\s+in\s+[\w-]+\s*$/, '')
          .trim();
        if (pos) v = v.replace(/^linear-gradient\(/, `linear-gradient(${pos}, `);
      }
      // 完全圆角的不同表达(极小数 / 极大数)等价
      if (k.endsWith('radius') && /^\d+px$/.test(v) && parseFloat(v) >= 9999) v = '9999px';
      if (k === 'animation') v = normalizeAnimation(v);
      v = v.replace(/-?(?:\d+\.\d+|\.\d+)/g, (m) => String(+parseFloat(m).toFixed(4)));
      if (k === 'box-shadow') {
        v = splitTopLevel(v, ',')
          .map((s) => s.trim())
          .filter((s) => s && !isZeroShadow(s))
          .join(',');
      }
      v = v.replace(/,\s*\)/g, ')');
      if (v === '') props.delete(k);
      else props.set(k, v);
    }

    // 供应商前缀:有无前缀同名属性时,前缀版本不参与比较
    for (const k of [...props.keys()]) {
      const m = /^-(?:webkit|moz|ms|o)-(.+)$/.exec(k);
      if (m && props.has(m[1])) props.delete(k);
    }

    // border-style:solid 是默认值,显式声明与默认等价
    for (const k of ['border-style', 'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style']) {
      if (/^solid(\s*!important)?$/.test(props.get(k) ?? '')) props.delete(k);
    }

    expandBox(props);
    normalizeLineHeight(props);

    const key = `${rule.media || '(base)'} :: ${sel}`;
    const rendered = [...props.entries()]
      .map(([k, v]) => `${k}:${v}`)
      .sort()
      .join(';');
    // 同一选择器多条规则:后者覆盖前者
    map.set(key, {rendered, props: new Map(props)});
  }

  return map;
}

/* ------------------------------------------------------------------ 主流程 */

const bundleOf = (f) => f.split('-')[0];
const listCss = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.css'));

const baseFiles = new Map(listCss(baseDir).map((f) => [bundleOf(f), path.join(baseDir, f)]));
const nextFiles = new Map(listCss(nextDir).map((f) => [bundleOf(f), path.join(nextDir, f)]));

if (!baseFiles.size) {
  console.error(`基线目录没有 CSS 产物: ${baseDir}`);
  process.exit(2);
}

const onlyBase = [];
const onlyNext = [];
const colorDiff = [];
const realDiff = [];
let baseRules = 0;
let nextRules = 0;

for (const bundle of new Set([...baseFiles.keys(), ...nextFiles.keys()])) {
  const a = baseFiles.get(bundle);
  const b = nextFiles.get(bundle);
  if (!a || !b) {
    realDiff.push({bundle, key: '(bundle 文件缺失)', diffs: [['', a ? 'present' : 'absent', b ? 'present' : 'absent']]});
    continue;
  }
  const m1 = buildMap(a);
  const m2 = buildMap(b);
  baseRules += m1.size;
  nextRules += m2.size;

  for (const key of new Set([...m1.keys(), ...m2.keys()])) {
    const x = m1.get(key);
    const y = m2.get(key);
    if (x && !y) {
      onlyBase.push({bundle, key});
      continue;
    }
    if (!x && y) {
      onlyNext.push({bundle, key});
      continue;
    }
    if (x.rendered === y.rendered) continue;

    const diffs = [];
    for (const n of new Set([...x.props.keys(), ...y.props.keys()])) {
      const va = x.props.get(n);
      const vb = y.props.get(n);
      if (va === vb) continue;
      if (n === 'transition-property' && va !== undefined && vb !== undefined && transitionEquivalent(va, vb)) continue;
      diffs.push([n, va, vb]);
    }
    if (!diffs.length) continue;

    const allColor = diffs.every(([n, va, vb]) => COLOR_PROP.test(n) && va !== undefined && vb !== undefined && !!parseColorToken(va) && !!parseColorToken(vb));
    if (allColor) colorDiff.push({bundle, key, diffs});
    else realDiff.push({bundle, key, diffs});
  }
}

const fmtKey = (e) => `[${e.bundle}] ${e.key}`;
const total = onlyBase.length + onlyNext.length + colorDiff.length + realDiff.length;

let md = `# 产物 CSS 规则级比对报告\n\n`;
md += `- 基线:${baseDir}(${baseRules} 条规则)\n`;
md += `- 新产物:${nextDir}(${nextRules} 条规则)\n\n`;
md += `归一化(只折算渲染等价的写法差异):theme 变量与 \`@property\` 初值求值、\`--tw-*\` 机制变量求值后丢弃、\`calc()\` 求值、\n`;
md += `\`rem\` 按 16px 根字号折算为 \`px\`、颜色统一折算为 \`rgb()\`(含 \`oklch\`/\`color-mix\`)、\`translate/rotate/scale\` 折算回 \`transform\`、\n`;
md += `\`box-shadow\` 链求值并丢弃零尺寸项、逻辑属性/简写按 LTR 展开为物理长属性、单位数 \`line-height\` 折算为 \`px\`、\n`;
md += `供应商前缀与 \`border-style:solid\` 折叠、媒体条件 \`(width>=N)\` ≡ \`(min-width:N)\`。\n\n`;

md += `## 仅基线有\n\n`;
for (const e of onlyBase) md += `- ${fmtKey(e)}\n`;
if (!onlyBase.length) md += `_(无)_\n`;

md += `\n## 仅新产物有\n\n`;
for (const e of onlyNext) md += `- ${fmtKey(e)}\n`;
if (!onlyNext.length) md += `_(无)_\n`;

md += `\n## 同名取值不同\n\n`;
for (const e of realDiff) {
  md += `- ${fmtKey(e)}\n`;
  for (const [n, va, vb] of e.diffs) md += `  - ${n || '(文件)'}: 基线 \`${va ?? '(缺失)'}\` → 新 \`${vb ?? '(缺失)'}\`\n`;
}
if (!realDiff.length) md += `_(无)_\n`;

md += `\n## 仅颜色取值不同\n\n`;
for (const e of colorDiff) {
  md += `- ${fmtKey(e)}\n`;
  for (const [n, va, vb] of e.diffs) md += `  - ${n}: 基线 \`${va}\` → 新 \`${vb}\`\n`;
}
if (!colorDiff.length) md += `_(无)_\n`;
md += `\n共 ${colorDiff.length} 条\n`;

fs.writeFileSync(reportPath, md);

console.log(`仅基线有 ${onlyBase.length} / 仅新产物有 ${onlyNext.length} / 同名取值不同 ${realDiff.length} / 仅颜色不同 ${colorDiff.length}`);

if (total === 0) {
  console.log('PASS: 产物 CSS 与基线逐条一致');
  process.exit(0);
}

console.log(`FAIL: 共有 ${total} 处差异,逐条见 ${reportPath}`);
console.log('      若确认这些变更符合预期,运行 `pnpm css:baseline` 刷新基线。');
process.exit(1);
