import {
  AcceptanceStatus,
  TaskReviewResult,
  TaskStatusType,
} from '@qcc/shared';
import { TaskWorkflowService } from '../src/tasks/task-workflow.service';

describe('TaskWorkflowService', () => {
  const workflow = new TaskWorkflowService();
  const acceptedProduction = {
    statusType: TaskStatusType.Production,
    acceptance: { status: AcceptanceStatus.Accepted },
    revisionCount: 0,
  };

  it('accepts and declines only pending assignments', () => {
    expect(
      workflow.accept({
        ...acceptedProduction,
        acceptance: { status: AcceptanceStatus.Pending },
      }).acceptance?.status,
    ).toBe(AcceptanceStatus.Accepted);
    expect(() =>
      workflow.decline(acceptedProduction, 'Quá tải'),
    ).toThrow('INVALID_TASK_TRANSITION');
  });

  it('submits accepted production work for internal review', () => {
    expect(workflow.submit(acceptedProduction, 'Bản đầu')).toMatchObject({
      statusType: TaskStatusType.InternalReview,
      submissionNote: 'Bản đầu',
    });
    expect(() =>
      workflow.submit({
        ...acceptedProduction,
        acceptance: { status: AcceptanceStatus.Pending },
      }),
    ).toThrow('INVALID_TASK_TRANSITION');
  });

  it('routes internal approval forward and requests revision with a counter', () => {
    const underReview = {
      ...acceptedProduction,
      statusType: TaskStatusType.InternalReview,
    };
    expect(
      workflow.review(
        underReview,
        'leader-1',
        TaskReviewResult.Approved,
      ),
    ).toMatchObject({ statusType: TaskStatusType.ClientReview });
    expect(
      workflow.review(
        underReview,
        'leader-1',
        TaskReviewResult.RevisionRequired,
        'Sửa tiêu đề',
      ),
    ).toMatchObject({
      statusType: TaskStatusType.Revision,
      revisionCount: 1,
      reviewHistory: [{ source: 'internal', result: 'revision_required' }],
    });
  });

  it('routes client approval to scheduling and client revision back to revision', () => {
    const clientReview = {
      ...acceptedProduction,
      statusType: TaskStatusType.ClientReview,
      revisionCount: 1,
    };
    expect(
      workflow.clientReview(
        clientReview,
        'leader-1',
        TaskReviewResult.Approved,
      ),
    ).toMatchObject({ statusType: TaskStatusType.Scheduled });
    expect(
      workflow.clientReview(
        clientReview,
        'leader-1',
        TaskReviewResult.RevisionRequired,
      ),
    ).toMatchObject({
      statusType: TaskStatusType.Revision,
      revisionCount: 2,
      reviewHistory: [{ source: 'client' }],
    });
  });
});
