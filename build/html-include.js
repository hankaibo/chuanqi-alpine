import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

const INCLUDE_RE = /<!--\s*#include\s+(.+?)\s*-->/g;

/**
 * 构建期 HTML 片段内联插件。
 *
 * 在页面 HTML 中写 `<!-- #include partials/header.html -->`,
 * 构建时把该片段内容原地替换进来(路径相对当前 HTML 文件)。
 * 支持嵌套(最多 20 层,防止自引用死循环)。
 */
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
        while (out.match(INCLUDE_RE) && guard++ < 20) {
          out = out.replace(INCLUDE_RE, (_, file) => readFileSync(resolve(baseDir, file), 'utf-8'));
        }
        return out;
      },
    },
  };
}
