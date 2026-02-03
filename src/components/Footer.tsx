import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail('');
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {/* Left: App download / email signup */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Get the app</h3>
            <p className="text-slate-600 text-sm mb-4">
              Enter your email and we’ll send you a link to download the WeHere app.
            </p>
            {submitted ? (
              <p className="text-teal-600 text-sm font-medium">
                Thanks! Check your inbox for the download link.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-teal-500 px-4 py-2.5 text-white font-semibold text-sm hover:bg-teal-600 transition-colors whitespace-nowrap"
                >
                  Send me the link
                </button>
              </form>
            )}
          </div>

          {/* Right: Legal links */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Legal</h3>
            <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <li>
                <Link to="/legal/terms" className="text-slate-600 hover:text-teal-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-slate-600 hover:text-teal-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/refund" className="text-slate-600 hover:text-teal-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link to="/legal/disclaimer" className="text-slate-600 hover:text-teal-600 transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-8 pt-6 border-t border-slate-200 text-center text-slate-500 text-xs">
          © {new Date().getFullYear()} WeHere. Find events & tickets.
        </p>
      </div>
    </footer>
  );
}
