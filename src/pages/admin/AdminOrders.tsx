import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminOrders,
  updateOrderStatus,
  setOrderTicketVerified,
  setOrderPayoutReleased,
} from '../../data/userPurchases';
import type { AdminOrder as AdminOrderType, OrderStatus } from '../../types';

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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'confirmed', 'delivered', 'cancelled'];

function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrderType[]>(() => getAdminOrders());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    setOrders(getAdminOrders());
  }, []);

  function refreshOrders() {
    setOrders(getAdminOrders());
  }

  function handleStatusChange(order: AdminOrderType, newStatus: OrderStatus) {
    if (order.status === newStatus) return;
    setUpdatingId(order.id);
    const ok = updateOrderStatus(order.userId, order.id, newStatus);
    if (ok) refreshOrders();
    setUpdatingId(null);
  }

  function handleVerifyTicket(order: AdminOrderType) {
    setUpdatingId(order.id);
    const ok = setOrderTicketVerified(order.userId, order.id);
    if (ok) refreshOrders();
    setUpdatingId(null);
  }

  function handleMarkDelivered(order: AdminOrderType) {
    if (order.status === 'delivered') return;
    setUpdatingId(order.id);
    const ok = updateOrderStatus(order.userId, order.id, 'delivered');
    if (ok) refreshOrders();
    setUpdatingId(null);
  }

  function handleReleasePayout(order: AdminOrderType) {
    setUpdatingId(order.id);
    const ok = setOrderPayoutReleased(order.userId, order.id);
    if (ok) refreshOrders();
    setUpdatingId(null);
  }

  const isMarketplaceOrder = (o: AdminOrderType) => o.sellerId != null && o.listingId != null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Orders</h1>
        <p className="text-slate-500 text-sm mb-4">
          View orders, update status, and run the verification flow for marketplace sales.
        </p>
        <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 text-sm text-slate-700">
          <h2 className="font-semibold text-slate-900 mb-2">Verification flow (marketplace orders)</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li><strong>Verify ticket</strong> — Confirm the seller’s ticket is legit (e.g. proof of purchase, barcode).</li>
            <li><strong>Mark delivered</strong> — Transfer tickets to the buyer (e.g. send transfer link or mark as delivered in your system). Buyer can then use the tickets.</li>
            <li><strong>Release payout</strong> — Transfer funds to the seller (minus fee). Seller receives their payout.</li>
          </ol>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          No orders yet. Orders will appear here when users complete checkout.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Order date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Buyer</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Event</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Venue · Date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Section · Row</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Verification</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const marketplace = isMarketplaceOrder(order);
                  const verified = !!order.ticketVerifiedAt;
                  const payoutReleased = !!order.sellerPayoutReleasedAt;
                  const canVerify = !order.ticketVerifiedAt && order.status !== 'cancelled';
                  const canMarkDelivered = verified && order.status === 'confirmed';
                  const canReleasePayout = marketplace && order.sellerId && order.status === 'delivered' && !payoutReleased;
                  const busy = updatingId === order.id;

                  return (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(order.orderDate)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{order.buyerName}</div>
                        <div className="text-slate-500 text-xs">{order.buyerEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/events/${order.eventId}`} className="font-medium text-teal-600 hover:text-teal-700">
                          {order.eventName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{order.venue.name}</div>
                        <div className="text-xs text-slate-500">{formatDate(order.eventDate)}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {order.section}
                        {order.row != null ? ` · Row ${order.row}` : ''}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{formatPrice(order.pricePerTicket)}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{formatPrice(order.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order, e.target.value as OrderStatus)}
                          disabled={busy}
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-slate-800 bg-white disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {statusLabel(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {order.ticketVerifiedAt ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                              <span aria-hidden>✓</span> Verified
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">Not verified</span>
                          )}
                          {marketplace && order.sellerPayout != null && (
                            payoutReleased ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                                <span aria-hidden>✓</span> Payout released
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Payout pending</span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          {canVerify && (
                            <button
                              type="button"
                              onClick={() => handleVerifyTicket(order)}
                              disabled={busy}
                              className="text-left text-xs font-medium text-teal-700 hover:text-teal-800 disabled:opacity-50"
                            >
                              Verify ticket
                            </button>
                          )}
                          {canMarkDelivered && (
                            <button
                              type="button"
                              onClick={() => handleMarkDelivered(order)}
                              disabled={busy}
                              className="text-left text-xs font-medium text-teal-700 hover:text-teal-800 disabled:opacity-50"
                            >
                              Mark delivered
                            </button>
                          )}
                          {canReleasePayout && (
                            <button
                              type="button"
                              onClick={() => handleReleasePayout(order)}
                              disabled={busy}
                              className="text-left text-xs font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
                            >
                              Release payout to seller
                            </button>
                          )}
                          {busy && <span className="text-xs text-slate-400">Updating…</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
