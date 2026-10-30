'use client';

import Link from 'next/link';
import { WorkspaceRole } from '@qcc/shared';
import { useAuth } from '@/features/auth/auth-provider';

type AppPage = 'tasks' | 'team';

interface AppNavigationProps {
  activePage: AppPage;
  taskCount?: number;
  onNotice: (message: string) => void;
  onLogout: () => void;
  loggingOut: boolean;
}

function NavIcon({
  name,
  size = 20,
}: {
  name: 'home' | 'board' | 'bell' | 'users' | 'spark';
  size?: number;
}) {
  const paths: Record<typeof name, string> = {
    home: 'M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6',
    board: 'M4 4h7v16H4zM14 4h6v10h-6zM14 17h6v3h-6z',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    users:
      'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    spark:
      'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z',
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function AppNavigation({
  activePage,
  taskCount,
  onNotice,
  onLogout,
  loggingOut,
}: AppNavigationProps) {
  const { user, member } = useAuth();
  const isAdmin = member?.role === WorkspaceRole.Admin;

  return (
    <>
      <aside className="mytasks-sidebar" aria-label="Điều hướng chính">
        <Link className="mytasks-brand" href="/my-tasks" aria-label="QCC Agency">
          <span className="mytasks-brand-mark">Q</span>
          <span>QCC <b>AGENCY</b></span>
        </Link>
        <div className="mytasks-workspace">
          <span className="workspace-avatar">Q</span>
          <span className="workspace-copy">
            <strong>QCC Agency</strong>
            <small>Workspace nội bộ</small>
          </span>
          <span className="workspace-chevron">⌄</span>
        </div>
        <p className="nav-caption">KHÔNG GIAN LÀM VIỆC</p>
        <nav className="mytasks-nav">
          <Link
            className={`mytasks-nav-item ${activePage === 'tasks' ? 'active' : ''}`}
            href="/my-tasks"
            aria-current={activePage === 'tasks' ? 'page' : undefined}
          >
            <NavIcon name="home" />
            <span>Việc của tôi</span>
            {taskCount !== undefined ? (
              <span className="nav-count">{taskCount}</span>
            ) : null}
          </Link>
          <button
            className="mytasks-nav-item"
            type="button"
            onClick={() => onNotice('Khu vực Dự án sẽ sớm được hoàn thiện.')}
          >
            <NavIcon name="board" />
            <span>Dự án</span>
          </button>
          <button
            className="mytasks-nav-item"
            type="button"
            onClick={() => onNotice('Thông báo sẽ sớm được bổ sung.')}
          >
            <NavIcon name="bell" />
            <span>Thông báo</span>
            <span className="nav-unread" aria-label="Có thông báo mới" />
          </button>
          <button
            className="mytasks-nav-item"
            type="button"
            onClick={() => onNotice('Workload sẽ sớm được bổ sung.')}
          >
            <NavIcon name="users" />
            <span>Workload</span>
          </button>
          {isAdmin ? (
            <Link
              className={`mytasks-nav-item ${activePage === 'team' ? 'active' : ''}`}
              href="/team"
              aria-current={activePage === 'team' ? 'page' : undefined}
            >
              <NavIcon name="users" />
              <span>Nhân sự</span>
            </Link>
          ) : null}
        </nav>
        <div className="sidebar-bottom">
          {activePage === 'tasks' ? (
            <div className="sidebar-tip">
              <span className="tip-icon"><NavIcon name="spark" size={18} /></span>
              <strong>Tập trung từng việc</strong>
              <p>Ưu tiên xử lý task quá hạn và việc cần làm hôm nay.</p>
            </div>
          ) : null}
          <button
            type="button"
            className="mytasks-profile"
            onClick={onLogout}
            disabled={loggingOut}
            aria-label="Đăng xuất"
            title="Đăng xuất"
          >
            <span className="user-avatar">{user?.name?.slice(0, 1) ?? 'B'}</span>
            <span className="profile-copy">
              <strong>{user?.name ?? 'Bạn'}</strong>
              <small>{user?.email ?? 'Thành viên'}</small>
            </span>
            <span className="profile-menu">
              {loggingOut ? '…' : '•••'}
            </span>
          </button>
        </div>
      </aside>

      <nav className="mytasks-mobile-nav" aria-label="Điều hướng">
        <Link
          className={`mobile-nav-item ${activePage === 'tasks' ? 'active' : ''}`}
          href="/my-tasks"
          aria-current={activePage === 'tasks' ? 'page' : undefined}
        >
          <NavIcon name="home" size={19} />
          <span>Việc của tôi</span>
        </Link>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => onNotice('Khu vực Dự án sẽ sớm được hoàn thiện.')}
        >
          <NavIcon name="board" size={19} />
          <span>Dự án</span>
        </button>
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => onNotice('Thông báo sẽ sớm được bổ sung.')}
        >
          <NavIcon name="bell" size={19} />
          <span>Thông báo</span>
        </button>
        {isAdmin ? (
          <Link
            className={`mobile-nav-item ${activePage === 'team' ? 'active' : ''}`}
            href="/team"
            aria-current={activePage === 'team' ? 'page' : undefined}
          >
            <NavIcon name="users" size={19} />
            <span>Nhân sự</span>
          </Link>
        ) : (
          <button
            type="button"
            className="mobile-nav-item"
            onClick={() => onNotice('Workload sẽ sớm được bổ sung.')}
          >
            <NavIcon name="users" size={19} />
            <span>Thêm</span>
          </button>
        )}
      </nav>
    </>
  );
}
