import { create } from 'zustand';
import api from '../api/client';

interface AuthState {
  token: string | null;
  role: string | null;
  firstName: string | null;
  isAuthenticated: boolean;
  mfaToken: string | null;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (code: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  role: null,
  firstName: null,
  isAuthenticated: false,
  mfaToken: null,
  mfaRequired: false,
  mfaSetupRequired: false,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;

    if (data.mfaRequired) {
      set({ mfaToken: data.mfaToken, mfaRequired: true, mfaSetupRequired: false });
      return;
    }
    if (data.mfaSetupRequired) {
      // Issue a temporary token for MFA setup
      set({ mfaToken: data.mfaToken, mfaRequired: false, mfaSetupRequired: true });
      return;
    }

    sessionStorage.setItem('novavision-token', data.accessToken);
    set({
      token: data.accessToken,
      role: data.role,
      firstName: data.firstName,
      isAuthenticated: true,
      mfaToken: null,
      mfaRequired: false,
      mfaSetupRequired: false,
    });
  },

  verifyMfa: async (code) => {
    const { mfaToken } = get();
    const res = await api.post('/auth/mfa/challenge', { mfaToken, code });
    const data = res.data;

    sessionStorage.setItem('novavision-token', data.accessToken);
    set({
      token: data.accessToken,
      role: data.role,
      firstName: data.firstName,
      isAuthenticated: true,
      mfaToken: null,
      mfaRequired: false,
    });
  },

  logout: () => {
    sessionStorage.removeItem('novavision-token');
    set({
      token: null,
      role: null,
      firstName: null,
      isAuthenticated: false,
      mfaToken: null,
      mfaRequired: false,
      mfaSetupRequired: false,
    });
  },

  loadFromStorage: () => {
    const token = sessionStorage.getItem('novavision-token');
    if (token) {
      // Decode JWT to get role and name (basic decode, no verification -- server validates)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({
          token,
          role: payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'],
          firstName: payload.given_name,
          isAuthenticated: true,
        });
      } catch {
        sessionStorage.removeItem('novavision-token');
      }
    }
  },
}));
