import { useEffect, useRef, useState } from 'react';
import { friendAdd, usersSearch } from '../lib/supabase';

export default function FindFriendsModal({ open, onClose, onAdded }) {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null); // id of user being added
  const [added, setAdded] = useState(new Set());
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setAdded(new Set());
    fetchUsers('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const fetchUsers = (term) => {
    setLoading(true);
    usersSearch(term).then(({ data }) => {
      setUsers(data?.users ?? []);
      setLoading(false);
    });
  };

  const onInput = (e) => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchUsers(val), 300);
  };

  const add = async (user) => {
    setAdding(user.id);
    const { data, error } = await friendAdd(user.id);
    setAdding(null);
    if (!error && data?.ok) {
      setAdded((s) => new Set(s).add(user.id));
      onAdded?.(user);
    }
  };

  if (!open) return null;

  return (
    <div className="gate find-friends-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="card find-friends-card">
        <div className="ff-header">
          <h1>친구 찾기</h1>
          <button className="ff-close" onClick={onClose}>✕</button>
        </div>
        <input
          ref={inputRef}
          className="ff-search"
          placeholder="슬러그 또는 닉네임 검색..."
          value={q}
          onChange={onInput}
        />
        <div className="ff-list">
          {loading && <div className="ff-empty"><div className="spinner" /></div>}
          {!loading && users.length === 0 && (
            <div className="ff-empty">검색 결과가 없어요</div>
          )}
          {!loading && users.map((u) => {
            const isFriend = u.isFriend || added.has(u.id);
            return (
              <div key={u.id} className="ff-row">
                <div className="ff-info">
                  <span className="ff-name">{u.nickname || '이름 없음'}</span>
                  {u.slug && <span className="ff-slug">@{u.slug}</span>}
                </div>
                <button
                  className={'ff-add' + (isFriend ? ' done' : '')}
                  disabled={isFriend || adding === u.id}
                  onClick={() => add(u)}
                >
                  {adding === u.id ? '...' : isFriend ? '✓ 친구' : '+ 추가'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
