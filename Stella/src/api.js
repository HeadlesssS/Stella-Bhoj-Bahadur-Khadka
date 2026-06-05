export const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function authHeaders(extra = {}) {
  const token = localStorage.getItem('access_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function req(url, opts = {}) {
  const res = await fetch(`${BASE}${url}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(err.detail || JSON.stringify(err)), { status: res.status, data: err });
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Profile ────────────────────────────────────────────────────────────────
export const getProfile = (username) =>
  req(`/profile/${encodeURIComponent(username)}/`, { headers: authHeaders() });

export const updateProfile = (username, formData) =>
  req(`/profile/${encodeURIComponent(username)}/`, {
    method: 'PUT',
    headers: authHeaders(),   // no Content-Type – let browser set multipart boundary
    body: formData,
  });

export const getUserPosts = (username, page = 1) =>
  req(`/profile/${encodeURIComponent(username)}/posts/?page=${page}`, { headers: authHeaders() });

export const getUserSavedStars = (username) =>
  req(`/profile/${encodeURIComponent(username)}/saved-stars/`, { headers: authHeaders() });

// ── Stars ──────────────────────────────────────────────────────────────────
export const isStarSaved = (starId) =>
  req(`/stars/${encodeURIComponent(starId)}/save/`, { headers: authHeaders() });

export const saveStar = (starId, starName) =>
  req(`/stars/${encodeURIComponent(starId)}/save/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ star_name: starName }),
  });

export const unsaveStar = (starId) =>
  req(`/stars/${encodeURIComponent(starId)}/save/`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

export const getStarPosts = (starId, page = 1) =>
  req(`/stars/${encodeURIComponent(starId)}/posts/?page=${page}`, { headers: authHeaders() });

// ── Posts ──────────────────────────────────────────────────────────────────
export const createPost = (formData) =>
  req('/posts/', {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

export const deletePost = (id) =>
  req(`/posts/${id}/`, { method: 'DELETE', headers: authHeaders() });

export const toggleLike = (postId) =>
  req(`/posts/${postId}/like/`, { method: 'POST', headers: authHeaders() });

// ── Comments ───────────────────────────────────────────────────────────────
export const getComments = (postId) =>
  req(`/posts/${postId}/comments/`, { headers: authHeaders() });

export const addComment = (postId, content) =>
  req(`/posts/${postId}/comments/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ content }),
  });

export const deleteComment = (id) =>
  req(`/comments/${id}/`, { method: 'DELETE', headers: authHeaders() });

// ── Discovery ──────────────────────────────────────────────────────────────
export const getTrendingStars = () =>
  req('/trending-stars/', { headers: authHeaders() });

export const getFeed = (page = 1, starId = null) => {
  const q = starId ? `?page=${page}&star_id=${encodeURIComponent(starId)}` : `?page=${page}`;
  return req(`/feed/${q}`, { headers: authHeaders() });
};

export const getStats = () =>
  req('/stats/', { headers: authHeaders() });

export const getEvents = () =>
  req('/events/', { headers: authHeaders() });
