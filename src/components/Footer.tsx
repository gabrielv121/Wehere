import { useState } from 'react';
import { Link } from 'react-router-dom';

const SOCIAL = [
  { label: 'Twitter', href: 'https://twitter.com/wehere', icon: 'X' },
  { label: 'Instagram', href: 'https://instagram.com/wehere', icon: 'IG' },
  { label: 'Facebook', href: 'https://facebook.com/wehere', icon: 'FB' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/wehere', icon: 'in' },
] as const;

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
    <footer className="border-t border-slate-200 bg-slate-50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Top: Brand + columns */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {/* Brand + tagline */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-slate-900">
              <span className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white text-sm font-extrabold">W</span>
              WeHere
            </Link>
            <p className="text-slate-600 text-sm mt-3 max-w-xs">
              Resale tickets from fans. No buyer fees — we charge sellers only.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/about" className="text-slate-600 hover:text-teal-600 transition-colors">About Us</Link></li>
              <li><Link to="/careers" className="text-slate-600 hover:text-teal-600 transition-colors">Careers</Link></li>
              <li><Link to="/press" className="text-slate-600 hover:text-teal-600 transition-colors">Press</Link></li>
              <li><Link to="/contact" className="text-slate-600 hover:text-teal-600 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* For fans */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">For fans</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/events" className="text-slate-600 hover:text-teal-600 transition-colors">Browse Events</Link></li>
              <li><Link to="/sell" className="text-slate-600 hover:text-teal-600 transition-colors">Sell Tickets</Link></li>
              <li><Link to="/how-it-works" className="text-slate-600 hover:text-teal-600 transition-colors">How It Works</Link></li>
              <li><Link to="/gift-cards" className="text-slate-600 hover:text-teal-600 transition-colors">Gift Cards</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/help" className="text-slate-600 hover:text-teal-600 transition-colors">Help Center</Link></li>
              <li><Link to="/contact" className="text-slate-600 hover:text-teal-600 transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="text-slate-600 hover:text-teal-600 transition-colors">FAQ</Link></li>
              <li><Link to="/legal/refund" className="text-slate-600 hover:text-teal-600 transition-colors">Refunds Policy</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/legal/terms" className="text-slate-600 hover:text-teal-600 transition-colors">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="text-slate-600 hover:text-teal-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/legal/cookies" className="text-slate-600 hover:text-teal-600 transition-colors">Cookie Policy</Link></li>
              <li><Link to="/legal/disclaimer" className="text-slate-600 hover:text-teal-600 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Newsletter + Social */}
        <div className="mt-12 pt-10 border-t border-slate-200 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2">Stay in the loop</h3>
            <p className="text-slate-600 text-sm mb-4 max-w-md">
              Get event alerts and a link to download the WeHere app. No spam.
            </p>
            {submitted ? (
              <p className="text-teal-600 text-sm font-medium">Thanks! Check your inbox.</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 min-w-0 rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-teal-500 px-4 py-2.5 text-white font-semibold text-sm hover:bg-teal-600 transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-slate-500">Follow us</span>
            <ul className="flex gap-3">
              {SOCIAL.map(({ label, href, icon }) => (
                <li key={icon}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:border-teal-500 hover:text-teal-600 transition-colors text-xs font-semibold"
                    aria-label={label}
                  >
                    {icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} WeHere, Inc. All rights reserved.</p>
          <p className="text-xs">Secure resale. Seller fees only. No buyer fees.</p>
        </div>
      </div>
    </footer>
  );
}
