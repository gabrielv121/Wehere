import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'wehere_user';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
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

    const user: User = {
      id: crypto.randomUUID(),
      email: email.trim(),
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

  const value: AuthContextValue = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
