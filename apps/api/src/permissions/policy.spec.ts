import { Action, ErrorCode, StatusType, WorkspaceRole } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { check, PolicyContext } from './policy';

const actor = (memberId: string, role = WorkspaceRole.Staff): Actor => ({
  userId: 'u-' + memberId,
  memberId,
  workspaceId: 'w1',
  role,
});

const admin = actor('admin', WorkspaceRole.Admin);
const leader = actor('leader');
const owner = actor('owner');
const collaborator = actor('collab');
const outsider = actor('outsider');
const client = actor('client', WorkspaceRole.Client);

const ctx = (statusType = StatusType.Production, targetStatus?: StatusType): PolicyContext => ({
  project: { leaderIds: ['leader'], memberIds: ['owner', 'collab', 'outsider'] },
  task: { ownerId: 'owner', collaboratorIds: ['collab'], statusType },
  targetStatus,
});

describe('policy', () => {
  it('admin được làm mọi thứ', () => {
    for (const action of Object.values(Action)) {
      expect(check(admin, action, ctx())).toBeNull();
    }
  });

  it('client chưa có quyền gì ở khu nội bộ', () => {
    expect(check(client, Action.TaskView, ctx())).toBe(ErrorCode.Forbidden);
  });

  it('nhân viên xem được mọi dự án và task', () => {
    expect(check(outsider, Action.ProjectView, ctx())).toBeNull();
    expect(check(outsider, Action.TaskView, ctx())).toBeNull();
  });

  it('chỉ admin tạo dự án, gán leader, quản lý khách hàng', () => {
    for (const a of [Action.ProjectCreate, Action.ProjectAssignLeader, Action.ClientManage, Action.MemberManage]) {
      expect(check(leader, a, ctx())).toBe(ErrorCode.Forbidden);
    }
  });

  it('leader tạo task, giao việc, duyệt trong dự án của mình', () => {
    for (const a of [Action.TaskCreate, Action.TaskAssign, Action.TaskReview, Action.TaskClientReview, Action.ProjectManageMembers]) {
      expect(check(leader, a, ctx())).toBeNull();
      expect(check(owner, a, ctx())).toBe(ErrorCode.Forbidden);
    }
  });

  it('leader dự án khác không có quyền leader ở dự án này', () => {
    const otherProject: PolicyContext = { ...ctx(), project: { leaderIds: ['someone'], memberIds: [] } };
    expect(check(leader, Action.TaskCreate, otherProject)).toBe(ErrorCode.Forbidden);
  });

  it('chỉ người được giao mới tiếp nhận / báo bận', () => {
    expect(check(owner, Action.TaskAccept, ctx())).toBeNull();
    expect(check(owner, Action.TaskDecline, ctx())).toBeNull();
    expect(check(collaborator, Action.TaskAccept, ctx())).toBe(ErrorCode.TaskNotAssigned);
    expect(check(leader, Action.TaskAccept, ctx())).toBe(ErrorCode.TaskNotAssigned);
  });

  it('tick checklist: owner, người phối hợp, người được giao mục; không phải người ngoài', () => {
    expect(check(owner, Action.TaskChecklist, ctx())).toBeNull();
    expect(check(collaborator, Action.TaskChecklist, ctx())).toBeNull();
    expect(check(outsider, Action.TaskChecklist, ctx())).toBe(ErrorCode.Forbidden);
    const withItem = ctx();
    withItem.task!.checklistAssigneeIds = ['outsider'];
    expect(check(outsider, Action.TaskChecklist, withItem)).toBeNull();
  });

  describe('kéo thả', () => {
    it('nhân viên kéo task của mình giữa các cột thường', () => {
      expect(check(owner, Action.TaskMove, ctx(StatusType.Production, StatusType.InternalReview))).toBeNull();
      expect(check(collaborator, Action.TaskMove, ctx(StatusType.Ideation, StatusType.Production))).toBeNull();
    });

    it('nhân viên không thả vào cột khoá', () => {
      for (const target of [StatusType.ClientReview, StatusType.Scheduled, StatusType.Done]) {
        expect(check(owner, Action.TaskMove, ctx(StatusType.Production, target))).toBe(ErrorCode.TaskColumnLocked);
      }
    });

    it('nhân viên không kéo task đang nằm trong cột khoá ra ngoài', () => {
      expect(check(owner, Action.TaskMove, ctx(StatusType.ClientReview, StatusType.Revision))).toBe(ErrorCode.TaskColumnLocked);
    });

    it('nhân viên không kéo task của người khác', () => {
      expect(check(outsider, Action.TaskMove, ctx(StatusType.Production, StatusType.Ideation))).toBe(ErrorCode.Forbidden);
    });

    it('leader kéo vào mọi cột', () => {
      expect(check(leader, Action.TaskMove, ctx(StatusType.Production, StatusType.Done))).toBeNull();
    });
  });
});
