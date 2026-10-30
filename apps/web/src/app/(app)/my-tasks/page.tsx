'use client';

import { AcceptanceStatus, TaskStatusType } from '@qcc/shared';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppShell } from '@/features/app-shell/components/app-shell';

type TaskFilter = 'all' | 'todo' | 'pending' | 'done';
type TaskGroup = 'overdue' | 'today' | 'upcoming' | 'no-date' | 'done';
type MockTask = {
  id: string;
  title: string;
  project: string;
  statusType: TaskStatusType;
  dueDate: string | null;
  acceptance: AcceptanceStatus;
  declinedReason?: string;
  waitingClientDays?: number;
  leader: string;
  checklist: { text: string; done: boolean }[];
};

const statusLabels: Record<TaskStatusType, string> = {
  [TaskStatusType.Brief]: 'Brief',
  [TaskStatusType.Ideation]: 'Lên ý tưởng',
  [TaskStatusType.Production]: 'Sản xuất',
  [TaskStatusType.InternalReview]: 'Duyệt nội bộ',
  [TaskStatusType.ClientReview]: 'Khách duyệt',
  [TaskStatusType.Revision]: 'Chỉnh sửa',
  [TaskStatusType.Scheduled]: 'Lên lịch đăng',
  [TaskStatusType.Done]: 'Hoàn thành',
};

