// Quy tắc chuyển trạng thái task. Hàm thuần: nhận trạng thái hiện tại, trả về phần cần cập nhật.
// Service chỉ việc lưu kết quả → dễ test, dễ đổi quy trình.
import {
  AcceptanceStatus,
  ApprovalStatus,
  ErrorCode,
  ReviewResult,
  ReviewSource,
  StatusType,
  SUBMITTABLE_STATUSES,
} from '@qcc/shared';
import { AppException } from '../common/app-exception';

export interface TaskState {
  statusType: StatusType;
  acceptance: { status: AcceptanceStatus; at?: Date; reason?: string };
  approvalStatus: ApprovalStatus;
  revisionCount: number;
}

export interface ReviewRecord {
  by: string;
  result: ReviewResult;
  note: string;
  source: ReviewSource;
  at: Date;
}

export interface TaskPatch {
  statusType?: StatusType;
  statusChangedAt?: Date;
  completedAt?: Date | null;
  approvalStatus?: ApprovalStatus;
  acceptance?: TaskState['acceptance'];
  revisionCount?: number;
  review?: ReviewRecord; // service push vào reviewHistory
}

const fail = (code: ErrorCode) => new AppException(code);

/** Trạng thái duyệt tương ứng khi vào một cột */
function approvalFor(to: StatusType, current: ApprovalStatus): ApprovalStatus {
  switch (to) {
    case StatusType.InternalReview:
      return ApprovalStatus.PendingInternal;
    case StatusType.ClientReview:
      return ApprovalStatus.PendingClient;
    case StatusType.Revision:
      return ApprovalStatus.ChangesRequested;
    case StatusType.Scheduled:
    case StatusType.Done:
      return ApprovalStatus.Approved;
    default:
      return current;
  }
}

/** Đổi cột: cập nhật statusChangedAt, completedAt, approvalStatus */
export function changeStatus(task: TaskState, to: StatusType, now: Date): TaskPatch {
  if (task.statusType === to) return {};
  return {
    statusType: to,
    statusChangedAt: now,
    completedAt: to === StatusType.Done ? now : null,
    approvalStatus: approvalFor(to, task.approvalStatus),
  };
}

/** Giao (lại) việc: người mới phải tiếp nhận lại từ đầu */
export function assign(): TaskPatch {
  return { acceptance: { status: AcceptanceStatus.Pending } };
}

/** Nhân viên tiếp nhận. Task đang ở Brief thì tự sang Lên ý tưởng. */
export function accept(task: TaskState, now: Date): TaskPatch {
  if (task.acceptance.status !== AcceptanceStatus.Pending) {
    throw fail(ErrorCode.TaskNotPendingAcceptance);
  }
  const patch: TaskPatch = { acceptance: { status: AcceptanceStatus.Accepted, at: now } };
  if (task.statusType === StatusType.Brief) {
    Object.assign(patch, changeStatus(task, StatusType.Ideation, now));
  }
  return patch;
}

/** Nhân viên báo bận, bắt buộc lý do (tối thiểu 5 ký tự) */
export function decline(task: TaskState, reason: string | undefined, now: Date): TaskPatch {
  if (task.acceptance.status !== AcceptanceStatus.Pending) {
    throw fail(ErrorCode.TaskNotPendingAcceptance);
  }
  const trimmed = (reason ?? '').trim();
  if (trimmed.length < 5) throw fail(ErrorCode.DeclineReasonRequired);
  return { acceptance: { status: AcceptanceStatus.Declined, at: now, reason: trimmed } };
}

/** Nộp duyệt: phải đã tiếp nhận và đang ở cột làm việc */
export function submit(task: TaskState, now: Date): TaskPatch {
  if (task.acceptance.status !== AcceptanceStatus.Accepted) {
    throw fail(ErrorCode.TaskNotAccepted);
  }
  if (!SUBMITTABLE_STATUSES.includes(task.statusType)) {
    throw fail(ErrorCode.TaskInvalidState);
  }
  return changeStatus(task, StatusType.InternalReview, now);
}

/**
 * Duyệt: source=internal (leader duyệt nội bộ) hoặc client (ghi nhận khách duyệt).
 * Đạt: nội bộ → Khách duyệt; khách → Lên lịch đăng.
 * Yêu cầu sửa: → Chỉnh sửa, revisionCount + 1, bắt buộc góp ý.
 */
export function review(
  task: TaskState,
  input: { result: ReviewResult; note?: string; by: string; source: ReviewSource },
  now: Date,
): TaskPatch {
  const expected =
    input.source === ReviewSource.Internal ? StatusType.InternalReview : StatusType.ClientReview;
  if (task.statusType !== expected) throw fail(ErrorCode.TaskInvalidState);

  const note = (input.note ?? '').trim();
  const record: ReviewRecord = { by: input.by, result: input.result, note, source: input.source, at: now };

  if (input.result === ReviewResult.Approved) {
    const to = input.source === ReviewSource.Internal ? StatusType.ClientReview : StatusType.Scheduled;
    return { ...changeStatus(task, to, now), review: record };
  }

  if (!note) throw fail(ErrorCode.ReviewNoteRequired);
  return {
    ...changeStatus(task, StatusType.Revision, now),
    revisionCount: task.revisionCount + 1,
    review: record,
  };
}
