import { WorkspaceRole } from '@qcc/shared';

export interface Actor {
  userId: string;
  memberId: string;
  workspaceId: string;
  role: WorkspaceRole;
}
