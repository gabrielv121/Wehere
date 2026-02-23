import { Link } from 'react-router-dom';

const FAQ_ITEMS = [
  {
    q: 'Are tickets guaranteed?',
    a: 'WeHere verifies listings and protects transactions to ensure safe purchases.',
  },
  {
    q: 'Do buyers pay fees?',
    a: 'No. We charge sellers only.',
  },
  {
    q: 'How do I receive my tickets?',
    a: 'Tickets are transferred digitally through approved delivery methods.',
  },
  {
    q: 'When do sellers get paid?',
    a: 'Payments are released after successful ticket delivery and event confirmation.',
  },
];

export function FAQ() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-8">FAQ</h1>
      <dl className="space-y-6">
        {FAQ_ITEMS.map(({ q, a }) => (
          <div key={q}>
            <dt className="font-semibold text-slate-900 mb-1">{q}</dt>
            <dd className="text-slate-600 text-sm pl-0">{a}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-8 text-slate-600 text-sm">
        More questions? <Link to="/contact" className="text-teal-600 hover:underline">Contact us</Link> or visit the{' '}
        <Link to="/help" className="text-teal-600 hover:underline">Help Center</Link>.
      </p>
    </div>
  );
}
