import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { migratePurchasesToUser } from '../data/userPurchases';

const STORAGE_KEY = 'wehere_user';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** Seller requirements: country of residence (we only support US) */
  country?: string;
  /** Seller requirements: contact phone for payouts */
  phone?: string;
  /** Seller requirements: payment method on file to receive profit after buyer confirmation */
  paymentMethodOnFile?: boolean;
  cardLast4?: string;
  cardBrand?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (name: string, email: string) => Promise<{ ok: boolean; error?: string }>;
  updateSellerInfo: (data: {
    country: string;
    phone: string;
    paymentMethodOnFile: boolean;
    cardLast4?: string;
    cardBrand?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Stable user id from email so the same account always has the same id (purchases keyed by this). */
function stableUserId(email: string): string {
  const normalized = email.trim().toLowerCase();
  try {
    const encoded = btoa(unescape(encodeURIComponent(normalized)));
    return 'u_' + encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').slice(0, 48);
  } catch {
    return 'u_' + normalized.replace(/[^a-z0-9]/g, '_').slice(0, 48);
  }
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    // Migrate to stable id so the same email always has the same id (purchases keyed correctly)
    const stableId = stableUserId(user.email);
    if (user.id !== stableId) {
      migratePurchasesToUser(user.id, stableId);
      const migrated = { ...user, id: stableId };
      saveUser(migrated);
      return migrated;
    }
    return user;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true });

  useEffect(() => {
    const user = loadStoredUser();
    setState({ user, isLoading: false });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Demo: accept any email + password "password"; admin@wehere.com = admin role
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    if (password !== 'password') return { ok: false, error: 'Invalid email or password' };

    const name = email.split('@')[0];
    const isAdmin = email.trim().toLowerCase() === 'admin@wehere.com';
    const user: User = {
      id: crypto.randomUUID(),
      email: email.trim(),
      name,
      role: isAdmin ? 'admin' : 'user',
    };
    saveUser(user);
    setState((s) => ({ ...s, user }));
    return { ok: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
    if (!name.trim()) return { ok: false, error: 'Name is required' };

    const emailTrimmed = email.trim();
    const user: User = {
      id: stableUserId(emailTrimmed),
      email: emailTrimmed,
      name: name.trim(),
      role: 'user',
    };
    saveUser(user);
    setState((s) => ({ ...s, user }));
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    saveUser(null);
    setState((s) => ({ ...s, user: null }));
  }, []);

  const updateProfile = useCallback(async (name: string, email: string) => {
    const current = state.user;
    if (!current) return { ok: false, error: 'Not logged in' };
    if (!name.trim()) return { ok: false, error: 'Name is required' };
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    const updated: User = { ...current, name: name.trim(), email: email.trim(), role: current.role };
    saveUser(updated);
    setState((s) => ({ ...s, user: updated }));
    return { ok: true };
  }, [state.user]);

  const updateSellerInfo = useCallback(
    async (data: {
      country: string;
      phone: string;
      paymentMethodOnFile: boolean;
      cardLast4?: string;
      cardBrand?: string;
    }) => {
      const current = state.user;
      if (!current) return { ok: false, error: 'Not logged in' };
      if (!data.country?.trim()) return { ok: false, error: 'Country is required' };
      if (data.country.trim().toUpperCase() !== 'US')
        return { ok: false, error: 'We currently only support sellers in the United States.' };
      if (!data.phone?.trim()) return { ok: false, error: 'Contact phone is required' };
      if (data.paymentMethodOnFile && (!data.cardLast4 || data.cardLast4.length !== 4))
        return { ok: false, error: 'Card last 4 digits are required when adding a payment method.' };
      const updated: User = {
        ...current,
        country: data.country.trim(),
        phone: data.phone.trim(),
        paymentMethodOnFile: data.paymentMethodOnFile,
        cardLast4: data.cardLast4?.trim(),
        cardBrand: data.cardBrand?.trim(),
      };
      saveUser(updated);
      setState((s) => ({ ...s, user: updated }));
      return { ok: true };
    },
    [state.user]
  );

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    updateSellerInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/** True when user has completed seller requirements: US residence, phone, payment method on file. */
export function sellerRequirementsComplete(user: User | null): boolean {
  if (!user) return false;
  const countryOk = user.country?.trim().toUpperCase() === 'US';
  const phoneOk = !!user.phone?.trim();
  const paymentOk = user.paymentMethodOnFile === true;
  return !!(countryOk && phoneOk && paymentOk);
}
