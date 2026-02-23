import { Link } from 'react-router-dom';

export function Press() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Press</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        <p>For press inquiries, partnerships, or media requests, please contact:</p>
        <p>
          <a href="mailto:press@weheretickets.com" className="text-teal-600 hover:underline font-medium">
            press@weheretickets.com
          </a>
        </p>
        <p>
          WeHere is a modern resale marketplace focused on fan transparency and fair pricing.
        </p>
      </div>
    </div>
  );
}
