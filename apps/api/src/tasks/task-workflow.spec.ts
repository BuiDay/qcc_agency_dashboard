import {
  AcceptanceStatus,
  ApprovalStatus,
  ErrorCode,
  ReviewResult,
  ReviewSource,
  StatusType,
} from '@qcc/shared';
import { AppException } from '../common/app-exception';
import * as wf from './task-workflow';

const now = new Date('2026-10-19T08:00:00Z');

const state = (over: Partial<wf.TaskState> = {}): wf.TaskState => ({
  statusType: StatusType.Brief,
  acceptance: { status: AcceptanceStatus.Pending },
  approvalStatus: ApprovalStatus.None,
  revisionCount: 0,
  ...over,
});

/** Áp patch lên state để mô phỏng cả vòng đời */
const apply = (s: wf.TaskState, p: wf.TaskPatch): wf.TaskState => ({
  statusType: p.statusType ?? s.statusType,
  acceptance: p.acceptance ?? s.acceptance,
  approvalStatus: p.approvalStatus ?? s.approvalStatus,
  revisionCount: p.revisionCount ?? s.revisionCount,
});

const expectCode = (fn: () => unknown, code: ErrorCode) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(AppException);
    expect((e as AppException).code).toBe(code);
    return;
  }
  throw new Error(`Không ném lỗi ${code}`);
};

describe('task workflow', () => {
  it('tiếp nhận: Brief tự chuyển sang Lên ý tưởng', () => {
    const p = wf.accept(state(), now);
    expect(p.acceptance).toEqual({ status: AcceptanceStatus.Accepted, at: now });
    expect(p.statusType).toBe(StatusType.Ideation);
    expect(p.statusChangedAt).toBe(now);
  });

  it('tiếp nhận: task đã ở cột khác thì giữ nguyên cột', () => {
    const p = wf.accept(state({ statusType: StatusType.Production }), now);
    expect(p.statusType).toBeUndefined();
  });

  it('không tiếp nhận 2 lần', () => {
    const s = state({ acceptance: { status: AcceptanceStatus.Accepted } });
    expectCode(() => wf.accept(s, now), ErrorCode.TaskNotPendingAcceptance);
  });

  it('báo bận bắt buộc lý do', () => {
    expectCode(() => wf.decline(state(), '  ', now), ErrorCode.DeclineReasonRequired);
    const p = wf.decline(state(), '  Đang làm 3 video gấp  ', now);
    expect(p.acceptance).toEqual({ status: AcceptanceStatus.Declined, at: now, reason: 'Đang làm 3 video gấp' });
  });

  it('giao lại việc reset về chờ tiếp nhận', () => {
    expect(wf.assign().acceptance).toEqual({ status: AcceptanceStatus.Pending });
  });

  it('chưa tiếp nhận thì không nộp duyệt được', () => {
    expectCode(() => wf.submit(state({ statusType: StatusType.Production }), now), ErrorCode.TaskNotAccepted);
  });

  it('không nộp duyệt khi task đang chờ khách', () => {
    const s = state({ statusType: StatusType.ClientReview, acceptance: { status: AcceptanceStatus.Accepted } });
    expectCode(() => wf.submit(s, now), ErrorCode.TaskInvalidState);
  });

  it('trả về sửa bắt buộc có góp ý', () => {
    const s = state({ statusType: StatusType.InternalReview, acceptance: { status: AcceptanceStatus.Accepted } });
    expectCode(
      () => wf.review(s, { result: ReviewResult.ChangesRequested, by: 'leader', source: ReviewSource.Internal }, now),
      ErrorCode.ReviewNoteRequired,
    );
  });

  it('duyệt khách chỉ khi task ở cột Khách duyệt', () => {
    const s = state({ statusType: StatusType.InternalReview, acceptance: { status: AcceptanceStatus.Accepted } });
    expectCode(
      () => wf.review(s, { result: ReviewResult.Approved, by: 'leader', source: ReviewSource.Client }, now),
      ErrorCode.TaskInvalidState,
    );
  });

  it('cả vòng đời: tiếp nhận → nộp → trả về → nộp lại → đạt → khách sửa → nộp → đạt → khách duyệt', () => {
    let s = state();
    s = apply(s, wf.accept(s, now));
    expect(s.statusType).toBe(StatusType.Ideation);

    s = apply(s, wf.submit(s, now));
    expect(s.statusType).toBe(StatusType.InternalReview);
    expect(s.approvalStatus).toBe(ApprovalStatus.PendingInternal);

    let p = wf.review(s, { result: ReviewResult.ChangesRequested, note: 'Đổi màu nền', by: 'leader', source: ReviewSource.Internal }, now);
    expect(p.review?.note).toBe('Đổi màu nền');
    s = apply(s, p);
    expect(s.statusType).toBe(StatusType.Revision);
    expect(s.revisionCount).toBe(1);

    s = apply(s, wf.submit(s, now));
    s = apply(s, wf.review(s, { result: ReviewResult.Approved, by: 'leader', source: ReviewSource.Internal }, now));
    expect(s.statusType).toBe(StatusType.ClientReview);
    expect(s.approvalStatus).toBe(ApprovalStatus.PendingClient);

    p = wf.review(s, { result: ReviewResult.ChangesRequested, note: 'Khách muốn đổi caption', by: 'leader', source: ReviewSource.Client }, now);
    expect(p.review?.source).toBe(ReviewSource.Client);
    s = apply(s, p);
    expect(s.revisionCount).toBe(2);

    s = apply(s, wf.submit(s, now));
    s = apply(s, wf.review(s, { result: ReviewResult.Approved, by: 'leader', source: ReviewSource.Internal }, now));
    s = apply(s, wf.review(s, { result: ReviewResult.Approved, by: 'leader', source: ReviewSource.Client }, now));
    expect(s.statusType).toBe(StatusType.Scheduled);
    expect(s.approvalStatus).toBe(ApprovalStatus.Approved);
  });

  it('chuyển sang Hoàn thành ghi completedAt, ra khỏi Hoàn thành thì xoá', () => {
    const done = wf.changeStatus(state({ statusType: StatusType.Scheduled }), StatusType.Done, now);
    expect(done.completedAt).toBe(now);
    const back = wf.changeStatus(state({ statusType: StatusType.Done }), StatusType.Revision, now);
    expect(back.completedAt).toBeNull();
  });

  it('kéo vào cùng cột không đổi gì', () => {
    expect(wf.changeStatus(state(), StatusType.Brief, now)).toEqual({});
  });
});
