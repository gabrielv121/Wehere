import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isApiEnabled, getBaseUrl } from '../api/client';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/';
  const tokenHandled = useRef(false);

  // Handle OAuth callback: token (and optionally redirect) in URL
  useEffect(() => {
    const token = searchParams.get('token');
    const errorFromUrl = searchParams.get('error');
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl).replace(/\+/g, ' '));
      setSearchParams((p) => {
        const next = new URLSearchParams(p);
        next.delete('error');
        next.delete('token');
        next.delete('redirect');
        return next;
      }, { replace: true });
      return;
    }
    if (!token || !isApiEnabled || tokenHandled.current) return;
    tokenHandled.current = true;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await loginWithToken(token);
      if (cancelled) return;
      setLoading(false);
      if (result.ok) {
        const to = searchParams.get('redirect') ?? '/';
        setSearchParams({}, { replace: true });
        navigate(to.startsWith('/') ? to : `/${to}`, { replace: true });
      } else {
        tokenHandled.current = false;
        setError(result.error ?? 'Sign-in failed');
        setSearchParams((p) => {
          const next = new URLSearchParams(p);
          next.delete('token');
          next.delete('redirect');
          return next;
        }, { replace: true });
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams, loginWithToken, navigate, setSearchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate(redirect, { replace: true });
    } else {
      setError(result.error ?? 'Login failed');
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
        <p className="text-slate-500 mt-1">
          {isApiEnabled
            ? 'Use the email and password you used when you signed up.'
            : 'Welcome back to WeHere'}
        </p>

        {!isApiEnabled && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
            <strong>Demo mode:</strong> Use any email and password <code className="bg-amber-100 px-1 rounded font-mono">password</code> to log in. To use real accounts, set <code className="bg-amber-100 px-1 rounded">VITE_API_URL</code> in the project <code className="bg-amber-100 px-1 rounded">.env</code> and run the backend (see README).
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
              {error.includes('verify your email') && (
                <p className="mt-2">
                  <Link to={`/resend-verification${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-teal-600 font-medium hover:underline">
                    Resend verification email
                  </Link>
                </p>
              )}
              {error.includes('Cannot reach API') && (
                <p className="mt-2 text-red-600">
                  Start the backend in <code className="bg-red-100 px-1 rounded">server/</code> and set <code className="bg-red-100 px-1 rounded">VITE_API_URL=http://localhost:3001</code> in the project root <code className="bg-red-100 px-1 rounded">.env</code>, then restart the frontend.
                </p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="••••••••"
              required
            />
            {!isApiEnabled && (
              <p className="text-slate-500 text-xs mt-1">
                Password must be exactly <code className="bg-slate-100 px-1 rounded">password</code>. Admin: <code className="bg-slate-100 px-1 rounded">admin@wehere.com</code>
              </p>
            )}
            {isApiEnabled && (
              <p className="text-slate-500 text-xs mt-1">
                Anyone with a WeHere account can log in. Don’t have an account? <Link to="/signup" className="text-teal-600 font-medium hover:underline">Sign up</Link>.
              </p>
            )}
          </div>
          {isApiEnabled && (
            <p className="text-center text-sm">
              <Link to="/forgot-password" className="text-teal-600 font-medium hover:underline">Forgot password?</Link>
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>

          {isApiEnabled && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-slate-500">Or continue with</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`${getBaseUrl()}/api/auth/google?redirect=${encodeURIComponent(redirect)}`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </a>
                <a
                  href={`${getBaseUrl()}/api/auth/apple?redirect=${encodeURIComponent(redirect)}`}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </a>
              </div>
            </>
          )}
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Don’t have an account?{' '}
          <Link to={`/signup${redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-teal-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
