export enum ErrorCode {
  Unauthorized = 'UNAUTHORIZED',
  Forbidden = 'FORBIDDEN',
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  ValidationFailed = 'VALIDATION_FAILED',
  TaskColumnLocked = 'TASK_COLUMN_LOCKED',
  InvalidTaskTransition = 'INVALID_TASK_TRANSITION',
}
