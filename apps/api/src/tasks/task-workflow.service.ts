import { ConflictException, Injectable } from '@nestjs/common';
import {
  AcceptanceStatus,
  ErrorCode,
  TaskApprovalStatus,
  TaskReviewResult,
  TaskStatusType,
} from '@qcc/shared';
import {
  TaskAcceptance,
  TaskReview,
} from './schemas/task.schema';

export interface TaskWorkflowState {
  statusType: TaskStatusType;
  acceptance: TaskAcceptance;
  revisionCount: number;
}

export interface TaskReviewEntry extends Omit<TaskReview, 'by'> {
  by: string;
}

export interface TaskWorkflowChanges {
  statusType?: TaskStatusType;
  acceptance?: TaskAcceptance;
  approvalStatus?: TaskApprovalStatus;
  submissionNote?: string;
  revisionCount?: number;
  statusChangedAt?: Date;
  reviewHistory?: TaskReviewEntry[];
}

@Injectable()
export class TaskWorkflowService {
  accept(task: TaskWorkflowState, now = new Date()): TaskWorkflowChanges {
    this.requireAcceptancePending(task);
    return {
      acceptance: { status: AcceptanceStatus.Accepted, at: now },
    };
  }

  decline(
    task: TaskWorkflowState,
    reason: string,
    now = new Date(),
  ): TaskWorkflowChanges {
    this.requireAcceptancePending(task);
    return {
      acceptance: { status: AcceptanceStatus.Declined, at: now, reason },
    };
  }

  submit(
    task: TaskWorkflowState,
    note = '',
    now = new Date(),
  ): TaskWorkflowChanges {
    if (
      task.acceptance.status !== AcceptanceStatus.Accepted ||
      ![TaskStatusType.Production, TaskStatusType.Revision].includes(
        task.statusType,
      )
    ) {
      this.invalidTransition();
    }
    return {
      statusType: TaskStatusType.InternalReview,
      approvalStatus: TaskApprovalStatus.Pending,
      submissionNote: note,
      statusChangedAt: now,
    };
  }

  review(
    task: TaskWorkflowState,
    actorId: string,
    result: TaskReviewResult,
    note = '',
    now = new Date(),
  ): TaskWorkflowChanges {
    if (task.statusType !== TaskStatusType.InternalReview) {
      this.invalidTransition();
    }
    const approved = result === TaskReviewResult.Approved;
    return {
      statusType: approved
        ? TaskStatusType.ClientReview
        : TaskStatusType.Revision,
      approvalStatus: approved
        ? TaskApprovalStatus.Approved
        : TaskApprovalStatus.RevisionRequired,
      revisionCount: task.revisionCount + (approved ? 0 : 1),
      statusChangedAt: now,
      reviewHistory: [
        {
          by: actorId,
          result,
          note,
          source: 'internal',
          at: now,
        },
      ],
    };
  }

  clientReview(
    task: TaskWorkflowState,
    actorId: string,
    result: TaskReviewResult,
    note = '',
    now = new Date(),
  ): TaskWorkflowChanges {
    if (task.statusType !== TaskStatusType.ClientReview) {
      this.invalidTransition();
    }
    const approved = result === TaskReviewResult.Approved;
    return {
      statusType: approved ? TaskStatusType.Scheduled : TaskStatusType.Revision,
      approvalStatus: approved
        ? TaskApprovalStatus.Approved
        : TaskApprovalStatus.RevisionRequired,
      revisionCount: task.revisionCount + (approved ? 0 : 1),
      statusChangedAt: now,
      reviewHistory: [
        {
          by: actorId,
          result,
          note,
          source: 'client',
          at: now,
        },
      ],
    };
  }

  private requireAcceptancePending(task: TaskWorkflowState): void {
    if (task.acceptance.status !== AcceptanceStatus.Pending) {
      this.invalidTransition();
    }
  }

  private invalidTransition(): never {
    throw new ConflictException(ErrorCode.InvalidTaskTransition);
  }
}
