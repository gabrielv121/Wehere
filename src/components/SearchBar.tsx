import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function SearchBar({ defaultValue = '' }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue);
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`/events?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
      <div className="relative flex rounded-xl overflow-hidden border-2 border-slate-200 focus-within:border-teal-500 bg-white shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events, artists, teams..."
          className="flex-1 px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none"
          aria-label="Search events"
        />
        <button
          type="submit"
          className="px-5 py-3 bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
}
