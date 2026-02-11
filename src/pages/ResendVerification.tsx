import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resendVerification } from '../api/auth';
import { isApiEnabled } from '../api/client';

export function ResendVerification() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  useEffect(() => {
    const q = searchParams.get('email');
    if (q) setEmail(q);
  }, [searchParams]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setDone(false);
    setVerifyLink(null);
    try {
      const res = await resendVerification(email);
      setDone(true);
      if (res.verifyLink) setVerifyLink(res.verifyLink);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isApiEnabled) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Resend verification</h1>
          <p className="text-slate-500 mt-1">Only available when the app is connected to the backend.</p>
          <p className="mt-6">
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Back to Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="text-slate-500 mt-1">{email ? `If ${email} is registered, we sent a new verification link.` : 'If that email is registered, we sent a new link.'}</p>
          {verifyLink && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
              <strong>Dev mode:</strong>{' '}
              <a href={verifyLink} className="text-teal-600 underline break-all">{verifyLink}</a>
            </div>
          )}
          <p className="mt-6">
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Back to Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Resend verification email</h1>
        <p className="text-slate-500 mt-1">Enter your email and we’ll send a new verification link.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="resend-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              id="resend-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Sending…' : 'Send verification link'}
          </button>
        </form>
        <p className="mt-6 text-center text-slate-600 text-sm">
          <Link to="/login" className="text-teal-600 font-medium hover:underline">Back to Log in</Link>
        </p>
      </div>
    </div>
  );
}
