/**
 * Global Application Store — Zustand
 *
 * Manages: auth state, employee profile, UI preferences.
 * Keeps API calls out of individual components for reuse.
 */

import { create } from 'zustand';
import { authAPI } from '../services/api';

// ─── Auth State ─────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  employee_code?: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  designation?: string;
  is_active?: boolean;
}

interface AuthSlice {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authChecked: boolean;
  sessionError: string | null;
  setSessionError: (msg: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// ─── UI Preferences ─────────────────────────────────────────────────

interface UISlice {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

// ─── Combined Store ─────────────────────────────────────────────────

type AppStore = AuthSlice & UISlice;

export const useAppStore = create<AppStore>((set) => ({
  // ── Auth ───────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authChecked: false,
  sessionError: null,

  setSessionError: (msg: string | null) => set({ sessionError: msg }),

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, sessionError: null });
      const response = await authAPI.login(email.trim(), password);
      if (response.data?.success && response.data?.data) {
        const resData = response.data.data;
        const accessToken = resData.tokens?.access_token || resData.access_token;
        const refreshToken = resData.tokens?.refresh_token || resData.refresh_token;
        const user = resData.user;

        if (accessToken) {
          localStorage.setItem('dsp_access_token', accessToken);
        }
        if (refreshToken) {
          localStorage.setItem('dsp_refresh_token', refreshToken);
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          authChecked: true,
          sessionError: null,
        });
        return true;
      }
      set({
        isLoading: false,
        sessionError: 'Invalid credentials. Please verify your employee ID or email.',
      });
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid employee credentials or password.';
      set({ isLoading: false, sessionError: msg });
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('dsp_access_token');
    localStorage.removeItem('dsp_refresh_token');
    set({ user: null, isAuthenticated: false, authChecked: true, sessionError: null });
  },

  checkAuth: async () => {
    try {
      const response = await authAPI.getMe();
      if (response.data?.success && response.data?.data) {
        set({
          user: response.data.data,
          isAuthenticated: true,
          authChecked: true,
          sessionError: null,
        });
        return true;
      }
      localStorage.removeItem('dsp_access_token');
      localStorage.removeItem('dsp_refresh_token');
      set({ user: null, isAuthenticated: false, authChecked: true });
      return false;
    } catch {
      localStorage.removeItem('dsp_access_token');
      localStorage.removeItem('dsp_refresh_token');
      set({ user: null, isAuthenticated: false, authChecked: true });
      return false;
    }
  },

  // ── UI ─────────────────────────────────────────────
  sidebarCollapsed: false,
  toggleSidebar: () => set((state: AppStore) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}));

// Listen for global session expiry events dispatched by API interceptors
if (typeof window !== 'undefined') {
  window.addEventListener('dsp:session-expired', (e: any) => {
    useAppStore.setState({
      user: null,
      isAuthenticated: false,
      authChecked: true,
      sessionError: e?.detail?.message || 'Your session has expired. Please log in again.'
    });
  });
}
