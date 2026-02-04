import { useState } from 'react';
import { useAuth, sellerRequirementsComplete } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const CARD_BRANDS = ['Visa', 'Mastercard', 'Amex', 'Discover'];

export function SellerInfo() {
  const { user, updateSellerInfo } = useAuth();
  const [country, setCountry] = useState(user?.country ?? 'US');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [cardLast4, setCardLast4] = useState(user?.cardLast4 ?? '');
  const [cardBrand, setCardBrand] = useState(user?.cardBrand ?? 'Visa');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const complete = sellerRequirementsComplete(user);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    const phoneTrimmed = phone.trim();
    const last4 = cardLast4.replace(/\D/g, '').slice(-4);
    if (last4.length !== 4) {
      setError('Enter the last 4 digits of your card.');
      return;
    }
    setSaving(true);
    const result = await updateSellerInfo({
      country: country.trim(),
      phone: phoneTrimmed,
      paymentMethodOnFile: true,
      cardLast4: last4,
      cardBrand: cardBrand.trim() || 'Visa',
    });
    setSaving(false);
    if (result.ok) setSuccess(true);
    else setError(result.error ?? 'Something went wrong.');
  }

  if (!user) return null;

  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 mb-1">Seller requirements</h2>
      <p className="text-slate-500 text-sm mb-6">
        To list tickets and receive payouts after buyers confirm they received their tickets, we need:
      </p>

      {complete && (
        <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-4 mb-6">
          <p className="font-medium text-teal-800">You’re all set to sell.</p>
          <p className="text-sm text-teal-700 mt-1">
            Country: United States · Phone: {user.phone} · Card on file: {user.cardBrand} ****{user.cardLast4}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm max-w-lg">
        <div>
          <label htmlFor="seller-country" className="block text-sm font-medium text-slate-700 mb-1">
            Country of residence *
          </label>
          <select
            id="seller-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 bg-slate-50"
          >
            <option value="US">United States</option>
          </select>
          <p className="text-slate-500 text-xs mt-1">We currently only support sellers in the United States.</p>
        </div>

        <div>
          <label htmlFor="seller-phone" className="block text-sm font-medium text-slate-700 mb-1">
            Contact phone number *
          </label>
          <input
            id="seller-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. (555) 123-4567"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
            required
          />
          <p className="text-slate-500 text-xs mt-1">Used for payouts and verification.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-4">
          <h3 className="font-medium text-slate-900">Credit card on file</h3>
          <p className="text-sm text-slate-600">
            We pay out your profit to your card after the buyer confirms they received the ticket. We only store the last 4 digits for your security.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="seller-card-brand" className="block text-sm font-medium text-slate-700 mb-1">Card type</label>
              <select
                id="seller-card-brand"
                value={cardBrand}
                onChange={(e) => setCardBrand(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
              >
                {CARD_BRANDS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="seller-card-last4" className="block text-sm font-medium text-slate-700 mb-1">Last 4 digits *</label>
              <input
                id="seller-card-last4"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900"
              />
            </div>
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        {success && <div className="rounded-lg bg-teal-50 text-teal-800 px-4 py-3 text-sm">Saved. You can list tickets and receive payouts.</div>}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl bg-teal-500 text-white font-semibold hover:bg-teal-600 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save seller info'}
        </button>
      </form>

      <p className="mt-6 text-slate-500 text-sm">
        <Link to="/account/list-tickets" className="text-teal-600 font-medium hover:underline">
          List tickets
        </Link>
        {' · '}
        <Link to="/account" className="text-teal-600 font-medium hover:underline">
          Account overview
        </Link>
      </p>
    </div>
  );
}