function dateOffset(days: number): string {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const initialTasks: MockTask[] = [
  {
    id: 'task-1',
    title: 'Hoàn thiện bộ bài social tuần 3',
    project: 'Mộc Nhiên — Social tháng 10',
    statusType: TaskStatusType.Production,
    dueDate: dateOffset(-2),
    acceptance: AcceptanceStatus.Accepted,
    leader: 'Linh Nguyễn',
    checklist: [
      { text: 'Chốt nội dung 5 bài đăng', done: true },
      { text: 'Thiết kế hình ảnh theo nhận diện', done: false },
      { text: 'Xuất file và gửi duyệt', done: false },
    ],
  },
  {
    id: 'task-2',
    title: 'Dựng video review sản phẩm mới',
    project: 'An Nhiên — Ra mắt sản phẩm',
    statusType: TaskStatusType.Production,
    dueDate: dateOffset(0),
    acceptance: AcceptanceStatus.Pending,
    leader: 'Minh Trần',
    checklist: [
      { text: 'Chọn footage phù hợp', done: false },
      { text: 'Dựng bản video 30 giây', done: false },
      { text: 'Thêm phụ đề và nhạc nền', done: false },
    ],
  },
  {
    id: 'task-3',
    title: 'Chỉnh sửa caption chiến dịch tháng 11',
    project: 'Lá Studio — Content tháng 11',
    statusType: TaskStatusType.Revision,
    dueDate: dateOffset(1),
    acceptance: AcceptanceStatus.Declined,
    declinedReason: 'Đang xử lý video gấp cho dự án khác.',
    leader: 'Linh Nguyễn',
    checklist: [
      { text: 'Đọc góp ý từ Leader', done: true },
      { text: 'Cập nhật caption', done: false },
    ],
  },
  {
    id: 'task-4',
    title: 'Thiết kế key visual chương trình ưu đãi',
    project: 'Mộc Nhiên — Social tháng 10',
    statusType: TaskStatusType.ClientReview,
    dueDate: dateOffset(3),
    acceptance: AcceptanceStatus.Accepted,
    waitingClientDays: 3,
    leader: 'Minh Trần',
    checklist: [
      { text: 'Gửi bản thiết kế cho khách', done: true },
      { text: 'Chờ khách phản hồi', done: false },
    ],
  },
  {
    id: 'task-5',
    title: 'Lên ý tưởng nội dung cho tuần tiếp theo',
    project: 'An Nhiên — Ra mắt sản phẩm',
    statusType: TaskStatusType.Ideation,
    dueDate: dateOffset(4),
    acceptance: AcceptanceStatus.Accepted,
    leader: 'Linh Nguyễn',
    checklist: [
      { text: 'Tham khảo nội dung tháng trước', done: true },
      { text: 'Đề xuất 5 chủ đề mới', done: false },
    ],
  },
  {
    id: 'task-6',
    title: 'Tổng hợp hình ảnh sản phẩm',
    project: 'Lá Studio — Content tháng 11',
    statusType: TaskStatusType.Brief,
    dueDate: null,
    acceptance: AcceptanceStatus.Pending,
    leader: 'Minh Trần',
    checklist: [
      { text: 'Nhận hình ảnh từ khách', done: false },
      { text: 'Sắp xếp vào thư mục dự án', done: false },
    ],
  },
  {
    id: 'task-7',
    title: 'Hoàn tất lịch đăng tuần 2',
    project: 'Mộc Nhiên — Social tháng 10',
    statusType: TaskStatusType.Done,
    dueDate: dateOffset(-1),
    acceptance: AcceptanceStatus.Accepted,
    leader: 'Linh Nguyễn',
    checklist: [
      { text: 'Duyệt lịch đăng', done: true },
      { text: 'Bàn giao nội dung', done: true },
    ],
  },
];

const filterLabels: Record<TaskFilter, string> = {
  all: 'Tất cả',
  todo: 'Cần làm',
  pending: 'Chờ tiếp nhận',
  done: 'Đã hoàn thành',
};

const groupLabels: Record<TaskGroup, string> = {
  overdue: 'Quá hạn',
  today: 'Hôm nay',
  upcoming: 'Sắp tới',
  'no-date': 'Chưa có hạn',
  done: 'Đã hoàn thành',
};

function getTaskGroup(task: MockTask): TaskGroup {
  if (task.statusType === TaskStatusType.Done) return 'done';
  if (!task.dueDate) return 'no-date';

  const now = new Date();
  const due = new Date(task.dueDate);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (dueDay < today) return 'overdue';
  if (dueDay.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function formatDueDate(task: MockTask): string {
  if (!task.dueDate) return 'Chưa đặt hạn';
  const group = getTaskGroup(task);
  if (group === 'today') return 'Hạn hôm nay';
  if (group === 'overdue') {
    const days = Math.ceil(
      (new Date().setHours(0, 0, 0, 0) -
        new Date(task.dueDate).setHours(0, 0, 0, 0)) /
        86_400_000,
    );
    return `Quá hạn ${days} ngày`;
  }
  return `Hạn ${new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'numeric',
  }).format(new Date(task.dueDate))}`;
}

function Icon({
  name,
  size = 20,
}: {
  name: 'home' | 'board' | 'bell' | 'users' | 'chevron' | 'close' | 'calendar' | 'check' | 'clock' | 'arrow' | 'spark';
  size?: number;
}) {
  const paths: Record<typeof name, string> = {
    home: 'M3 10.5 12 3l9 7.5M5 9v11h14V9M9 20v-6h6v6',
    board: 'M4 4h7v16H4zM14 4h6v10h-6zM14 17h6v3h-6z',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    users: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
    chevron: 'm9 18 6-6-6-6',
    close: 'M18 6 6 18M6 6l12 12',
    calendar: 'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z',
    check: 'm5 12 4 4L19 6',
    clock: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    arrow: 'M7 17 17 7M7 7h10v10',
    spark: 'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3ZM19 14l1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z',
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

export default function MyTasksPage() {
  const { user, logout } = useAuth();
  const { setTaskCount } = useAppShell();
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>('todo');
  const [projectFilter, setProjectFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<MockTask | null>(null);
  const [decliningTask, setDecliningTask] = useState<MockTask | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const projects = useMemo(
    () => [...new Set(tasks.map((task) => task.project))],
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (projectFilter !== 'all' && task.project !== projectFilter) return false;
      if (filter === 'todo') return task.statusType !== TaskStatusType.Done;
      if (filter === 'pending') {
        return (
          task.statusType !== TaskStatusType.Done &&
          task.acceptance === AcceptanceStatus.Pending
        );
      }
      if (filter === 'done') return task.statusType === TaskStatusType.Done;
      return true;
    });
  }, [filter, projectFilter, tasks]);

  const groups = useMemo(() => {
    const order: TaskGroup[] =
      filter === 'done'
        ? ['done']
        : ['overdue', 'today', 'upcoming', 'no-date', ...(filter === 'all' ? ['done' as const] : [])];
    return order
      .map((group) => ({
        group,
        tasks: filteredTasks.filter((task) => getTaskGroup(task) === group),
      }))
      .filter((item) => item.tasks.length > 0);
  }, [filter, filteredTasks]);

  function updateAcceptance(taskId: string, acceptance: AcceptanceStatus, reason?: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              acceptance,
              ...(reason ? { declinedReason: reason } : {}),
            }
          : task,
      ),
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((current) =>
        current ? { ...current, acceptance, ...(reason ? { declinedReason: reason } : {}) } : null,
      );
    }
  }

  function handleAccept(task: MockTask) {
    updateAcceptance(task.id, AcceptanceStatus.Accepted);
    setNotice('Đã tiếp nhận task.');
  }

  function toggleChecklistItem(taskId: string, itemText: string) {
    const updateTask = (task: MockTask): MockTask => ({
      ...task,
      checklist: task.checklist.map((item) =>
        item.text === itemText ? { ...item, done: !item.done } : item,
      ),
    });
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? updateTask(task) : task)),
    );
    setSelectedTask((current) =>
      current?.id === taskId ? updateTask(current) : current,
    );
  }

  function submitForReview(task: MockTask) {
    const updateTask = (current: MockTask): MockTask => ({
      ...current,
      statusType: TaskStatusType.InternalReview,
    });
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? updateTask(item) : item)),
    );
    setSelectedTask(updateTask(task));
    setNotice('Đã nộp task để Leader duyệt.');
  }

  function handleDecline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!decliningTask || !declineReason.trim()) return;
    updateAcceptance(
      decliningTask.id,
      AcceptanceStatus.Declined,
      declineReason.trim(),
    );
    setDecliningTask(null);
    setDeclineReason('');
    setNotice('Đã báo bận. Leader sẽ sắp xếp lại công việc.');
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setNotice('Chưa thể đăng xuất. Vui lòng kiểm tra kết nối và thử lại.');
      setLoggingOut(false);
    }
  }

  const counts: Record<TaskFilter, number> = {
    all: tasks.length,
    todo: tasks.filter((task) => task.statusType !== TaskStatusType.Done).length,
    pending: tasks.filter(
      (task) =>
        task.statusType !== TaskStatusType.Done &&
        task.acceptance === AcceptanceStatus.Pending,
    ).length,
    done: tasks.filter((task) => task.statusType === TaskStatusType.Done).length,
  };

  useEffect(() => {
    setTaskCount(counts.todo);
  }, [counts.todo, setTaskCount]);

  return (
    <>
      <main className="mytasks-main">
        <header className="mytasks-topbar">
          <div className="mobile-brand">
            <span className="mytasks-brand-mark">Q</span>
            <span>QCC <b>AGENCY</b></span>
          </div>
          <div className="breadcrumb">
            <span>Công việc</span><Icon name="chevron" size={15} /><strong>Việc của tôi</strong>
          </div>
          <div className="topbar-actions">
            <button type="button" className="icon-button notification-button" aria-label="Thông báo" onClick={() => setNotice('Thông báo sẽ sớm được bổ sung.')}>
              <Icon name="bell" />
              <span />
            </button>
            <button
              type="button"
              className="topbar-user"
              onClick={handleLogout}
              disabled={loggingOut}
              title="Đăng xuất"
            >
              <span className="user-avatar">{user?.name?.slice(0, 1) ?? 'B'}</span>
              <span>{user?.name ?? 'Bạn'}</span>
              <span className="user-chevron">⌄</span>
            </button>
          </div>
        </header>

        <div className="mytasks-content">
          <section className="mytasks-heading">
            <div>
              <p className="page-eyebrow">KHÔNG GIAN CỦA BẠN</p>
              <h1>Việc của tôi<span className="heading-period">.</span></h1>
              <p className="page-description">Đây là những việc bạn cần xử lý.</p>
            </div>
            <div className="today-date">
              <span className="date-icon"><Icon name="calendar" size={18} /></span>
              <span>
                <small>HÔM NAY</small>
                <strong>
                  {new Intl.DateTimeFormat('vi-VN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }).format(new Date())}
                </strong>
              </span>
            </div>
          </section>

          <section className="mytasks-controls" aria-label="Bộ lọc công việc">
            <div className="task-filters" role="tablist" aria-label="Lọc task">
              {(Object.keys(filterLabels) as TaskFilter[]).map((key) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={`task-filter ${filter === key ? 'selected' : ''}`}
                  key={key}
                  onClick={() => setFilter(key)}
                >
                  {filterLabels[key]}
                  {counts[key] > 0 ? <span>{counts[key]}</span> : null}
                </button>
              ))}
            </div>
            <label className="project-select-wrap">
              <span className="sr-only">Lọc theo dự án</span>
              <select
                value={projectFilter}
                onChange={(event) => setProjectFilter(event.target.value)}
              >
                <option value="all">Tất cả dự án</option>
                {projects.map((project) => <option key={project}>{project}</option>)}
              </select>
              <span className="select-chevron">⌄</span>
            </label>
          </section>

          {projectFilter !== 'all' ? (
            <div className="active-project-filter">
              Đang lọc: <strong>{projectFilter}</strong>
              <button type="button" onClick={() => setProjectFilter('all')}>Xóa lọc</button>
            </div>
          ) : null}

          {loading ? (
            <div className="task-groups" aria-label="Đang tải công việc" aria-busy="true">
              {[0, 1, 2].map((item) => (
                <section className="task-group" key={item}>
                  <div className="skeleton skeleton-group-heading" />
                  <div className="task-skeleton">
                    <span className="skeleton skeleton-dot" />
                    <span className="skeleton skeleton-title" />
                    <span className="skeleton skeleton-meta" />
                  </div>
                </section>
              ))}
            </div>
          ) : groups.length > 0 ? (
            <div className="task-groups">
              {groups.map(({ group, tasks: groupTasks }) => (
                <section className="task-group" key={group}>
                  <div className="task-group-heading">
                    <span className={`group-marker marker-${group}`} />
                    <h2>{groupLabels[group]}</h2>
                    <span className="group-count">{groupTasks.length}</span>
                    {group === 'overdue' ? <span className="group-attention">Cần ưu tiên</span> : null}
                  </div>
                  <div className="task-card-list">
                    {groupTasks.map((task) => (
                      <article
                        key={task.id}
                        className={`mytask-card ${group === 'overdue' ? 'is-overdue' : ''}`}
                      >
                        <button
                          type="button"
                          className="task-card-main"
                          onClick={() => setSelectedTask(task)}
                          aria-label={`Mở chi tiết: ${task.title}`}
                        >
                          <span className="task-card-content">
                            <span className="task-title-row">
                              <strong className="task-title">{task.title}</strong>
                              <Icon name="arrow" size={16} />
                            </span>
                            <span className="task-project">{task.project}</span>
                            <span className="task-card-meta">
                              <span className={`status-chip status-${task.statusType}`}>
                                <span />{statusLabels[task.statusType]}
                              </span>
                              <span className={`due-label ${group === 'overdue' ? 'due-overdue' : ''}`}>
                                <Icon name="clock" size={14} />{formatDueDate(task)}
                              </span>
                            </span>
                            <span className="task-card-footer">
                              <span className="leader-avatar">{task.leader.slice(0, 1)}</span>
                              <span>Leader: {task.leader}</span>
                            </span>
                          </span>
                          <span className="task-badges">
                            {task.acceptance === AcceptanceStatus.Pending ? (
                              <span className="task-badge badge-pending">Chờ tiếp nhận</span>
                            ) : null}
                            {task.acceptance === AcceptanceStatus.Declined ? (
                              <span className="task-badge badge-declined">Đã báo bận</span>
                            ) : null}
                            {task.waitingClientDays ? (
                              <span className="task-badge badge-client">Chờ khách {task.waitingClientDays} ngày</span>
                            ) : null}
                            {group === 'overdue' ? <span className="task-badge badge-overdue">Quá hạn</span> : null}
                          </span>
                        </button>
                        {task.acceptance === AcceptanceStatus.Pending && task.statusType !== TaskStatusType.Done ? (
                          <div className="task-card-actions">
                            <button type="button" className="accept-button" onClick={() => handleAccept(task)}>
                              <Icon name="check" size={16} />Tiếp nhận
                            </button>
                            <button
                              type="button"
                              className="decline-button"
                              onClick={() => { setDecliningTask(task); setDeclineReason(''); }}
                            >
                              Báo bận
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <section className="mytasks-empty">
              <span className="empty-illustration"><Icon name="check" size={27} /></span>
              <h2>
                {filter === 'todo'
                  ? 'Bạn đã xử lý hết việc cần làm. Tuyệt vời!'
                  : filter === 'pending'
                    ? 'Không có task nào đang chờ bạn tiếp nhận.'
                    : filter === 'done'
                      ? 'Chưa có task nào hoàn thành.'
                      : projectFilter !== 'all'
                        ? 'Không có task trong mục này.'
                        : 'Chưa có task nào được giao cho bạn.'}
              </h2>
              <p>Các công việc mới sẽ xuất hiện tại đây khi được giao cho bạn.</p>
              {projectFilter !== 'all' ? (
                <button type="button" className="empty-action" onClick={() => setProjectFilter('all')}>Xóa bộ lọc</button>
              ) : null}
            </section>
          )}
        </div>

      </main>

      {notice ? (
        <div className="task-toast" role="status">
          <span className="toast-check"><Icon name="check" size={15} /></span>
          {notice}
          <button type="button" aria-label="Đóng thông báo" onClick={() => setNotice('')}><Icon name="close" size={15} /></button>
        </div>
      ) : null}

      {decliningTask ? (
        <div className="task-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDecliningTask(null);
        }}>
          <form className="decline-modal" role="dialog" aria-modal="true" aria-labelledby="decline-title" onSubmit={handleDecline}>
            <button type="button" className="modal-close" aria-label="Đóng" onClick={() => setDecliningTask(null)}><Icon name="close" /></button>
            <span className="modal-icon"><Icon name="clock" size={21} /></span>
            <p className="modal-eyebrow">PHẢN HỒI PHÂN CÔNG</p>
            <h2 id="decline-title">Báo bận với task này?</h2>
            <p className="modal-task-name">{decliningTask.title}</p>
            <label htmlFor="decline-reason">Bạn bận việc gì? <span>*</span></label>
            <textarea
              id="decline-reason"
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
              placeholder="Leader sẽ dựa vào đây để sắp xếp lại."
              rows={4}
              required
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setDecliningTask(null)}>Để sau</button>
              <button type="submit" className="modal-submit" disabled={!declineReason.trim()}>Gửi báo bận</button>
            </div>
          </form>
        </div>
      ) : null}

      {selectedTask ? (
        <div className="task-drawer-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedTask(null);
        }}>
          <aside className="task-drawer" role="dialog" aria-modal="true" aria-labelledby="detail-title">
            <div className="drawer-header">
              <span>Chi tiết task</span>
              <button type="button" className="icon-button" aria-label="Đóng chi tiết" onClick={() => setSelectedTask(null)}><Icon name="close" /></button>
            </div>
            <div className="drawer-content">
              <p className="drawer-project">{selectedTask.project}</p>
              <h2 id="detail-title">{selectedTask.title}</h2>
              <div className="drawer-status-row">
                <span className={`status-chip status-${selectedTask.statusType}`}><span />{statusLabels[selectedTask.statusType]}</span>
                <span className={`due-label ${getTaskGroup(selectedTask) === 'overdue' ? 'due-overdue' : ''}`}><Icon name="clock" size={14} />{formatDueDate(selectedTask)}</span>
              </div>
              <div className="drawer-divider" />
              <div className="drawer-info-grid">
                <div><small>NGƯỜI PHỤ TRÁCH</small><span><span className="leader-avatar">{selectedTask.leader.slice(0, 1)}</span>{selectedTask.leader}</span></div>
                <div><small>TIẾP NHẬN</small><span>{selectedTask.acceptance === AcceptanceStatus.Pending ? 'Đang chờ' : selectedTask.acceptance === AcceptanceStatus.Accepted ? 'Đã tiếp nhận' : 'Đã báo bận'}</span></div>
              </div>
              {selectedTask.declinedReason ? <p className="declined-reason"><strong>Lý do báo bận:</strong> {selectedTask.declinedReason}</p> : null}
              {selectedTask.waitingClientDays ? <p className="client-wait-note"><Icon name="clock" size={16} /> Task đang chờ khách duyệt {selectedTask.waitingClientDays} ngày</p> : null}
              <div className="drawer-section-heading"><h3>Checklist</h3><span>{selectedTask.checklist.filter((item) => item.done).length}/{selectedTask.checklist.length}</span></div>
              <div className="checklist-progress"><span style={{ width: `${(selectedTask.checklist.filter((item) => item.done).length / selectedTask.checklist.length) * 100}%` }} /></div>
              <ul className="drawer-checklist">
                {selectedTask.checklist.map((item) => (
                  <li key={item.text} className={item.done ? 'checked' : ''}>
                    <button
                      type="button"
                      className="checklist-toggle"
                      aria-label={`${item.done ? 'Bỏ chọn' : 'Đánh dấu hoàn thành'}: ${item.text}`}
                      aria-pressed={item.done}
                      onClick={() => toggleChecklistItem(selectedTask.id, item.text)}
                    >
                    <span className="checklist-box">{item.done ? <Icon name="check" size={13} /> : null}</span>{item.text}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="drawer-placeholder">
                <span><Icon name="board" size={18} /></span>
                <div><strong>File & bình luận</strong><small>Chi tiết file và trao đổi sẽ được bổ sung ở bước tiếp theo.</small></div>
              </div>
            </div>
            {selectedTask.acceptance === AcceptanceStatus.Pending ? (
              <div className="drawer-actions">
                <button type="button" className="accept-button" onClick={() => handleAccept(selectedTask)}><Icon name="check" size={16} />Tiếp nhận</button>
                <button type="button" className="decline-button" onClick={() => { setDecliningTask(selectedTask); setDeclineReason(''); setSelectedTask(null); }}>Báo bận</button>
              </div>
            ) : selectedTask.acceptance === AcceptanceStatus.Accepted &&
              [TaskStatusType.Production, TaskStatusType.Revision].includes(selectedTask.statusType) ? (
              <div className="drawer-actions">
                <button type="button" className="accept-button" onClick={() => submitForReview(selectedTask)}>
                  <Icon name="check" size={16} />Nộp duyệt
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
