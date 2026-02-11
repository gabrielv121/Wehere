import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { isApiEnabled } from '../api/client';
import * as ordersApi from '../api/orders';

export function CheckoutSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const state = location.state as { orderId?: string; status?: 'confirmed' | 'pending' } | null;
  const [orderId, setOrderId] = useState<string | null>(state?.orderId ?? null);
  const [loading, setLoading] = useState(Boolean(isApiEnabled && sessionId));
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const retryLoadOrder = () => {
    if (!sessionId || !isApiEnabled) return;
    setError(null);
    setRetrying(true);
    ordersApi
      .getOrderBySession(sessionId)
      .then((order) => {
        setOrderId(order.id);
        setLoading(false);
      })
      .catch(() => setError('Could not load order. Check My tickets in a moment.'))
      .finally(() => setRetrying(false));
  };

  useEffect(() => {
    if (!isApiEnabled || !sessionId) return;
    let cancelled = false;
    const tryFetch = (attempt = 0) => {
      ordersApi
        .getOrderBySession(sessionId)
        .then((order) => {
          if (!cancelled) {
            setOrderId(order.id);
            setError(null);
            setLoading(false);
          }
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt < 3) {
            setTimeout(() => tryFetch(attempt + 1), 2000);
          } else {
            setError('Could not load order. It may still be processing — check My tickets.');
            setLoading(false);
          }
        });
    };
    tryFetch();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const status = state?.status ?? (orderId ? 'confirmed' : loading ? 'pending' : 'confirmed');
  const isPending = status === 'pending' && !error;

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6 bg-teal-100 text-teal-600 animate-pulse">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Confirming your payment</h1>
        <p className="text-slate-600">Your order will appear in My tickets shortly.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      <div
        className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-6 ${
          isPending ? 'bg-amber-100 text-amber-600' : 'bg-teal-100 text-teal-600'
        }`}
      >
        {isPending ? (
          <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        {isPending ? 'Order pending' : 'Order confirmed!'}
      </h1>
      <p className="text-slate-600 mb-8">
        {isPending
          ? "We're processing your order. You'll receive an email when it's confirmed."
          : "Thank you! Your tickets have been confirmed and are in your account."}
      </p>
      {error && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm">
          <p className="text-amber-800">{error}</p>
          {sessionId && (
            <button
              type="button"
              onClick={retryLoadOrder}
              disabled={retrying}
              className="mt-2 text-teal-600 font-medium hover:underline disabled:opacity-50"
            >
              {retrying ? 'Checking…' : 'Try again'}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/account/tickets"
          className="inline-flex justify-center px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
        >
          My tickets
        </Link>
        <Link
          to="/events"
          className="inline-flex justify-center px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Browse events
        </Link>
      </div>
    </div>
  );
}
