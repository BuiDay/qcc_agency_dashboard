// Toàn bộ quy tắc phân quyền nằm ở file này. Muốn đổi quyền: chỉ sửa ở đây (+ test).
// Hàm thuần (không đụng DB) để dễ test; dữ liệu cần thiết truyền qua ctx.
import { Action, ErrorCode, STAFF_LOCKED_STATUSES, StatusType, WorkspaceRole } from '@qcc/shared';
import type { Actor } from '../common/actor';

type Id = { toString(): string };

export interface PolicyContext {
  project?: { leaderIds: Id[]; memberIds: Id[] };
  task?: {
    ownerId?: Id | null;
    collaboratorIds: Id[];
    statusType: StatusType;
    checklistAssigneeIds?: Id[];
  };
  /** Cột đích khi kéo thả */
  targetStatus?: StatusType;
}

const includes = (list: Id[] | undefined, id: string) => !!list?.some((x) => x.toString() === id);

/** Trả về null nếu được phép, ngược lại trả về mã lỗi */
export function check(actor: Actor, action: Action, ctx: PolicyContext = {}): ErrorCode | null {
  if (actor.role === WorkspaceRole.Admin) return null;
  // Cổng khách hàng chưa mở: client không có quyền gì ở khu nội bộ
  if (actor.role !== WorkspaceRole.Staff) return ErrorCode.Forbidden;

  const me = actor.memberId;
  const isLeader = includes(ctx.project?.leaderIds, me);
  const isOwner = !!ctx.task?.ownerId && ctx.task.ownerId.toString() === me;
  const isCollaborator = includes(ctx.task?.collaboratorIds, me);
  const isChecklistAssignee = includes(ctx.task?.checklistAssigneeIds, me);
  const allow = (ok: boolean) => (ok ? null : ErrorCode.Forbidden);

  switch (action) {
    // Nhân viên xem được mọi dự án nội bộ
    case Action.ProjectView:
    case Action.TaskView:
      return null;

    // Chỉ admin
    case Action.WorkspaceUpdate:
    case Action.MemberManage:
    case Action.ClientManage:
    case Action.ProjectCreate:
    case Action.ProjectAssignLeader:
    case Action.ProjectArchive:
    case Action.TaskDelete:
      return ErrorCode.Forbidden;

    // Leader của dự án
    case Action.ProjectUpdate:
    case Action.ProjectManageMembers:
    case Action.TaskCreate:
    case Action.TaskUpdate:
    case Action.TaskAssign:
    case Action.TaskReview:
    case Action.TaskClientReview:
    case Action.TaskArchive:
      return allow(isLeader);

    // Người được giao (owner) tự tiếp nhận / báo bận / nộp duyệt
    case Action.TaskAccept:
    case Action.TaskDecline:
      return isOwner ? null : ErrorCode.TaskNotAssigned;
    case Action.TaskSubmit:
      return isLeader || isOwner ? null : ErrorCode.TaskNotAssigned;

    // Tick checklist: leader, owner, người phối hợp, người được giao mục đó
    case Action.TaskChecklist:
      return allow(isLeader || isOwner || isCollaborator || isChecklistAssignee);

    // Kéo thả: leader thoải mái; nhân viên chỉ task của mình và không vào/ra cột khoá
    case Action.TaskMove: {
      if (isLeader) return null;
      if (!isOwner && !isCollaborator) return ErrorCode.Forbidden;
      const locked = (s?: StatusType) => !!s && STAFF_LOCKED_STATUSES.includes(s);
      if (locked(ctx.targetStatus) || locked(ctx.task?.statusType)) {
        return ErrorCode.TaskColumnLocked;
      }
      return null;
    }

    default:
      return ErrorCode.Forbidden;
  }
}

export const can = (actor: Actor, action: Action, ctx?: PolicyContext) =>
  check(actor, action, ctx) === null;
