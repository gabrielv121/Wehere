import { Link } from 'react-router-dom';

const HELP_CATEGORIES = [
  { title: 'Buying tickets', slug: 'buying' },
  { title: 'Selling tickets', slug: 'selling' },
  { title: 'Payment processing', slug: 'payments' },
  { title: 'Ticket delivery', slug: 'delivery' },
  { title: 'Account issues', slug: 'account' },
];

export function Help() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Help Center</h1>
      <p className="text-slate-600 text-sm mb-8">
        Find answers to common questions about buying, selling, and managing your tickets.
      </p>
      <ul className="space-y-3">
        {HELP_CATEGORIES.map(({ title, slug }) => (
          <li key={slug}>
            <Link
              to="/faq"
              className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 hover:border-teal-300 hover:bg-slate-50 transition-colors"
            >
              {title}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-slate-600 text-sm">
        Still need help? <Link to="/contact" className="text-teal-600 hover:underline">Contact us</Link>.
      </p>
    </div>
  );
}
