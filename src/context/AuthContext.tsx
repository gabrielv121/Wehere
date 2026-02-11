import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { migratePurchasesToUser } from '../data/userPurchases';
import { isApiEnabled, getToken, setToken, clearToken } from '../api/client';
import * as authApi from '../api/auth';
import type { ApiUser } from '../api/auth';

const STORAGE_KEY = 'wehere_user';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  country?: string;
  phone?: string;
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
  loginWithToken: (token: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string; verifyLink?: string }>;
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

function stableUserId(email: string): string {
  const normalized = email.trim().toLowerCase();
  try {
    const encoded = btoa(unescape(encodeURIComponent(normalized)));
    return 'u_' + encoded.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_').slice(0, 48);
  } catch {
    return 'u_' + normalized.replace(/[^a-z0-9]/g, '_').slice(0, 48);
  }
}

function apiUserToUser(u: ApiUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as UserRole,
    country: u.country,
    phone: u.phone,
    paymentMethodOnFile: u.paymentMethodOnFile,
    cardLast4: u.cardLast4,
    cardBrand: u.cardBrand,
  };
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
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
    const onUnauthorized = () => setState({ user: null, isLoading: false });
    window.addEventListener('wehere:unauthorized', onUnauthorized);
    return () => window.removeEventListener('wehere:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    if (isApiEnabled) {
      if (!getToken()) {
        setState({ user: null, isLoading: false });
        return;
      }
      const timeoutMs = 8000;
      const timeoutId = setTimeout(() => {
        setState((s) => (s.isLoading ? { user: null, isLoading: false } : s));
      }, timeoutMs);
      authApi
        .getMe()
        .then((u) => {
          clearTimeout(timeoutId);
          setState({ user: apiUserToUser(u), isLoading: false });
        })
        .catch(() => {
          clearTimeout(timeoutId);
          setState({ user: null, isLoading: false });
        });
      return () => clearTimeout(timeoutId);
    } else {
      const user = loadStoredUser();
      setState({ user, isLoading: false });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    if (isApiEnabled) {
      try {
        const { user } = await authApi.login(email, password);
        const u = apiUserToUser(user);
        saveUser(u);
        setState((s) => ({ ...s, user: u }));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Login failed' };
      }
    }
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

  const loginWithToken = useCallback(async (token: string) => {
    if (!isApiEnabled || !token?.trim()) return { ok: false, error: 'Invalid token' };
    try {
      setToken(token.trim());
      const u = await authApi.getMe();
      const user = apiUserToUser(u);
      saveUser(user);
      setState((s) => ({ ...s, user }));
      return { ok: true };
    } catch (err) {
      clearToken();
      return { ok: false, error: err instanceof Error ? err.message : 'Session invalid' };
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
    if (!name.trim()) return { ok: false, error: 'Name is required' };
    if (isApiEnabled) {
      try {
        const res = await authApi.register(email, password, name);
        return { ok: true, verifyLink: res.verifyLink };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Signup failed' };
      }
    }
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
    if (isApiEnabled) authApi.logoutApi();
    saveUser(null);
    setState((s) => ({ ...s, user: null }));
  }, []);

  const updateProfile = useCallback(async (name: string, email: string) => {
    const current = state.user;
    if (!current) return { ok: false, error: 'Not logged in' };
    if (!name.trim()) return { ok: false, error: 'Name is required' };
    if (!email.trim()) return { ok: false, error: 'Email is required' };
    if (isApiEnabled) {
      try {
        const u = await authApi.updateProfile(name, email);
        const updated = apiUserToUser(u);
        saveUser(updated);
        setState((s) => ({ ...s, user: updated }));
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Update failed' };
      }
    }
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
      if (data.paymentMethodOnFile && (!data.cardLast4 || data.cardLast4.replace(/\D/g, '').length !== 4))
        return { ok: false, error: 'Card last 4 digits are required when adding a payment method.' };
      if (isApiEnabled) {
        try {
          const u = await authApi.updateSellerInfo(data);
          const updated = apiUserToUser(u);
          saveUser(updated);
          setState((s) => ({ ...s, user: updated }));
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err instanceof Error ? err.message : 'Update failed' };
        }
      }
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
    loginWithToken,
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

export function sellerRequirementsComplete(user: User | null): boolean {
  if (!user) return false;
  const countryOk = user.country?.trim().toUpperCase() === 'US';
  const phoneOk = !!user.phone?.trim();
  const paymentOk = user.paymentMethodOnFile === true;
  return !!(countryOk && phoneOk && paymentOk);
}
