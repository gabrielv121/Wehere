import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isApiEnabled } from '../api/client';

export function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const [verifyLink, setVerifyLink] = useState<string | null>(null);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCheckEmail(false);
    setVerifyLink(null);
    const result = await signup(email, password, name);
    setLoading(false);
    if (result.ok) {
      if (isApiEnabled) {
        setCheckEmail(true);
        setVerifyLink(result.verifyLink ?? null);
        return;
      }
      navigate(redirect, { replace: true });
    } else {
      setError(result.error ?? 'Sign up failed');
    }
  }

  if (isApiEnabled && checkEmail) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
          <p className="text-slate-500 mt-1">
            We sent a verification link to <strong>{email}</strong>. Click it to verify your account, then log in.
          </p>
          {verifyLink && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
              <strong>Dev mode:</strong> Use this link to verify:
              <br />
              <a href={verifyLink} className="text-teal-600 underline break-all">
                {verifyLink}
              </a>
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
        <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
        <p className="text-slate-500 mt-1">Join WeHere to save events and get alerts</p>

        {!isApiEnabled && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
            <strong>Demo mode:</strong> Your account is stored locally. To log in again later, use password <code className="bg-amber-100 px-1 rounded font-mono">password</code>. For real signup, set <code className="bg-amber-100 px-1 rounded">VITE_API_URL</code> and run the backend (see README).
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
              {error.includes('Cannot reach API') && (
                <p className="mt-2 text-red-600">
                  Start the backend in <code className="bg-red-100 px-1 rounded">server/</code> and set <code className="bg-red-100 px-1 rounded">VITE_API_URL=http://localhost:3001</code> in the project root <code className="bg-red-100 px-1 rounded">.env</code>, then restart the frontend.
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Already have an account?{' '}
          <Link to={`/login${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-teal-600 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
