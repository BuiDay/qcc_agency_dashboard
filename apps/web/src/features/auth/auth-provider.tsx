'use client';

import {
  useCallback,
  createContext,
  useEffect,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AuthApiError,
  AuthMember,
  AuthUser,
  LoginResponse,
  logout as logoutRequest,
  restoreSession,
} from './api/auth-api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

const SESSION_REFRESH_INTERVAL = 14 * 60 * 1000;

let restoreRequest: Promise<LoginResponse> | null = null;

function restoreSessionOnce(): Promise<LoginResponse> {
  if (!restoreRequest) {
    restoreRequest = restoreSession().finally(() => {
      restoreRequest = null;
    });
  }
  return restoreRequest;
}

interface AuthContextValue {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  member: AuthMember | null;
  setSession: (session: LoginResponse) => void;
  logout: () => Promise<void>;
  clearSession: () => void;
  retrySessionRestore: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<LoginResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const sessionVersion = useRef(0);

  const setSession = useCallback((nextSession: LoginResponse) => {
    sessionVersion.current += 1;
    setSessionState(nextSession);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    sessionVersion.current += 1;
    setSessionState(null);
    setStatus('unauthenticated');
  }, []);

  const retrySessionRestore = useCallback(() => {
    setRestoreAttempt((attempt) => attempt + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const version = sessionVersion.current;
    setStatus('loading');

    void restoreSessionOnce()
      .then((restoredSession) => {
        if (!active || version !== sessionVersion.current) return;
        setSessionState(restoredSession);
        setStatus('authenticated');
      })
      .catch((error: unknown) => {
        if (!active || version !== sessionVersion.current) return;
        if (error instanceof AuthApiError) {
          console.info('[auth-session] restore-failed', {
            status: error.status,
            code: error.code ?? error.message,
          });
        } else {
          console.info('[auth-session] restore-failed', {
            reason: 'unknown-error',
          });
        }
        setSessionState(null);
        setStatus(
          error instanceof AuthApiError && error.status === 401
            ? 'unauthenticated'
            : 'error',
        );
      });

    return () => {
      active = false;
    };
  }, [restoreAttempt]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let active = true;
    const version = sessionVersion.current;
    const timer = window.setTimeout(() => {
      void restoreSessionOnce()
        .then((restoredSession) => {
          if (!active || version !== sessionVersion.current) return;
          setSessionState(restoredSession);
          setStatus('authenticated');
        })
        .catch((error: unknown) => {
          if (!active || version !== sessionVersion.current) return;
          setSessionState(null);
          setStatus(
            error instanceof AuthApiError && error.status === 401
              ? 'unauthenticated'
              : 'error',
          );
        });
    }, SESSION_REFRESH_INTERVAL);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [session, status]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      accessToken: session?.accessToken ?? null,
      user: session?.user ?? null,
      member: session?.member ?? null,
      setSession,
      logout,
      clearSession: () => {
        sessionVersion.current += 1;
        setSessionState(null);
        setStatus('unauthenticated');
      },
      retrySessionRestore,
    }),
    [logout, retrySessionRestore, session, setSession, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  }
  return context;
}
