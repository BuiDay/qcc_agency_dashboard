import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  Action,
  ErrorCode,
  TaskStatusType,
  WorkspaceRole,
} from '@qcc/shared';
import { Actor } from '../interfaces/actor.interface';

export interface PolicyResource {
  workspaceId?: string;
  userId?: string;
  ownerId?: string;
  statusType?: TaskStatusType;
  projectLeaderIds?: string[];
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

    if (actor.role === WorkspaceRole.Staff) {
      switch (action) {
        case Action.ProjectsRead:
        case Action.TasksRead:
          return true;
        case Action.ProjectsManageMembers:
        case Action.TasksCreate:
        case Action.TasksUpdate:
        case Action.TasksArchive:
        case Action.TasksReview:
        case Action.TasksClientReview:
          return resource.projectLeaderIds?.includes(actor.userId) ?? false;
        case Action.TasksAccept:
        case Action.TasksDecline:
        case Action.TasksSubmit:
          return resource.ownerId === actor.userId;
        case Action.TasksMove:
          return (
            (resource.projectLeaderIds?.includes(actor.userId) ?? false) ||
            (resource.ownerId === actor.userId &&
              resource.statusType !== TaskStatusType.ClientReview &&
              resource.statusType !== TaskStatusType.Scheduled &&
              resource.statusType !== TaskStatusType.Done)
          );
        default:
          break;
      }
    }

    return (
      actor.role !== WorkspaceRole.Client &&
      action === Action.WorkspaceRead
    );
  }

  assertCan(actor: Actor, action: Action, resource: PolicyResource): void {
    if (!this.can(actor, action, resource)) {
      throw new ForbiddenException(ErrorCode.Forbidden);
    }
  }
}
