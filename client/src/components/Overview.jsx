import React from 'react';

export default function Overview({ article }) {
  if (!article) return null;
  const points = [
    `Source: ${article.source?.name || 'Unknown'}`,
    `Author: ${article.author || 'N/A'}`,
    `Published: ${article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'N/A'}`,
  ];
  return (
    <section className="mt-6 bg-white rounded-2xl shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-3">Overview</h2>
      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
        {points.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </section>
  );
}
