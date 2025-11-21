import React from 'react';
import { NavLink } from 'react-router-dom';

const categories = ['popular', 'sports', 'technology', 'entertainment', 'science', 'politics', 'business'];

export default function Sidebar() {
  return (
    <aside className="w-52 hidden md:block pt-2">
      <div className="sticky top-4">
        <div className="text-3xl font-extrabold mb-6 tracking-tight">NewsGenie</div>
        <nav className="flex flex-col gap-1 text-sm">
          {categories.map((c) => (
            <NavLink
              key={c}
              to={c === 'popular' ? '/' : `/category/${c}`}
              className={({ isActive }) =>
                `px-3 py-2 rounded-full font-semibold capitalize ${
                  isActive
                    ? 'bg-sky-100 text-sky-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-sky-700'
                }`
              }
            >
              {c}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}
