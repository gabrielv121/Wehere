import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../../context/EventsContext';
import { getAdminOrders } from '../../data/userPurchases';
import { isApiEnabled } from '../../api/client';
import * as ordersApi from '../../api/orders';
import type { AdminOrder } from '../../types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AdminDashboard() {
  const { events } = useEvents();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  useEffect(() => {
    if (isApiEnabled) {
      ordersApi.getAdminOrders().then(setOrders).catch(() => setOrders([]));
    } else {
      setOrders(getAdminOrders());
    }
  }, []);
  const featuredCount = events.filter((e) => e.featured).length;
  const upcomingCount = events.filter((e) => new Date(e.date) >= new Date()).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-8">Overview of your site</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total events</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{events.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Featured events</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{featuredCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Upcoming</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{upcomingCount}</p>
        </div>
        <Link
          to="/admin/events"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-center"
        >
          <p className="text-slate-500 text-sm font-medium">Manage events</p>
          <p className="text-teal-600 font-semibold mt-1">→ Events</p>
        </Link>
        <Link
          to="/admin/orders"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-center"
        >
          <p className="text-slate-500 text-sm font-medium">Total orders</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</p>
          <p className="text-teal-600 font-semibold text-sm mt-1">→ Orders</p>
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-slate-900 px-5 py-4 border-b border-slate-200">Recent events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3 font-medium text-slate-600">Event</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Venue</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Date</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Category</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 5).map((event) => (
                <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/admin/events`} className="font-medium text-slate-900 hover:text-teal-600">
                      {event.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{event.venue.name}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(event.date)}</td>
                  <td className="px-5 py-3">
                    <span className="capitalize text-slate-600">{event.category}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
