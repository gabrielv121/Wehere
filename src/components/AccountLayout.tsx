import { Link, NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { seedDemoPurchases } from '../data/userPurchases';

const NAV = [
  { to: '/account', end: true, label: 'Overview' },
  { to: '/account/profile', end: false, label: 'Profile' },
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

      <nav className="flex gap-1 p-1 rounded-xl bg-slate-100 w-fit mb-8" aria-label="Account sections">
        {NAV.map(({ to, end, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
