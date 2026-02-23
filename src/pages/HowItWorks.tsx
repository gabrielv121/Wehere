import { Link } from 'react-router-dom';

export function HowItWorks() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">How It Works</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        <ol className="list-decimal list-inside space-y-3">
          <li>Browse or search for your event.</li>
          <li>Compare ticket options with transparent pricing.</li>
          <li>Buy securely or list tickets you cannot use.</li>
          <li>Tickets are transferred safely between fans.</li>
        </ol>
        <p>
          WeHere protects both buyers and sellers throughout the transaction.
        </p>
      </div>
    </div>
  );
}
