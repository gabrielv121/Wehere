import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { seedDemoPurchases } from '../data/userPurchases';

const NAV = [
  { to: '/account', end: true, label: 'Overview' },
  { to: '/account/profile', end: false, label: 'Profile' },
  { to: '/account/seller-info', end: false, label: 'Seller info' },
  { to: '/account/tickets', end: false, label: 'My tickets' },
  { to: '/account/orders', end: false, label: 'Purchase history' },
  { to: '/account/listings', end: false, label: 'My listings' },
  { to: '/account/sales', end: false, label: 'My sales' },
  { to: '/account/payouts', end: false, label: 'Payouts' },
];

export function AccountLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) seedDemoPurchases(user.id);
  }, [user]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login?redirect=/account" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Account</h1>
        <Link
          to="/events"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Browse events
        </Link>
      </div>

      <nav
        className="flex gap-1 p-1 rounded-xl bg-slate-100 mb-8 overflow-x-auto overscroll-x-contain scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0 w-full sm:w-fit"
        style={{ WebkitOverflowScrolling: 'touch' }}
        aria-label="Account sections"
      >
        <div className="flex gap-1 flex-nowrap min-w-0 pr-2 sm:pr-0">
          {NAV.map(({ to, end, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                  isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
