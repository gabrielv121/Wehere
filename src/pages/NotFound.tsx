import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p className="text-6xl font-bold text-slate-200">404</p>
      <h1 className="text-2xl font-bold text-slate-900 mt-4">Page not found</h1>
      <p className="text-slate-600 mt-2">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          Go home
        </Link>
        <Link
          to="/events"
          className="inline-flex justify-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Browse events
        </Link>
      </div>
    </div>
  );
}
