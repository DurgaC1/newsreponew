import React, { useEffect, useState } from 'react';
import { apiFetch } from '../config/api';

export default function Bookmarks() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      setError('Login to view bookmarks.');
      return;
    }
    apiFetch('/api/bookmarks', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setItems(d);
        else setError(d.error || 'Failed to load bookmarks');
      })
      .catch((e) => setError(e.message));
  }, [token]);

  if (error) return <div className="text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bookmarks</h1>
      <div className="space-y-3">
        {items.map((b) => (
          <article key={b.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-xs uppercase text-slate-400 mb-1">
              {b.source?.name || 'Source'}
            </div>
            <h2 className="font-semibold text-sm mb-1">{b.title}</h2>
            <p className="text-xs text-slate-600 mb-1 line-clamp-2">
              {b.description || ''}
            </p>
            <a
              href={b.url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-sky-600"
            >
              Open original ↗
            </a>
          </article>
        ))}
        {items.length === 0 && (
          <div className="text-slate-500 text-sm">No bookmarks yet.</div>
        )}
      </div>
    </div>
  );
}
