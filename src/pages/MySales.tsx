import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSalesBySeller } from '../data/userPurchases';
import { SELLER_FEE_PERCENT } from '../data/listings';
import { isApiEnabled } from '../api/client';
import * as ordersApi from '../api/orders';
import type { Purchase } from '../types';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MySales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Purchase[]>([]);
  useEffect(() => {
    if (!user) {
      setSales([]);
      return;
    }
    if (isApiEnabled) {
      ordersApi.getMySales().then(setSales).catch(() => setSales([]));
    } else {
      setSales(getSalesBySeller(user.id));
    }
  }, [user?.id]);
  if (!user) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-6">My sales</h2>
      <p className="text-slate-500 text-sm mb-6">
        When a buyer pays, we hold the money until delivery. After the order is completed, you receive the payout (minus our {SELLER_FEE_PERCENT}% seller fee).
      </p>
      {sales.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-slate-600">No sales yet. List tickets to start selling.</p>
          <Link to="/account/list-tickets" className="text-teal-600 font-semibold hover:underline mt-2 inline-block">
            List tickets
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {sales.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-slate-900">{order.eventName}</p>
                <p className="text-slate-500 text-sm">
                  {order.section}
                  {order.row ? ` · Row ${order.row}` : ''} · {order.quantity} ticket{order.quantity > 1 ? 's' : ''}
                </p>
                <p className="text-slate-400 text-xs mt-1">Sold {formatDate(order.orderDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{formatPrice(order.totalPrice)}</p>
                {order.sellerPayout != null && (
                  <p className="text-slate-500 text-sm">You receive {formatPrice(order.sellerPayout)}</p>
                )}
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'delivered' || order.status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : order.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
