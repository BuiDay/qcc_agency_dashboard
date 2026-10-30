'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppNavigation } from './app-navigation';
import { useAuth } from '@/features/auth/auth-provider';

interface AppShellContextValue {
  setTaskCount: (count: number) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [taskCount, setTaskCountState] = useState<number>();
  const [notice, setNotice] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const setTaskCount = useCallback((count: number) => {
    setTaskCountState(count);
  }, []);

  useEffect(() => {
    if (pathname !== '/my-tasks') setTaskCountState(undefined);
  }, [pathname]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setNotice('Chưa thể đăng xuất. Vui lòng kiểm tra kết nối và thử lại.');
      setLoggingOut(false);
    }
  }

  return (
    <AppShellContext.Provider value={{ setTaskCount }}>
      <div className="mytasks-app">
        <AppNavigation
          activePage={pathname === '/team' ? 'team' : 'tasks'}
          taskCount={taskCount}
          onNotice={setNotice}
          onLogout={() => void handleLogout()}
          loggingOut={loggingOut}
        />
        {children}
        {notice ? <div className="app-shell-toast" role="status">{notice}</div> : null}
      </div>
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);
  if (!context) {
    throw new Error('useAppShell phải được dùng bên trong AppShell.');
  }
  return context;
}
