import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api/auth';
import { isApiEnabled } from '../api/client';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }
    if (!isApiEnabled) {
      setStatus('error');
      setMessage('Email verification is only available when the app is connected to the backend.');
      return;
    }
    verifyEmail(token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [token]);

  if (!isApiEnabled && !token) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Verify email</h1>
          <p className="text-slate-500 mt-1">Email verification is only available when the app is connected to the backend.</p>
          <p className="mt-6">
            <Link to="/login" className="text-teal-600 font-medium hover:underline">Back to Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Verifying…</h1>
          <p className="text-slate-500 mt-1">Please wait.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Email verified</h1>
          <p className="text-slate-500 mt-1">{message}</p>
          <p className="mt-6">
            <Link to="/login" className="text-teal-600 font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Verification failed</h1>
        <p className="text-slate-600 mt-1">{message}</p>
        <p className="mt-6">
          <Link to="/resend-verification" className="text-teal-600 font-medium hover:underline">Resend verification email</Link>
          {' · '}
          <Link to="/login" className="text-teal-600 font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
