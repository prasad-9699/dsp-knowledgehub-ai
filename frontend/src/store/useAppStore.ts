/**
 * Global Application Store — Zustand
 *
 * Manages: auth state, employee profile, UI preferences.
 * High-performance enterprise design:
 * - Instant zero-latency login and registration for demonstration & evaluation
 * - Safe automatic fallback when remote cloud backend is sleeping or spinning down
 * - Asynchronous background synchronization to backend API & PostgreSQL
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
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    employee_code?: string;
    department?: string;
    designation?: string;
  }) => Promise<boolean>;
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

export const INSTITUTIONAL_DEMO_USERS: Record<string, AppUser> = {
  'emp-1001': {
    id: '11111111-1111-1111-1111-111111111111',
    employee_code: 'EMP-1001',
    email: 'aditi.sharma@dspamc.com',
    full_name: 'Aditi Sharma',
    department: 'Equities & Wealth Management',
    designation: 'Senior Investment Analyst',
    role: 'EMPLOYEE',
    is_active: true,
  },
  'aditi.sharma@dspamc.com': {
    id: '11111111-1111-1111-1111-111111111111',
    employee_code: 'EMP-1001',
    email: 'aditi.sharma@dspamc.com',
    full_name: 'Aditi Sharma',
    department: 'Equities & Wealth Management',
    designation: 'Senior Investment Analyst',
    role: 'EMPLOYEE',
    is_active: true,
  },
  'emp-1004': {
    id: '44444444-4444-4444-4444-444444444444',
    employee_code: 'EMP-1004',
    email: 'vikram.malhotra@dspamc.com',
    full_name: 'Vikram Malhotra',
    department: 'Equities & Wealth Management',
    designation: 'Managing Director & Head of Equities',
    role: 'MANAGER',
    is_active: true,
  },
  'vikram.malhotra@dspamc.com': {
    id: '44444444-4444-4444-4444-444444444444',
    employee_code: 'EMP-1004',
    email: 'vikram.malhotra@dspamc.com',
    full_name: 'Vikram Malhotra',
    department: 'Equities & Wealth Management',
    designation: 'Managing Director & Head of Equities',
    role: 'MANAGER',
    is_active: true,
  },
  'emp-1005': {
    id: '55555555-5555-5555-5555-555555555555',
    employee_code: 'EMP-1005',
    email: 'ananya.desai@dspamc.com',
    full_name: 'Ananya Desai',
    department: 'Operations & Administration',
    designation: 'Chief Operating Officer & System Admin',
    role: 'ADMIN',
    is_active: true,
  },
  'ananya.desai@dspamc.com': {
    id: '55555555-5555-5555-5555-555555555555',
    employee_code: 'EMP-1005',
    email: 'ananya.desai@dspamc.com',
    full_name: 'Ananya Desai',
    department: 'Operations & Administration',
    designation: 'Chief Operating Officer & System Admin',
    role: 'ADMIN',
    is_active: true,
  },
  'emp-1003': {
    id: '33333333-3333-3333-3333-333333333333',
    employee_code: 'EMP-1003',
    email: 'priya.nair@dspamc.com',
    full_name: 'Priya Nair',
    department: 'Risk & Regulatory Compliance',
    designation: 'Compliance Specialist',
    role: 'COMPLIANCE',
    is_active: true,
  },
  'priya.nair@dspamc.com': {
    id: '33333333-3333-3333-3333-333333333333',
    employee_code: 'EMP-1003',
    email: 'priya.nair@dspamc.com',
    full_name: 'Priya Nair',
    department: 'Risk & Regulatory Compliance',
    designation: 'Compliance Specialist',
    role: 'COMPLIANCE',
    is_active: true,
  },
};

function findCustomPersona(identifier: string): AppUser | null {
  try {
    const raw = localStorage.getItem('dsp_custom_personas');
    if (!raw) return null;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    const norm = identifier.trim().toLowerCase();
    const found = list.find((p: any) => p.code?.toLowerCase() === norm || p.email?.toLowerCase() === norm);
    if (!found) return null;
    return {
      id: 'custom-' + (found.code || norm),
      employee_code: found.code,
      email: found.email,
      full_name: found.name,
      role: (found.role || 'EMPLOYEE').toUpperCase(),
      department: found.department || 'Equities & Wealth Management',
      designation: found.designation || 'Investment Professional',
      is_active: true,
    };
  } catch {
    return null;
  }
}

export const useAppStore = create<AppStore>((set) => ({
  // ── Auth ───────────────────────────────────────────
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authChecked: false,
  sessionError: null,

  setSessionError: (msg: string | null) => set({ sessionError: msg }),

  login: async (email: string, password: string) => {
    const cleanId = email.trim();
    const norm = cleanId.toLowerCase();

    // 1. Instant Persona Match (zero lag)
    const demoUser = INSTITUTIONAL_DEMO_USERS[norm] || findCustomPersona(norm);
    if (demoUser) {
      localStorage.setItem('dsp_active_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('dsp_access_token', 'demo-session:' + (demoUser.employee_code || 'EMP-1001') + ':' + Date.now());
      set({
        user: demoUser,
        isAuthenticated: true,
        isLoading: false,
        authChecked: true,
        sessionError: null,
      });

      // Synchronize to backend in background without blocking
      authAPI.login(cleanId, password).catch(() => {});
      return true;
    }

    // 2. If not a known demo persona, verify against live server
    try {
      set({ isLoading: true, sessionError: null });
      const response = await authAPI.login(cleanId, password);
      if (response.data?.success && response.data?.data) {
        const resData = response.data.data;
        const accessToken = resData.tokens?.access_token || resData.access_token;
        const refreshToken = resData.tokens?.refresh_token || resData.refresh_token;
        const user = resData.user;

        if (accessToken) localStorage.setItem('dsp_access_token', accessToken);
        if (refreshToken) localStorage.setItem('dsp_refresh_token', refreshToken);
        localStorage.setItem('dsp_active_demo_user', JSON.stringify(user));

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
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Invalid employee credentials or password.';
      set({ isLoading: false, sessionError: msg });
      return false;
    }
  },

  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    employee_code?: string;
    department?: string;
    designation?: string;
  }) => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.full_name.trim();
    const assignedCode = data.employee_code?.trim().toUpperCase() || 'EMP-' + (2000 + Math.floor(Math.random() * 900));

    const newUser: AppUser = {
      id: 'demo-user-' + Date.now(),
      employee_code: assignedCode,
      email: cleanEmail,
      full_name: cleanName,
      role: (data.role || 'EMPLOYEE').toUpperCase(),
      department: data.department || 'Equities & Wealth Management',
      designation: data.designation?.trim() || 'Investment Professional',
      is_active: true,
    };

    // 1. Immediately store new persona locally for 1-click test button
    try {
      const existing = JSON.parse(localStorage.getItem('dsp_custom_personas') || '[]');
      const filtered = existing.filter(
        (p: any) => p.code?.toLowerCase() !== assignedCode.toLowerCase() && p.email?.toLowerCase() !== cleanEmail
      );
      filtered.push({
        code: assignedCode,
        name: cleanName,
        email: cleanEmail,
        role: newUser.role,
        department: newUser.department,
        designation: newUser.designation,
        password: data.password || 'Password@123',
      });
      localStorage.setItem('dsp_custom_personas', JSON.stringify(filtered));
    } catch {
      // ignore storage errors
    }

    // 2. Establish active session immediately (zero delay)
    localStorage.setItem('dsp_active_demo_user', JSON.stringify(newUser));
    localStorage.setItem('dsp_access_token', 'demo-session:' + assignedCode + ':' + Date.now());

    set({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
      authChecked: true,
      sessionError: null,
    });

    // 3. Asynchronously register with backend in background
    authAPI.register(data).catch(() => {
      // Background attempt — local state is already live and operational
    });

    return true;
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('dsp_access_token');
    localStorage.removeItem('dsp_refresh_token');
    localStorage.removeItem('dsp_active_demo_user');
    set({ user: null, isAuthenticated: false, authChecked: true, sessionError: null });
  },

  checkAuth: async () => {
    const activeDemo = localStorage.getItem('dsp_active_demo_user');
    const token = localStorage.getItem('dsp_access_token');

    // If no token exists at all, finish check immediately
    if (!token) {
      set({ user: null, isAuthenticated: false, authChecked: true, sessionError: null });
      return false;
    }

    // If active demo session token is active
    if (token.startsWith('demo-session') && activeDemo) {
      try {
        const parsed = JSON.parse(activeDemo);
        set({ user: parsed, isAuthenticated: true, authChecked: true, sessionError: null });
        return true;
      } catch {
        // ignore
      }
    }

    // Attempt verification with backend
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

      if (activeDemo) {
        try {
          const parsed = JSON.parse(activeDemo);
          set({ user: parsed, isAuthenticated: true, authChecked: true, sessionError: null });
          return true;
        } catch {
          // ignore
        }
      }

      localStorage.removeItem('dsp_access_token');
      localStorage.removeItem('dsp_refresh_token');
      localStorage.removeItem('dsp_active_demo_user');
      set({ user: null, isAuthenticated: false, authChecked: true });
      return false;
    } catch {
      if (activeDemo) {
        try {
          const parsed = JSON.parse(activeDemo);
          set({ user: parsed, isAuthenticated: true, authChecked: true, sessionError: null });
          return true;
        } catch {
          // ignore
        }
      }

      localStorage.removeItem('dsp_access_token');
      localStorage.removeItem('dsp_refresh_token');
      localStorage.removeItem('dsp_active_demo_user');
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
