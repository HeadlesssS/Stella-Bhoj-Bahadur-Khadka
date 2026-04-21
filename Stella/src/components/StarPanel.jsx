import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './community.css';

import {
  isStarSaved, saveStar, unsaveStar,
  getStarPosts, createPost, deletePost, toggleLike,
  getComments, addComment, deleteComment,
} from '../api';

// Module-level cache: persists for the entire login session, keyed by star name
const chatSessionCache = {};

// ── helpers ────────────────────────────────────────────────────────────────
function Avatar({ user, size = 28 }) {
  if (user?.avatar_url) return <img src={user.avatar_url} alt="" className="post-avatar" style={{ width: size, height: size }} />;
  return <div className="post-avatar-ph" style={{ width: size, height: size, fontSize: size * 0.42 }}>{(user?.username?.[0] || '?').toUpperCase()}</div>;
}

function timeSince(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function PostCard({ post, currentUser, onUsernameClick, onDelete, onLikeChange }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commInput, setCommInput] = useState('');
  const [liked, setLiked] = useState(post.is_liked);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [loadingComments, setLoadingComments] = useState(false);

  const loadComments = async () => {
    setLoadingComments(true);
    try { setComments(await getComments(post.id)); } catch { /* ignore */ }
    setLoadingComments(false);
  };

  const toggleExpand = () => {
    if (!expanded) loadComments();
    setExpanded(v => !v);
  };

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      const res = await toggleLike(post.id);
      setLiked(res.liked); setLikeCount(res.like_count);
      onLikeChange && onLikeChange();
    } catch { /* ignore */ }
  };

  const submitComment = async () => {
    if (!commInput.trim() || !currentUser) return;
    try {
      const c = await addComment(post.id, commInput);
      setComments(prev => [...prev, c]);
      setCommInput('');
    } catch { /* ignore */ }
  };

  const removeComment = async (cid) => {
    try { await deleteComment(cid); setComments(prev => prev.filter(c => c.id !== cid)); } catch { /* ignore */ }
  };

  return (
    <div className="post-card">
      <div className="post-meta">
        <Avatar user={post.user} />
        <span className="post-username" onClick={() => onUsernameClick(post.user?.username)}>{post.user?.username}</span>
        <span className="post-time">{timeSince(post.created_at)}</span>
        {currentUser?.username === post.user?.username && (
          <button className="action-btn" style={{ marginLeft: 4, color: '#e25454' }} onClick={() => onDelete(post.id)}>🗑</button>
        )}
      </div>
      <div className="post-content">{post.content}</div>
      {post.image_url && <img src={post.image_url} alt="" className="post-image" />}
      <div className="post-actions">
        <button className={`action-btn${liked ? ' liked' : ''}`} onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {likeCount}
        </button>
        <button className="action-btn" onClick={toggleExpand}>
          💬 {post.comments_count} {expanded ? '▲' : '▼'}
        </button>
      </div>
      {expanded && (
        <div className="comments-section">
          {loadingComments && <div className="spinner">Loading…</div>}
          {comments.map(c => (
            <div key={c.id} className="comment-item">
              <Avatar user={c.user} size={22} />
              <div className="comment-body">
                <div className="comment-author" onClick={() => onUsernameClick(c.user?.username)}>{c.user?.username}</div>
                <div className="comment-text">{c.content}</div>
                <div className="comment-time">{timeSince(c.created_at)}</div>
              </div>
              {currentUser?.username === c.user?.username && (
                <button className="action-btn" style={{ color: '#e25454', alignSelf: 'flex-start' }} onClick={() => removeComment(c.id)}>✕</button>
              )}
            </div>
          ))}
          {currentUser && (
            <div className="comment-input-row">
              <input className="comment-input" value={commInput} onChange={e => setCommInput(e.target.value)}
                placeholder="Add a comment…"
                onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') submitComment(); }} />
              <button className="btn-primary" style={{ padding: '5px 12px' }} onClick={submitComment}>→</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Community Tab ──────────────────────────────────────────────────────────
function CommunityTab({ star, currentUser, onUsernameClick }) {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImg, setPostImg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async (p = 1, reset = false) => {
    setLoading(true);
    try {
      const res = await getStarPosts(star.name, p);
      const items = res.results ?? res;
      setPosts(prev => reset ? items : [...prev, ...items]);
      setHasMore(!!(res.next));
      setPage(p);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { setPosts([]); setPage(1); setHasMore(true); loadPosts(1, true); }, [star.name]);

  const submitPost = async () => {
    if (!postText.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('content', postText);
      fd.append('star_catalog_id', star.name);
      fd.append('star_name', star.name);
      if (postImg) fd.append('image', postImg);
      const newPost = await createPost(fd);
      setPosts(prev => [newPost, ...prev]);
      setPostText(''); setPostImg(null);
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleDelete = async (pid) => {
    try { await deletePost(pid); setPosts(prev => prev.filter(p => p.id !== pid)); } catch { /* ignore */ }
  };

  return (
    <div>
      {currentUser ? (
        <div className="new-post-area">
          <textarea rows={3} value={postText} onChange={e => setPostText(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder={`Share a thought about ${star.name}…`} />
          <div className="new-post-row">
            <label className="new-post-img-label">
              📷 {postImg ? postImg.name.slice(0, 14) + '…' : 'Image'}
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => setPostImg(e.target.files[0] || null)} />
            </label>
            <button className="btn-primary" onClick={submitPost} disabled={submitting || !postText.trim()}>
              {submitting ? '…' : 'Post'}
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-msg" style={{ marginBottom: 16 }}>Log in to post</div>
      )}

      {posts.length === 0 && !loading && <div className="empty-msg">No posts yet. Be the first!</div>}
      {posts.map(p => (
        <PostCard key={p.id} post={p} currentUser={currentUser}
          onUsernameClick={onUsernameClick} onDelete={handleDelete} />
      ))}
      {loading && <div className="spinner">Loading…</div>}
      {hasMore && !loading && (
        <button className="load-more-btn" onClick={() => loadPosts(page + 1)}>Load more</button>
      )}
    </div>
  );
}

// ── AI Chat Tab ────────────────────────────────────────────────────────────
// Receives messages/setMessages from StarPanel so history survives tab switches
function ChatTab({ star, messages, setMessages }) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const txt = input; setInput(''); setBusy(true);
    setMessages(prev => [...prev, { role: 'user', content: txt }]);
    try {
      const res = await fetch('/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: txt, star: { name: star.name, bv: star.bv, vmag: star.vmag, distance: star.distance, ra: star.ra, dec: star.dec } }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }]);
    } catch { setMessages(prev => [...prev, { role: 'bot', content: '⚠️ Error reaching Stella.' }]); }
    setBusy(false);
  };

  // Prevent typing in chat input from triggering camera movement
  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') send();
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="chat-messages">
        {messages.length === 0 && <div className="empty-msg">Ask Stella anything about {star.name}…</div>}
        {messages.map((m, i) => <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>)}
        {busy && <div className="chat-msg bot" style={{ opacity: .6 }}>Stella is thinking…</div>}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input className="chat-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Ask about this star…" />
        <button className="btn-primary" onClick={send} disabled={busy}>→</button>
        <button className="chat-clear" onClick={clearChat}>Clear</button>
      </div>
    </div>
  );
}

// ── Main StarPanel ─────────────────────────────────────────────────────────
export default function StarPanel({ star, user, onClose }) {
  const [tab, setTab] = useState('info');
  const [saved, setSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  // Chat history lives here (not inside ChatTab) so switching tabs never resets it.
  // It also reads/writes to chatSessionCache so history persists across different stars.
  const [chatMessages, setChatMessages] = useState(() => chatSessionCache[star.name] || []);
  const navigate = useNavigate();

  // Sync chat messages to the session cache whenever they change
  useEffect(() => {
    chatSessionCache[star.name] = chatMessages;
  }, [chatMessages, star.name]);

  // When the star changes, load that star's cached history (or start fresh)
  useEffect(() => {
    setChatMessages(chatSessionCache[star.name] || []);
  }, [star.name]);

  // border color based on B-V
  const borderColor = (() => {
    const bv = star.bv;
    if (bv == null) return '#4a90e2';
    if (bv < 0) return '#6ab4ff';
    if (bv < 0.6) return '#f0c040';
    return '#ff8844';
  })();

  useEffect(() => {
    setTab('info');
    if (!user) return;
    isStarSaved(star.name).then(r => setSaved(r.saved)).catch(() => {});
  }, [star.name, user]);

  const toggleSave = async () => {
    if (!user || savingState) return;
    setSavingState(true);
    try {
      if (saved) { await unsaveStar(star.name); setSaved(false); }
      else { await saveStar(star.name, star.name); setSaved(true); }
    } catch { /* ignore */ }
    setSavingState(false);
  };

  return (
    <div className={`star-panel open`} style={{ borderLeftColor: borderColor }}>
      <div className="star-panel-header">
        <div className="star-panel-title">✦ {star.name}</div>
        <button className="star-panel-close" onClick={onClose}>×</button>
        <div className="panel-tabs">
          {['info', 'community', 'chat'].map(t => (
            <div key={t} className={`panel-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'info' ? 'Info' : t === 'community' ? 'Community' : 'AI Chat'}
            </div>
          ))}
        </div>
      </div>

      <div className="panel-body">
        {tab === 'info' && (
          <>
            {[['Name', star.name], ['Color (B-V Index)', star.bv?.toFixed(3) ?? 'N/A'],
              ['Size (Magnitude)', star.vmag?.toFixed(2) ?? 'N/A'], ['Distance from Earth', `${star.distance} pc`],
              ['Galactic Longitude', star.GLON], ['Galactic Latitude', star.GLAT]].map(([l, v]) => (
              <div className="info-row" key={l}><span className="info-label">{l}</span><span className="info-val">{v}</span></div>
            ))}
            {user && (
              <button className={`save-btn${saved ? ' saved' : ''}`} onClick={toggleSave} disabled={savingState}>
                {saved ? '★ Saved' : '☆ Save Star'}
              </button>
            )}
          </>
        )}
        {tab === 'community' && (
          <CommunityTab star={star} currentUser={user}
            onUsernameClick={uname => navigate(`/profile/${uname}`)} />
        )}
        {tab === 'chat' && (
          <ChatTab
            star={star}
            messages={chatMessages}
            setMessages={setChatMessages}
          />
        )}
      </div>
    </div>
  );
}
