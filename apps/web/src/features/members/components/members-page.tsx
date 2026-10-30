'use client';

import Link from 'next/link';
import { WorkspaceRole } from '@qcc/shared';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import {
  createMember,
  listMembers,
  MembersApiError,
  updateMember,
  WorkspaceMember,
} from '../api/members-api';

type RoleFilter = 'all' | WorkspaceRole.Admin | WorkspaceRole.Staff;
type StatusFilter = 'all' | 'active' | 'inactive';
type MemberAction =
  | { kind: 'role'; member: WorkspaceMember }
  | { kind: 'status'; member: WorkspaceMember; active: boolean }
  | null;

const roleLabels: Record<WorkspaceRole, string> = {
  [WorkspaceRole.Admin]: 'Admin',
  [WorkspaceRole.Staff]: 'Nhân viên',
  [WorkspaceRole.Client]: 'Khách hàng',
};

function errorMessage(error: unknown): string {
  if (!(error instanceof MembersApiError)) {
    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
  if (error.status === 0) return 'Không thể kết nối máy chủ. Vui lòng thử lại.';
  if (error.status === 401) return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  if (error.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (error.message === 'CONFLICT') return 'Email này đã được sử dụng.';
  if (error.status === 400) return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.';
  return 'Không thể tải hoặc cập nhật nhân sự. Vui lòng thử lại.';
}

export function MembersPage() {
  const { member: currentMember, user } = useAuth();
  const isAdmin = currentMember?.role === WorkspaceRole.Admin;
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [action, setAction] = useState<MemberAction>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newRole, setNewRole] = useState<WorkspaceRole>(WorkspaceRole.Staff);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setMembers(await listMembers());
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void loadMembers();
  }, [isAdmin, loadMembers]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('vi');
    return members.filter((item) => {
      const matchesSearch =
        !normalizedSearch ||
        item.name.toLocaleLowerCase('vi').includes(normalizedSearch) ||
        item.email.toLocaleLowerCase('vi').includes(normalizedSearch);
      const matchesRole = roleFilter === 'all' || item.role === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? item.active : !item.active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, roleFilter, search, statusFilter]);

  if (!isAdmin) {
    return (
      <main className="mytasks-main members-denied">
        <section>
          <span aria-hidden="true">!</span>
          <h1>Bạn không có quyền quản lý nhân sự</h1>
          <p>Chỉ Admin workspace mới truy cập được khu vực này.</p>
          <Link href="/my-tasks">Quay lại Việc của tôi</Link>
        </section>
      </main>
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      await createMember({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: newRole,
      });
      setShowCreate(false);
      setName('');
      setEmail('');
      setPassword('');
      setNewRole(WorkspaceRole.Staff);
      setNotice('Đã tạo tài khoản');
      await loadMembers();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleActionConfirm() {
    if (!action) return;
    setBusy(true);
    setFormError('');
    try {
      if (action.kind === 'role') {
        await updateMember(action.member.id, { role: newRole });
        setNotice('Đã cập nhật vai trò');
      } else {
        await updateMember(action.member.id, { active: action.active });
        setNotice(
          action.active ? 'Đã kích hoạt lại tài khoản' : 'Đã tạm ngưng tài khoản',
        );
      }
      setAction(null);
      await loadMembers();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function closeCreate() {
    if (busy) return;
    setShowCreate(false);
    setFormError('');
    setPassword('');
  }

  return (
    <>
      <main className="mytasks-main members-main">
        <header className="mytasks-topbar">
          <div className="mobile-brand">
            <span className="mytasks-brand-mark">Q</span>
            <span>QCC <b>AGENCY</b></span>
          </div>
          <div className="breadcrumb">
            <span>Quản trị</span><span aria-hidden="true">›</span><strong>Nhân sự</strong>
          </div>
          <Link className="members-mobile-back" href="/my-tasks">‹ Công việc</Link>
        </header>

        <div className="members-content">
          <div className="members-heading">
            <div>
              <p className="members-eyebrow">QUẢN TRỊ WORKSPACE</p>
              <h1>Nhân sự</h1>
              <p>Quản lý tài khoản và quyền truy cập workspace.</p>
            </div>
            <button
              className="members-primary-button"
              type="button"
              onClick={() => {
                setFormError('');
                setShowCreate(true);
              }}
            >
              <span aria-hidden="true">＋</span> Thêm nhân sự
            </button>
          </div>

          <section className="members-summary" aria-label="Tổng quan nhân sự">
            <div><span>Tổng nhân sự</span><strong>{members.length}</strong></div>
            <div><span>Đang hoạt động</span><strong>{members.filter((item) => item.active).length}</strong></div>
            <div><span>Admin</span><strong>{members.filter((item) => item.role === WorkspaceRole.Admin).length}</strong></div>
          </section>

          <section className="members-directory" aria-label="Danh sách nhân sự">
            <div className="members-toolbar">
              <label className="members-search">
                <span aria-hidden="true">⌕</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên hoặc email"
                  aria-label="Tìm theo tên hoặc email"
                />
              </label>
              <label className="members-select-label">
                <span>Vai trò</span>
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
                >
                  <option value="all">Tất cả</option>
                  <option value={WorkspaceRole.Admin}>Admin</option>
                  <option value={WorkspaceRole.Staff}>Nhân viên</option>
                </select>
              </label>
              <label className="members-select-label">
                <span>Trạng thái</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Tạm ngưng</option>
                </select>
              </label>
            </div>

            {loading ? (
              <div className="members-skeleton" role="status" aria-label="Đang tải nhân sự">
                {Array.from({ length: 5 }, (_, index) => <span key={index} />)}
              </div>
            ) : loadError ? (
              <div className="members-state members-error" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => void loadMembers()}>Thử lại</button>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="members-state">
                <span aria-hidden="true">⌕</span>
                <h2>{members.length ? 'Không tìm thấy nhân sự phù hợp.' : 'Workspace chưa có nhân sự nào.'}</h2>
                <p>{members.length ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Thêm tài khoản đầu tiên vào workspace.'}</p>
                {members.length ? (
                  <button type="button" onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}>Xóa bộ lọc</button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="members-table-wrap">
                  <table className="members-table">
                    <thead>
                      <tr><th>Thành viên</th><th>Vai trò</th><th>Trạng thái</th><th><span className="sr-only">Thao tác</span></th></tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((item) => {
                        const isSelf = item.userId === user?.id;
                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="member-identity">
                                <span className="member-avatar">{item.name.slice(0, 1).toLocaleUpperCase('vi')}</span>
                                <span><strong>{item.name}</strong><small>{item.email}</small></span>
                              </div>
                            </td>
                            <td><span className={`member-role-badge role-${item.role}`}>{roleLabels[item.role]}</span></td>
                            <td><span className={`member-status ${item.active ? 'is-active' : 'is-inactive'}`}><i />{item.active ? 'Đang hoạt động' : 'Tạm ngưng'}</span></td>
                            <td className="members-row-actions">
                              <button type="button" disabled={isSelf || busy} onClick={() => { setNewRole(item.role); setFormError(''); setAction({ kind: 'role', member: item }); }}>Đổi vai trò</button>
                              <button
                                type="button"
                                disabled={isSelf || busy}
                                className={item.active ? 'member-danger-action' : ''}
                                onClick={() => { setFormError(''); setAction({ kind: 'status', member: item, active: !item.active }); }}
                              >
                                {item.active ? 'Tạm ngưng' : 'Kích hoạt lại'}
                              </button>
                              {isSelf ? <small>Tài khoản của bạn</small> : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="members-card-list">
                  {filteredMembers.map((item) => {
                    const isSelf = item.userId === user?.id;
                    return (
                      <article className="member-mobile-card" key={item.id}>
                        <div className="member-mobile-top">
                          <div className="member-identity">
                            <span className="member-avatar">{item.name.slice(0, 1).toLocaleUpperCase('vi')}</span>
                            <span><strong>{item.name}</strong><small>{item.email}</small></span>
                          </div>
                          <span className={`member-status ${item.active ? 'is-active' : 'is-inactive'}`}><i />{item.active ? 'Đang hoạt động' : 'Tạm ngưng'}</span>
                        </div>
                        <div className="member-mobile-bottom">
                          <span className={`member-role-badge role-${item.role}`}>{roleLabels[item.role]}</span>
                          <div>
                            <button type="button" disabled={isSelf || busy} onClick={() => { setNewRole(item.role); setFormError(''); setAction({ kind: 'role', member: item }); }}>Đổi vai trò</button>
                            <button type="button" disabled={isSelf || busy} onClick={() => setAction({ kind: 'status', member: item, active: !item.active })}>{item.active ? 'Tạm ngưng' : 'Kích hoạt'}</button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>

      </main>

      {notice ? <div className="members-toast" role="status">{notice}</div> : null}

      {showCreate ? (
        <div className="members-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeCreate(); }}>
          <section className="members-modal" role="dialog" aria-modal="true" aria-labelledby="create-member-title">
            <button className="members-modal-close" type="button" aria-label="Đóng" onClick={closeCreate}>×</button>
            <p className="members-eyebrow">TÀI KHOẢN WORKSPACE</p>
            <h2 id="create-member-title">Thêm nhân sự</h2>
            <p className="members-modal-description">Tạo tài khoản mới và gửi thông tin đăng nhập cho thành viên.</p>
            <form onSubmit={handleCreate}>
              <label>Họ và tên<input required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></label>
              <label>Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" /></label>
              <label>Vai trò
                <select value={newRole} onChange={(event) => setNewRole(event.target.value as WorkspaceRole)}>
                  <option value={WorkspaceRole.Staff}>Nhân viên</option>
                  <option value={WorkspaceRole.Admin}>Admin</option>
                </select>
              </label>
              <label>Mật khẩu khởi tạo<input required type="password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" /><small>Ít nhất 12 ký tự.</small></label>
              {formError ? <p className="members-form-error" role="alert">{formError}</p> : null}
              <div className="members-modal-actions">
                <button type="button" className="members-secondary-button" onClick={closeCreate} disabled={busy}>Hủy</button>
                <button type="submit" className="members-primary-button" disabled={busy}>{busy ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {action ? (
        <div className="members-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setAction(null); }}>
          <section className="members-modal members-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="member-action-title">
            <button className="members-modal-close" type="button" aria-label="Đóng" onClick={() => setAction(null)} disabled={busy}>×</button>
            <p className="members-eyebrow">XÁC NHẬN THAY ĐỔI</p>
            <h2 id="member-action-title">{action.kind === 'role' ? 'Đổi vai trò' : action.active ? 'Kích hoạt tài khoản' : 'Tạm ngưng tài khoản'}</h2>
            <p className="members-modal-description"><strong>{action.member.name}</strong> · {action.member.email}</p>
            {action.kind === 'role' ? (
              <label className="members-role-field">Vai trò mới
                <select value={newRole} onChange={(event) => setNewRole(event.target.value as WorkspaceRole)}>
                  <option value={WorkspaceRole.Staff}>Nhân viên</option>
                  <option value={WorkspaceRole.Admin}>Admin</option>
                </select>
              </label>
            ) : (
              <p>{action.active ? 'Tài khoản sẽ có thể đăng nhập lại.' : 'Tài khoản sẽ không thể đăng nhập. Dữ liệu và lịch sử vẫn được giữ lại.'}</p>
            )}
            {formError ? <p className="members-form-error" role="alert">{formError}</p> : null}
            <div className="members-modal-actions">
              <button type="button" className="members-secondary-button" onClick={() => setAction(null)} disabled={busy}>Hủy</button>
              <button type="button" className="members-primary-button" onClick={() => void handleActionConfirm()} disabled={busy}>
                {busy ? 'Đang lưu...' : action.kind === 'role' ? 'Lưu thay đổi' : 'Xác nhận'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
