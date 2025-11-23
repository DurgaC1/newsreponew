import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import NewsCard from '../components/NewsCard';
import Overview from '../components/Overview';
import Loader from '../components/Loader';
import { apiFetch } from '../config/api';

export default function Category() {
  const { category } = useParams();
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setSummary('');
    apiFetch(`/api/news?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          const cleaned = (data.articles || []).filter(
            (a) => a.title && a.description
          );
          setArticles(cleaned);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  const main = articles[0];
  const others = articles.slice(1);

  const onBookmark = async (article) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Login to bookmark articles.');
      return;
    }
    try {
      const res = await apiFetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(article),
      });
      const j = await res.json();
      if (j.ok) alert('Bookmarked!');
      else alert(j.error || 'Failed to bookmark');
    } catch (e) {
      alert(e.message);
    }
  };

  const onSummarize = async (article) => {
    try {
      const res = await apiFetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: article.url }),
      });
      const j = await res.json();
      if (j.summary) setSummary(j.summary);
      else alert(j.error || 'No summary available');
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!main) return <div className="text-slate-500 text-sm">No articles found.</div>;

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase text-slate-400 mb-1">Category</div>
        <h1 className="text-3xl font-extrabold capitalize tracking-tight mb-1">
          {category}
        </h1>
        <p className="text-slate-600 text-sm">
          Live headlines powered by NewsAPI, summarized by NewsGenie.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {main.urlToImage && (
              <img
                src={main.urlToImage}
                alt=""
                className="w-full max-h-80 object-cover"
              />
            )}
            <div className="p-5">
              <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
                {main.source?.name || 'Unknown source'}
              </div>
              <h2 className="text-2xl font-bold mb-2">{main.title}</h2>
              <p className="text-sm text-slate-700 mb-4">
                {main.description || 'No description available.'}
              </p>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => onBookmark(main)}
                  className="px-3 py-1 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100"
                >
                  ☆ Bookmark lead story
                </button>
                <button
                  onClick={() => onSummarize(main)}
                  className="px-3 py-1 rounded-full border border-slate-200 hover:border-sky-300"
                >
                  ✨ Summarize
                </button>
              </div>
            </div>
          </article>
          <Overview article={main} />
          {summary && (
            <section className="mt-4 bg-white rounded-2xl shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-2">AI Summary</h2>
              <div className="text-sm whitespace-pre-line text-slate-700">
                {summary}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            More articles
          </h3>
          <div className="grid gap-3">
            {others.map((a) => (
              <NewsCard
                key={a.url}
                article={a}
                onBookmark={onBookmark}
                onSummarize={onSummarize}
              />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
