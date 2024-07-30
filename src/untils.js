function buildQueryString(obj, prefix) {
  const str = [];
  for (const p in obj) {
    if (obj.hasOwnProperty(p)) {
      const k = prefix ? `${prefix}[${p}]` : p;
      const v = obj[p];
      str.push(v !== null && typeof v === 'object' ? buildQueryString(v, k) : `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    }
  }
  return str.join('&');
}

// 计算缩略图的地址
function getThumbnailUrl(path) {
  if (!path) {
    return '';
  }
  const separator = path.includes('files/') ? 'files/' : path?.includes('files\\') ? 'files\\' : '';
  const [http, name] = path.split(separator);
  return `${http}files/thumbnail_${name.split('.')[0]}.webp`;
}

export {buildQueryString, getThumbnailUrl};
