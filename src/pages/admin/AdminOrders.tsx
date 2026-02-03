import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders, updateOrderStatus } from '../../data/userPurchases';
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Orders</h1>
        <p className="text-slate-500 text-sm">View who bought what, for which event, and update order status</p>
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
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Venue · Event date</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Section · Row</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
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
                        disabled={updatingId === order.id}
                        className="rounded-lg border border-slate-300 px-2 py-1.5 text-slate-800 bg-white disabled:opacity-50"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
