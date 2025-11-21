import React, { useEffect, useState } from 'react';
import NewsCard from '../components/NewsCard';
import Loader from '../components/Loader';

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetch('/api/news')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          const cleaned = (data.articles || []).filter(
            (a) => a.title && a.description
          );
          setArticles(cleaned);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!articles.length)
    return <div className="text-slate-500 text-sm">No headlines found.</div>;

  const hero = articles[0];
  const secondary = articles.slice(1, 3);
  const more = articles.slice(3, 9);

  const heroImage =
    hero.urlToImage ||
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=1200&auto=format&fit=crop';

  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Top Headlines
        </h1>
        <p className="text-slate-600 text-sm">
          Curated highlights across sports, tech, entertainment and more.
        </p>
      </header>

      <section className="grid md:grid-cols-3 gap-6 items-stretch">
        <article className="md:col-span-2 bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
          <div
            className="h-64 md:h-80 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="p-6 flex flex-col flex-1">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              {hero.source?.name || 'Top source'}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-snug">
              {hero.title}
            </h2>
            <p className="text-sm text-slate-700 mb-4 line-clamp-3">
              {hero.description}
            </p>
            <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
              <span>{formatTime(hero.publishedAt)} · Lead story</span>
              <a
                href={hero.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-sky-600 text-white font-semibold text-xs hover:bg-sky-700"
              >
                Read
              </a>
            </div>
          </div>
        </article>

        <div className="flex flex-col gap-4">
          {secondary.map((a) => (
            <article
              key={a.url}
              className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col"
            >
              <div
                className="h-32 bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    a.urlToImage ||
                    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=800&auto=format&fit=crop'
                  })`,
                }}
              />
              <div className="p-4 flex flex-col flex-1">
                <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
                  {a.source?.name || 'Source'}
                </div>
                <h3 className="text-sm font-semibold mb-2 line-clamp-2">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                  {a.description}
                </p>
                <div className="mt-auto flex justify-between items-center text-[11px] text-slate-500">
                  <span>{formatTime(a.publishedAt)}</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 font-semibold"
                  >
                    Read
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {more.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-slate-800">
            More stories
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {more.map((a) => (
              <NewsCard
                key={a.url}
                article={a}
                onBookmark={() => {}}
                onSummarize={() => {}}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
