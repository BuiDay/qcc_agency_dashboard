'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, retrySessionRestore } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  if (status === 'authenticated') return children;

  if (status === 'error') {
    return (
      <main className="auth-state-page">
        <section className="auth-state-card" role="alert">
          <div className="auth-state-mark" aria-hidden="true">
            !
          </div>
          <h1>Chưa thể kiểm tra phiên đăng nhập</h1>
          <p>
            Có thể API đang tạm thời không kết nối được. Hãy thử lại; nếu phiên
            hết hạn, bạn sẽ được chuyển về trang đăng nhập.
          </p>
          <button
            className="submit-button auth-retry-button"
            type="button"
            onClick={retrySessionRestore}
          >
            Thử lại
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-state-page" aria-live="polite">
      <div className="auth-loading" role="status">
        <span className="spinner auth-loading-spinner" aria-hidden="true" />
        <span>
          {status === 'unauthenticated'
            ? 'Đang chuyển tới đăng nhập...'
            : 'Đang kiểm tra phiên đăng nhập...'}
        </span>
      </div>
    </main>
  );
}
