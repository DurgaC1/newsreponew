import React from 'react';

export default function NewsCard({ article, onBookmark, onSummarize }) {
  const image =
    article.urlToImage ||
    'https://images.unsplash.com/photo-1521412644187-c49fa049e84d?q=80&w=800&auto=format&fit=crop';

  return (
    <article className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
      <div
        className="h-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">
          {article.source?.name || 'Unknown source'}
        </div>
        <h3 className="font-semibold text-slate-900 text-sm mb-2 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-slate-600 mb-3 line-clamp-3 flex-1">
          {article.description || 'No description available.'}
        </p>
        <div className="flex justify-between items-center mt-auto">
          <button
            onClick={() => onBookmark && onBookmark(article)}
            className="text-[11px] px-2 py-1 rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100"
          >
            ☆ Bookmark
          </button>
          <button
            onClick={() => onSummarize && onSummarize(article)}
            className="text-[11px] px-2 py-1 rounded-full border border-slate-200 hover:border-sky-300"
          >
            ✨ Summarize
          </button>
        </div>
      </div>
    </article>
  );
}
