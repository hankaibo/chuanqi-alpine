import {cachedFetch} from '../fetch-cache';
import {buildQueryString} from '../utils';

/**
 * 行业数据(带 sessionStorage 缓存),返回数组。
 */
function getIndustries() {
  return cachedFetch('/api/v1/industries/index');
}

/**
 * 产品分类(带 sessionStorage 缓存),返回数组。
 */
function getCategories() {
  return cachedFetch('/api/v1/categories/index');
}

/**
 * 首页轮播产品,返回数组。
 */
async function getProducts() {
  const res = await fetch('/api/v1/products/index');
  return res.json();
}

/**
 * 按行业 id 获取案例,返回 { data: [...] }。
 */
async function getCases(industryId) {
  const queryString = buildQueryString({filters: {industryId}});
  const res = await fetch(`/api/v1/cases/index?${queryString}`);
  return res.json();
}

/**
 * 关于我们,返回原始对象。
 */
async function getAbout(id = 1) {
  const res = await fetch(`/api/v1/about/${id}`);
  return res.json();
}

/**
 * 资讯中心列表,返回 { data: [...] }。
 */
async function getNews(currentPage = 1, pageSize = 4) {
  const res = await fetch(`/api/v1/news?currentPage=${currentPage}&pageSize=${pageSize}`);
  return res.json();
}

/**
 * 新增留言。
 */
function submitMessage(form) {
  return fetch('/api/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(form),
  });
}

export {getIndustries, getCategories, getProducts, getCases, getAbout, getNews, submitMessage};
