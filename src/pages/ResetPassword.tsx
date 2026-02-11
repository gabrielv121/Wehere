import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { isApiEnabled } from '../api/client';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!isApiEnabled) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
          <p className="text-slate-500 mt-1">Password reset is only available when the app is connected to the backend.</p>
          <p className="mt-6">
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Back to Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Invalid link</h1>
          <p className="text-slate-500 mt-1">This reset link is missing the token. Request a new one from the login page.</p>
          <p className="mt-6">
            <Link to="/forgot-password" className="text-teal-600 font-medium hover:underline">Forgot password</Link>
            {' · '}
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Password updated</h1>
          <p className="text-slate-500 mt-1">You can log in now with your new password. Redirecting to login…</p>
          <p className="mt-6">
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Go to Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
        <p className="text-slate-500 mt-1">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="reset-password" className="block text-sm font-medium text-slate-700 mb-1">
              New password
            </label>
            <input
              id="reset-password"
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
          <div>
            <label htmlFor="reset-confirm" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm password
            </label>
            <input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="Same as above"
              minLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          <Link to="/login" className="text-teal-600 font-medium hover:underline">Back to Log in</Link>
        </p>
      </div>
    </div>
  );
}
