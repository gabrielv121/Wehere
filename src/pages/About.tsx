import { Link } from 'react-router-dom';

export function About() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Link to="/" className="text-teal-600 font-medium hover:underline text-sm mb-6 inline-block">
        ← Back to home
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">About Us</h1>
      <div className="prose prose-slate text-slate-600 text-sm space-y-4">
        <p>
          WeHere is a fan-to-fan ticket marketplace built to make buying and selling tickets simple, transparent, and fair.
        </p>
        <p>
          Our mission is to connect fans directly while eliminating unnecessary buyer fees. Sellers list tickets securely, buyers discover events easily, and everyone benefits from a trusted resale experience.
        </p>
        <p>
          WeHere focuses on simplicity, transparency, and modern technology to deliver a better way to access live events.
        </p>
      </div>
    </div>
  );
}
