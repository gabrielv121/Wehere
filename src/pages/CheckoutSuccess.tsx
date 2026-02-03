import { Link, useLocation } from 'react-router-dom';

export function CheckoutSuccess() {
  const location = useLocation();
  const state = location.state as { orderId?: string; status?: 'confirmed' | 'pending' } | null;
  const status = state?.status ?? 'confirmed';
  const isPending = status === 'pending';

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
