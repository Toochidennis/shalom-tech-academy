import { csrfFetch } from './csrf';

const STORE_KEY = 'sstabac.news.v1';
const EMPTY_DEFAULTS = [];
let apiAvailable = null;

async function isApiAvailable() {
  if (apiAvailable !== null) return apiAvailable;
  try {
    const response = await fetch('api/news.php', { method: 'GET' });
    apiAvailable = response.headers.get('content-type')?.includes('application/json') || false;
  } catch {
    apiAvailable = false;
  }
  return apiAvailable;
}

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || JSON.stringify(EMPTY_DEFAULTS));
  } catch {
    return EMPTY_DEFAULTS;
  }
}

function writeLocal(posts) {
  localStorage.setItem(STORE_KEY, JSON.stringify(posts));
}

function now() {
  return new Date().toISOString();
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function uniqueSlug(slug, posts, ignoreId) {
  const base = slug || 'news';
  let next = base;
  let count = 1;
  while (posts.some((post) => post.slug === next && post.id !== ignoreId)) {
    next = `${base}-${count}`;
    count += 1;
  }
  return next;
}

function sortNewest(posts) {
  return [...posts].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const detail = payload.errors?.join(' ') || payload.message || 'Request failed.';
    throw new Error(detail);
  }
  return payload;
}

export async function getPublicNews() {
  if (await isApiAvailable()) {
    const payload = await parseResponse(await fetch('api/news.php'));
    return payload.news || [];
  }
  return sortNewest(readLocal().filter((post) => post.status === 'published'));
}

export async function getNewsBySlug(slug, { preview = false } = {}) {
  if (await isApiAvailable()) {
    const endpoint = preview ? `api/admin-news.php?slug=${encodeURIComponent(slug)}` : `api/news.php?slug=${encodeURIComponent(slug)}`;
    const response = preview ? await csrfFetch(endpoint) : await fetch(endpoint);
    const payload = await parseResponse(response);
    return payload.post || null;
  }
  const posts = preview ? readLocal() : readLocal().filter((post) => post.status === 'published');
  return posts.find((post) => post.slug === slug) || null;
}

export async function getAdminNews() {
  if (await isApiAvailable()) {
    const payload = await parseResponse(await csrfFetch('api/admin-news.php'));
    return payload.news || [];
  }
  throw new Error('Admin news requires the PHP backend.');
}

export async function getAdminNewsById(id) {
  if (await isApiAvailable()) {
    const payload = await parseResponse(await csrfFetch(`api/admin-news.php?id=${encodeURIComponent(id)}`));
    return payload.post || null;
  }
  throw new Error('Admin news requires the PHP backend.');
}

export async function saveNews(post, status, id) {
  const payload = {
    ...post,
    status,
    slug: post.slug || slugify(post.title),
  };

  if (await isApiAvailable()) {
    const endpoint = id ? `api/admin-news.php?id=${encodeURIComponent(id)}` : 'api/admin-news.php';
    const response = await csrfFetch(endpoint, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    return (await parseResponse(response)).post;
  }

  const posts = readLocal();
  if (id) {
    const index = posts.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('News post not found.');
    posts[index] = {
      ...posts[index],
      ...payload,
      slug: uniqueSlug(payload.slug, posts, id),
      updatedAt: now(),
    };
    writeLocal(posts);
    return posts[index];
  }

  const created = {
    ...payload,
    id: `local_${Date.now()}`,
    slug: uniqueSlug(payload.slug, posts),
    createdAt: now(),
    updatedAt: now(),
  };
  posts.push(created);
  writeLocal(posts);
  return created;
}

export async function deleteNews(id) {
  const response = await csrfFetch(`api/admin-news.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  await parseResponse(response);
}

export async function togglePublish(id, publish) {
  const action = publish ? 'publish' : 'unpublish';
  const response = await csrfFetch(`api/admin-news.php?action=${action}&id=${encodeURIComponent(id)}`, { method: 'POST' });
  return (await parseResponse(response)).post;
}

export async function uploadNewsImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const response = await csrfFetch('api/upload-news-image.php', {
    method: 'POST',
    body: formData,
  });
  return (await parseResponse(response)).image;
}
