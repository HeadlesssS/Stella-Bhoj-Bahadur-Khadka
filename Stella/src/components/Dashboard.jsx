import { useState, useEffect } from 'react';
import './community.css';
import { getTrendingStars, getFeed, getStats, getEvents } from '../api';

// Star color from B-V for the dot
function bvColor(bv) {
  if (bv == null) return '#aabbff';
  if (bv < -0.2) return '#b0c4ff';
  if (bv < 0.0) return '#ccd6ff';
  if (bv < 0.3) return '#f0f0ff';
  if (bv < 0.6) return '#fff4e0';
  if (bv < 0.9) return '#ffd090';
  if (bv < 1.3) return '#ff9966';
  return '#ff7755';
}

function timeSince(dateStr) {
  const s = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Emoji icons per event name keyword
function eventIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('meteor') || n.includes('leonid') || n.includes('perseid')) return '☄️';
  if (n.includes('eclipse')) return '🌑';
  if (n.includes('comet')) return '🌠';
  if (n.includes('alignment')) return '🪐';
  return '🔭';
}

export default function Dashboard({ onFlyToStar, onSelectStar, starData = [] }) {
  const [open, setOpen] = useState(true);
  const [trending, setTrending] = useState([]);
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, f, s, ev] = await Promise.all([
          getTrendingStars(), getFeed(1), getStats(), getEvents(),
        ]);
        setTrending(t.slice(0, 5));
        setFeed((f.results ?? f).slice(0, 5));
        setStats(s);
        setEvents(Array.isArray(ev) ? ev : (ev.results ?? []));
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
    // Refresh every 60 seconds
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleTrendingClick = (item) => {
    const star = starData.find(s => s.name === item.star_catalog_id || s.name === item.star_name);
    if (star) onFlyToStar && onFlyToStar(star);
  };

  const handleExplore = (event) => {
    setSelectedEvent(event);
    if (!onFlyToStar || starData.length === 0) return;
    // Try the event's designated star first
    const target = event.target_star_catalog_id
      ? starData.find(s => s.name === event.target_star_catalog_id)
      : null;
    // Fall back to the brightest star in the dataset (lowest vmag)
    const fallback = starData.reduce(
      (best, s) => (s.vmag != null && (best === null || s.vmag < best.vmag) ? s : best),
      null,
    );
    const dest = target || fallback;
    if (dest) onFlyToStar(dest);
  };

  const handlePostClick = (post) => {
    if (post.star_catalog_id) {
      const star = starData.find(s => s.name === post.star_catalog_id);
      if (star) { onSelectStar && onSelectStar(star); onFlyToStar && onFlyToStar(star); }
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button className={`dash-toggle${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
        {open ? '◀' : '▶'}
      </button>

      <aside className={`stella-dashboard${open ? '' : ' collapsed'}`}>
        {/* Trending Stars */}
        <div className="dash-section">
          <h4>🔥 Trending This Week</h4>
          {loading && <div className="spinner">Loading…</div>}
          {!loading && trending.length === 0 && <div className="empty-msg">No activity yet</div>}
          {trending.map((item, i) => (
            <div key={i} className="dash-star-row" onClick={() => handleTrendingClick(item)}>
              <div className="dash-star-dot" style={{ background: '#4a90e2' }} />
              <span className="dash-star-name">{item.star_name || item.star_catalog_id}</span>
              <span className="dash-star-count">{item.post_count + item.save_count} ✦</span>
            </div>
          ))}
        </div>

        {/* Recent Posts */}
        <div className="dash-section">
          <h4>💬 Recent Posts</h4>
          {loading && <div className="spinner">Loading…</div>}
          {!loading && feed.length === 0 && <div className="empty-msg">No posts yet</div>}
          {feed.map((post, i) => (
            <div key={i} className="dash-post-row" onClick={() => handlePostClick(post)}>
              <div className="dash-post-meta">
                <strong style={{ color: '#4a90e2' }}>{post.user?.username}</strong>
                {post.star_name && <> · <span style={{ color: '#f0c040' }}>✦ {post.star_name}</span></>}
                <span style={{ float: 'right' }}>{timeSince(post.created_at)}</span>
              </div>
              <div className="dash-post-content">{post.content}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="dash-section">
          <h4>📊 Quick Stats</h4>
          {loading && <div className="spinner">Loading…</div>}
          {stats && (
            <>
              <div className="dash-stat-row">
                <span className="dash-stat-label">Explorers</span>
                <span className="dash-stat-value">{stats.total_users.toLocaleString()}</span>
              </div>
              <div className="dash-stat-row">
                <span className="dash-stat-label">Posts</span>
                <span className="dash-stat-value">{stats.total_posts.toLocaleString()}</span>
              </div>
              <div className="dash-stat-row">
                <span className="dash-stat-label">Saved Stars</span>
                <span className="dash-stat-value">{stats.total_saved_stars.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="dash-section">
          <h4>🗓 Upcoming Events</h4>
          {loading && <div className="spinner">Loading…</div>}
          {!loading && events.length === 0 && (
            <div className="empty-msg">No events scheduled</div>
          )}
          {events.map(ev => {
            const isSelected = selectedEvent?.id === ev.id;
            return (
              <div
                key={ev.id}
                className={`dash-event-card${isSelected ? ' selected' : ''}`}
              >
                <div className="dash-event-header">
                  <span className="dash-event-icon">{eventIcon(ev.name)}</span>
                  <span className="dash-event-name">{ev.name}</span>
                </div>
                <div className="dash-event-date">{formatDate(ev.event_date)}</div>
                <div className="dash-event-desc">{ev.description}</div>
                <button
                  className={`dash-event-btn${isSelected ? ' active' : ''}`}
                  onClick={() => handleExplore(ev)}
                >
                  {isSelected ? '✦ Exploring' : 'Explore'}
                </button>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
