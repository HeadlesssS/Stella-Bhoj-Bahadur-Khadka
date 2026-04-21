import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './community.css';
import { getProfile, updateProfile, getUserPosts, getUserSavedStars } from '../api';

function timeSince(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function PostMini({ post, onUsernameClick }) {
  return (
    <div className="post-card">
      <div className="post-meta">
        {post.user?.avatar_url
          ? <img src={post.user.avatar_url} alt="" className="post-avatar" />
          : <div className="post-avatar-ph">{(post.user?.username?.[0] || '?').toUpperCase()}</div>}
        <span className="post-username" onClick={() => onUsernameClick(post.user?.username)}>{post.user?.username}</span>
        {post.star_name && <span style={{ color: '#f0c040', fontSize: 11, marginLeft: 4 }}>✦ {post.star_name}</span>}
        <span className="post-time">{timeSince(post.created_at)}</span>
      </div>
      <div className="post-content">{post.content}</div>
      {post.image_url && <img src={post.image_url} alt="" className="post-image" />}
      <div className="post-actions">
        <span className="action-btn">🤍 {post.like_count}</span>
        <span className="action-btn">💬 {post.comments_count}</span>
      </div>
    </div>
  );
}

function EditProfileModal({ profile, username, onSave, onCancel }) {
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('bio', bio);
      if (avatar) fd.append('avatar', avatar);
      const updated = await updateProfile(username, fd);
      onSave(updated);
    } catch (e) {
      setErr(e.message || 'Error saving profile');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(6,8,24,.97)', border: '1px solid rgba(74,144,226,.3)',
        borderRadius: 14, padding: 28, width: 360, maxWidth: '90vw' }}>
        <h3 style={{ color: '#4a90e2', margin: '0 0 18px', fontSize: 16 }}>Edit Profile</h3>
        <div className="edit-form-field">
          <label>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
        </div>
        <div className="edit-form-field">
          <label>Avatar</label>
          <input type="file" accept="image/*" onChange={e => setAvatar(e.target.files[0] || null)}
            style={{ background: 'none', border: 'none', color: '#8890aa', padding: 0 }} />
        </div>
        {err && <div style={{ color: '#e25454', fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button onClick={onCancel} style={{ background: 'none', border: '1px solid #333',
            color: '#8890aa', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? '…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage({ currentUser, onFlyToStar, starData = [] }) {
  const { username } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedStars, setSavedStars] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);

  const isOwn = currentUser?.username === username;

  useEffect(() => {
    setLoading(true); setPosts([]); setPostsPage(1); setHasMorePosts(true);
    Promise.all([getProfile(username), getUserSavedStars(username), getUserPosts(username, 1)])
      .then(([prof, stars, postsRes]) => {
        setProfile(prof);
        setSavedStars(stars.results ?? stars);
        const items = postsRes.results ?? postsRes;
        setPosts(items);
        setHasMorePosts(!!postsRes.next);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  const loadMorePosts = async () => {
    const next = postsPage + 1;
    try {
      const res = await getUserPosts(username, next);
      const items = res.results ?? res;
      setPosts(prev => [...prev, ...items]);
      setHasMorePosts(!!res.next);
      setPostsPage(next);
    } catch { /* ignore */ }
  };

  const handleSavedStarClick = (s) => {
    const star = starData.find(sd => sd.name === s.star_name || sd.name === s.star_catalog_id);
    if (star) { onFlyToStar && onFlyToStar(star); navigate('/'); }
  };

  if (loading) return (
    <div className="profile-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ fontSize: 16 }}>Loading profile…</div>
    </div>
  );

  if (!profile) return (
    <div className="profile-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="empty-msg">User not found</div>
    </div>
  );

  const joined = profile.joined ? new Date(profile.joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  return (
    <div className="profile-overlay">
      <div className="profile-container">
        {/* Back button */}
        <button className="profile-back" onClick={() => navigate(-1)}>← Back to Space</button>

        {/* Header */}
        <div className="profile-header">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" className="profile-avatar-big" />
            : <div className="profile-avatar-ph-big">{profile.username?.[0]?.toUpperCase() || '?'}</div>}
          <div className="profile-info">
            <div className="profile-username">✦ {profile.username}</div>
            <div className="profile-bio">{profile.bio || (isOwn ? 'No bio yet — click Edit to add one.' : 'No bio.')}</div>
            <div className="profile-stats">
              <div className="profile-stat">
                <div className="profile-stat-n">{profile.posts_count}</div>
                <div className="profile-stat-l">Posts</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-n">{profile.saved_stars_count}</div>
                <div className="profile-stat-l">Saved Stars</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-n" style={{ fontSize: 13 }}>{joined}</div>
                <div className="profile-stat-l">Joined</div>
              </div>
            </div>
          </div>
          {isOwn && (
            <button className="edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <div className={`profile-tab${tab === 'posts' ? ' active' : ''}`} onClick={() => setTab('posts')}>Posts</div>
          <div className={`profile-tab${tab === 'stars' ? ' active' : ''}`} onClick={() => setTab('stars')}>Saved Stars</div>
        </div>

        {/* Posts tab */}
        {tab === 'posts' && (
          <div>
            {posts.length === 0 && <div className="empty-msg">No posts yet.</div>}
            {posts.map(p => (
              <PostMini key={p.id} post={p} onUsernameClick={u => navigate(`/profile/${u}`)} />
            ))}
            {hasMorePosts && (
              <button className="load-more-btn" onClick={loadMorePosts}>Load more</button>
            )}
          </div>
        )}

        {/* Saved stars tab */}
        {tab === 'stars' && (
          <div>
            {savedStars.length === 0 && <div className="empty-msg">No saved stars yet.</div>}
            {savedStars.map(s => (
              <div key={s.id} className="saved-star-card" onClick={() => handleSavedStarClick(s)}>
                <div className="saved-star-dot" style={{ background: '#4a90e2' }} />
                <div>
                  <div className="saved-star-name">{s.star_name || s.star_catalog_id}</div>
                </div>
                <span className="saved-star-time">
                  {new Date(s.saved_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          username={username}
          onSave={(updated) => { setProfile(updated); setEditing(false); }}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  );
}

