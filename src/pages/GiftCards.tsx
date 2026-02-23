import { Link } from 'react-router-dom';

export function GiftCards() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Gift Cards</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        <p>Give the gift of live experiences.</p>
        <p>
          WeHere gift cards can be used toward any eligible event listed on the platform. Digital delivery makes gifting fast and easy.
        </p>
      </div>
    </div>
  );
}
