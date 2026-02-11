import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isApiEnabled } from '../../api/client';
import * as authApi from '../../api/auth';
import type { AdminUserDetail as AdminUserDetailType } from '../../api/auth';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

function TransferStatus({ sale }: { sale: authApi.AdminUserDetailSale }) {
  if (sale.status === 'cancelled') return <span className="text-slate-400">—</span>;
  if (sale.status === 'delivered') return <span className="text-teal-600">Delivered (buyer confirmed)</span>;
  if (sale.sellerSentAt) return <span className="text-amber-600">Sent · waiting for buyer</span>;
  return <span className="text-slate-500">Not sent</span>;
}

function PayoutStatus({ sale }: { sale: authApi.AdminUserDetailSale }) {
  if (sale.status === 'cancelled') return <span className="text-slate-400">—</span>;
  if (sale.sellerPayoutReleasedAt) return <span className="text-teal-600">Released</span>;
  if (sale.status === 'delivered') return <span className="text-amber-600">Delivered · release pending</span>;
  return <span className="text-slate-500">Pending</span>;
}

export function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !isApiEnabled) {
      setLoading(false);
      return;
    }
    authApi
      .getAdminUserDetail(id)
      .then(setData)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load user');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (!isApiEnabled) {
    return (
      <div>
        <p className="text-slate-600">User detail is available when the app is connected to the backend API.</p>
        <Link to="/admin/users" className="text-teal-600 font-medium mt-2 inline-block">← Back to users</Link>
      </div>
    );
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (error || !data) {
    return (
      <div>
        <p className="text-red-600">{error || 'User not found'}</p>
        <Link to="/admin/users" className="text-teal-600 font-medium mt-2 inline-block">← Back to users</Link>
      </div>
    );
  }

  const { user, listings, purchases, sales } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/users" className="text-slate-500 hover:text-slate-700 text-sm font-medium">← Users</Link>
        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
      </div>

      {/* Email + account flags */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800">Account</h2>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block">Email</span>
            <a href={`mailto:${user.email}`} className="font-medium text-teal-600 hover:underline">{user.email}</a>
          </div>
          <div>
            <span className="text-slate-500 block">Role</span>
            <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              {user.role}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Sign-in</span>
            <span>{user.provider ? `OAuth (${user.provider})` : 'Email / password'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Email verified</span>
            <span>{user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : '—'}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Joined</span>
            <span>{formatDate(user.createdAt)}</span>
          </div>
          {user.country != null && (
            <div>
              <span className="text-slate-500 block">Country</span>
              <span>{user.country}</span>
            </div>
          )}
          {user.phone != null && (
            <div>
              <span className="text-slate-500 block">Phone</span>
              <span>{user.phone}</span>
            </div>
          )}
          <div>
            <span className="text-slate-500 block">Payment on file</span>
            <span>{user.paymentMethodOnFile ? (user.cardBrand && user.cardLast4 ? `${user.cardBrand} •••• ${user.cardLast4}` : 'Yes') : 'No'}</span>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800">Listings</h2>
        {listings.length === 0 ? (
          <p className="p-5 text-slate-500 text-sm">No listings.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Event</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Section</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Row</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Price</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="px-5 py-3">
                      <Link to={`/admin/events/${l.eventId}/edit`} className="text-teal-600 hover:underline font-medium">{l.event.title}</Link>
                      <span className="text-slate-400 block text-xs">{new Date(l.event.date).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3">{l.section}</td>
                    <td className="px-5 py-3">{l.row ?? '—'}</td>
                    <td className="px-5 py-3">{formatPrice(l.pricePerTicket)} × {l.quantity} = {formatPrice(l.totalPrice)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${
                        l.status === 'sold' ? 'bg-teal-100 text-teal-800' : l.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Purchases */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800">Purchases</h2>
        {purchases.length === 0 ? (
          <p className="p-5 text-slate-500 text-sm">No purchases.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Order ID</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Event</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Order date</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{o.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{o.eventName}</span>
                      <span className="text-slate-400 block text-xs">{new Date(o.eventDate).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3">{formatPrice(o.totalPrice)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${
                        o.status === 'delivered' ? 'bg-teal-100 text-teal-800' : o.status === 'confirmed' ? 'bg-sky-100 text-sky-800' : o.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(o.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sales: who bought, when, payout status, transfer status, Stripe */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <h2 className="px-5 py-3 border-b border-slate-200 bg-slate-50 font-semibold text-slate-800">Sales</h2>
        {sales.length === 0 ? (
          <p className="p-5 text-slate-500 text-sm">No sales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Order ID</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Buyer</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Event</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Transfer status</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Payout status</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Stripe</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Sold</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((o) => (
                  <tr key={o.id} className="border-b border-slate-100">
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{o.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3">
                      <span>{o.buyerName ?? '—'}</span>
                      {o.buyerEmail && <span className="text-slate-500 block text-xs">{o.buyerEmail}</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium">{o.eventName}</span>
                      <span className="text-slate-400 block text-xs">{formatDate(o.eventDate)}</span>
                    </td>
                    <td className="px-5 py-3">{formatPrice(o.totalPrice)}{o.sellerPayout != null && <span className="text-slate-500 block text-xs">Payout: {formatPrice(o.sellerPayout)}</span>}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full text-xs font-medium px-2 py-0.5 ${
                        o.status === 'delivered' ? 'bg-teal-100 text-teal-800' : o.status === 'confirmed' ? 'bg-sky-100 text-sky-800' : o.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3"><TransferStatus sale={o} /></td>
                    <td className="px-5 py-3"><PayoutStatus sale={o} /></td>
                    <td className="px-5 py-3">{o.stripeSessionId ? <span className="text-teal-600">Paid</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(o.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
