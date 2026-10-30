import { ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { AppShell } from '@/features/app-shell/components/app-shell';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
