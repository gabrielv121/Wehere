import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPurchases } from '../data/userPurchases';
import { useEvents } from '../context/EventsContext';
import { isApiEnabled } from '../api/client';
import * as ordersApi from '../api/orders';
import type { Purchase } from '../types';

export function Account() {
  const { user, logout } = useAuth();
  const { getEventById } = useEvents();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  useEffect(() => {
    if (!user) {
      setPurchases([]);
      return;
    }
    if (isApiEnabled) {
      ordersApi.getMyOrders().then(setPurchases).catch(() => setPurchases([]));
    } else {
      setPurchases(getPurchases(user.id));
    }
  }, [user?.id]);
  const totalOrders = purchases.length;
  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return purchases.filter((p) => {
      const event = getEventById(p.eventId);
      return event && p.status === 'confirmed' && new Date(event.date) >= today;
    }).length;
  }, [purchases, getEventById]);

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Overview</h2>
      <p className="text-slate-500 text-sm mb-6">Your profile and quick links</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Profile</h3>
          <Link
            to="/account/profile"
            className="text-sm font-medium text-teal-600 hover:text-teal-700"
          >
            Edit profile
          </Link>
        </div>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-slate-500">Name</dt>
            <dd className="mt-0.5 text-slate-900">{user!.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="mt-0.5 text-slate-900">{user!.email}</dd>
          </div>
        </dl>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <Link
          to="/account/tickets"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <span className="text-2xl font-bold text-teal-600">{upcomingCount}</span>
          <p className="text-slate-700 font-medium mt-1">My tickets</p>
          <p className="text-slate-500 text-sm mt-0.5">Upcoming events</p>
        </Link>
        <Link
          to="/account/orders"
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-teal-300 hover:shadow-md transition-all"
        >
          <span className="text-2xl font-bold text-slate-700">{totalOrders}</span>
          <p className="text-slate-700 font-medium mt-1">Purchase history</p>
          <p className="text-slate-500 text-sm mt-0.5">All orders</p>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/events"
          className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          Browse events
        </Link>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
