import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSalesBySeller } from '../data/userPurchases';
import { SELLER_FEE_PERCENT } from '../data/listings';
import { isApiEnabled } from '../api/client';
import * as ordersApi from '../api/orders';
import type { Purchase } from '../types';

function formatPrice(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
}

export function Payouts() {
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
  const completed = sales.filter((o) => o.status === 'delivered' || o.status === 'confirmed');
  const totalPayout = completed.reduce((sum, o) => sum + (o.sellerPayout ?? 0), 0);
  const totalFees = completed.reduce((sum, o) => {
    const fee = o.sellerFeePercent != null ? (o.totalPrice * o.sellerFeePercent) / 100 : o.totalPrice * (SELLER_FEE_PERCENT / 100);
    return sum + fee;
  }, 0);

  if (!user) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Payouts</h2>
      <p className="text-slate-500 text-sm mb-6">
        We charge a {SELLER_FEE_PERCENT}% fee on each sale. Buyers pay no fees. Payout is released after the order is completed.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-500 text-sm">Total payout (completed sales)</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{formatPrice(totalPayout)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-500 text-sm">Fees paid (our {SELLER_FEE_PERCENT}% seller fee)</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{formatPrice(totalFees)}</p>
        </div>
      </div>
      {completed.length === 0 ? (
        <p className="text-slate-500 text-sm">No completed payouts yet. Sales appear here once the order is marked delivered.</p>
      ) : (
        <p className="text-slate-500 text-sm">
          {completed.length} completed sale{completed.length !== 1 ? 's' : ''}. In a real app, payouts would be sent to your bank account.
        </p>
      )}
    </div>
  );
}
