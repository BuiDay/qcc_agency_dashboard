import { Action, WorkspaceRole } from '@qcc/shared';
import { Actor } from '../src/common/interfaces/actor.interface';
import { PolicyService } from '../src/common/policy/policy.service';

describe('PolicyService', () => {
  const policy = new PolicyService();
  const staff: Actor = {
    userId: 'user-1',
    memberId: 'member-1',
    workspaceId: 'workspace-1',
    role: WorkspaceRole.Staff,
  };

  it('cho phép staff đọc thành viên cùng workspace nhưng không tạo thành viên', () => {
    expect(
      policy.can(staff, Action.MembersRead, {
        workspaceId: staff.workspaceId,
      }),
    ).toBe(true);
    expect(
      policy.can(staff, Action.MembersCreate, {
        workspaceId: staff.workspaceId,
      }),
    ).toBe(false);
  });

  it('không cho truy cập chéo workspace, kể cả admin', () => {
    expect(
      policy.can(
        { ...staff, role: WorkspaceRole.Admin },
        Action.MembersRead,
        { workspaceId: 'another-workspace' },
      ),
    ).toBe(false);
  });

  it('chỉ cho staff xem hồ sơ của chính họ', () => {
    expect(
      policy.can(staff, Action.UserRead, { userId: staff.userId }),
    ).toBe(true);
    expect(
      policy.can(staff, Action.UserRead, { userId: 'user-2' }),
    ).toBe(false);
  });
});
