// Mã lỗi backend trả về. Frontend tự dịch sang tiếng Việt.

export enum ErrorCode {
  Unauthorized = 'UNAUTHORIZED',
  InvalidCredentials = 'INVALID_CREDENTIALS',
  MemberDisabled = 'MEMBER_DISABLED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  ValidationFailed = 'VALIDATION_FAILED',
  EmailTaken = 'EMAIL_TAKEN',

  ClientNotFound = 'CLIENT_NOT_FOUND',
  ProjectNotFound = 'PROJECT_NOT_FOUND',
  ProjectArchived = 'PROJECT_ARCHIVED',
  ListNotFound = 'LIST_NOT_FOUND',
  MemberNotInProject = 'MEMBER_NOT_IN_PROJECT',

  TaskNotFound = 'TASK_NOT_FOUND',
  TaskArchived = 'TASK_ARCHIVED',
  TaskColumnLocked = 'TASK_COLUMN_LOCKED',
  TaskNotAssigned = 'TASK_NOT_ASSIGNED',
  TaskNotPendingAcceptance = 'TASK_NOT_PENDING_ACCEPTANCE',
  TaskNotAccepted = 'TASK_NOT_ACCEPTED',
  TaskInvalidState = 'TASK_INVALID_STATE',
  DeclineReasonRequired = 'DECLINE_REASON_REQUIRED',
  ReviewNoteRequired = 'REVIEW_NOTE_REQUIRED',
  ChecklistItemNotFound = 'CHECKLIST_ITEM_NOT_FOUND',
}
