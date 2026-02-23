import { Link } from 'react-router-dom';

export function Careers() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Careers</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        <p>Join us in building the future of live event ticketing.</p>
        <p>
          WeHere is growing and always looking for passionate builders, designers, and problem-solvers who want to improve how fans experience live events.
        </p>
        <p>
          Interested candidates can send their resume and portfolio to{' '}
          <a href="mailto:careers@weheretickets.com" className="text-teal-600 hover:underline">
            careers@weheretickets.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
