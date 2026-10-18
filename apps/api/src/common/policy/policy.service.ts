import { ForbiddenException, Injectable } from '@nestjs/common';
import { Action, ErrorCode, WorkspaceRole } from '@qcc/shared';
import { Actor } from '../interfaces/actor.interface';

export interface PolicyResource {
  workspaceId?: string;
  userId?: string;
}

@Injectable()
export class PolicyService {
  can(actor: Actor, action: Action, resource: PolicyResource): boolean {
    if (
      resource.workspaceId &&
      resource.workspaceId !== actor.workspaceId
    ) {
      return false;
    }

    if (
      action === Action.UserRead &&
      resource.userId === actor.userId
    ) {
      return true;
    }

    if (actor.role === WorkspaceRole.Admin) return true;

    return (
      actor.role !== WorkspaceRole.Client &&
      [Action.WorkspaceRead, Action.MembersRead].includes(action)
    );
  }

  assertCan(actor: Actor, action: Action, resource: PolicyResource): void {
    if (!this.can(actor, action, resource)) {
      throw new ForbiddenException(ErrorCode.Forbidden);
    }
  }
}
