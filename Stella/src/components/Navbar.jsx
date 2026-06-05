import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './community.css';
import { BASE } from '../api';

export default function Navbar({ user, onLogout, starData = [], onFlyToStar }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const inputRef = useRef(null);

  // Fetch avatar whenever the logged-in user changes
  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    fetch(`${BASE}/profile/${encodeURIComponent(user.username)}/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setAvatarUrl(data?.avatar_url || null))
      .catch(() => {});
  }, [user?.username]);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();
    const list = starData.filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 8);
    setSuggestions(list);
  }, [query, starData]);

  const selectStar = (star) => {
    setQuery(star.name || '');
    setSuggestions([]);
    onFlyToStar && onFlyToStar(star);
  };

  // Stop the search input's keystrokes from bubbling to document (camera movement)
  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && suggestions.length > 0) selectStar(suggestions[0]);
    if (e.key === 'Escape') { setSuggestions([]); inputRef.current?.blur(); }
  };

  return (
    <nav className="stella-navbar">
      <Link to="/" className="nav-logo">✦ STELLA</Link>
      <Link to="/" className="nav-link">Home</Link>
      <Link to="/mod" className="nav-link">Mod</Link>

      {/* Search */}
      <div className="nav-search">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stars…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {suggestions.length > 0 && (
          <div className="nav-suggestions">
            {suggestions.map((s, i) => (
              <div key={i} className="sug-item" onClick={() => selectStar(s)}>
                <div className="sug-name">{s.name}</div>
                <div className="sug-sub">{s.ra} · {s.dec} · {s.distance} pc</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <span className="nav-spacer" />

      {/* Profile link — real avatar if available, else initial */}
      {user && (
        <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={user.username} className="nav-avatar" title={user.username} />
            : <div className="nav-avatar-placeholder" title={user.username}>
                {user.username[0].toUpperCase()}
              </div>
          }
        </Link>
      )}

      {/* Logout */}
      {user && (
        <button className="nav-icon-btn" onClick={onLogout} title="Logout">⏻</button>
      )}
    </nav>
  );
}
