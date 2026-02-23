import { Link } from 'react-router-dom';

export function Contact() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Contact</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        <p>Need help or have a question?</p>
        <ul className="list-none space-y-2 pl-0">
          <li>
            <strong>Email:</strong>{' '}
            <a href="mailto:support@weheretickets.com" className="text-teal-600 hover:underline">
              support@weheretickets.com
            </a>
          </li>
          <li>
            <strong>Business inquiries:</strong>{' '}
            <a href="mailto:business@weheretickets.com" className="text-teal-600 hover:underline">
              business@weheretickets.com
            </a>
          </li>
        </ul>
        <p>Our support team typically responds within 24–48 hours.</p>
      </div>
    </div>
  );
}
