// Enum dùng chung cho api và web. Chỉ khai báo ở đây, không khai báo lại nơi khác.

/** Vai trò cấp workspace */
export enum WorkspaceRole {
  Admin = 'admin',
  Staff = 'staff',
  Client = 'client', // giai đoạn sau: cổng khách hàng
}

/** Vai trò cấp dự án (suy ra từ project.leaderIds / memberIds) */
export enum ProjectRole {
  Leader = 'leader',
  Member = 'member',
}

export enum MemberStatus {
  Active = 'active',
  Disabled = 'disabled',
}

/** Trạng thái cố định của cột. Tên cột đổi được, logic luôn dựa vào statusType */
export enum StatusType {
  Brief = 'brief',
  Ideation = 'ideation',
  Production = 'production',
  InternalReview = 'internal_review',
  ClientReview = 'client_review',
  Revision = 'revision',
  Scheduled = 'scheduled',
  Done = 'done',
}

/** Thứ tự + tên mặc định của cột khi tạo dự án */
export const DEFAULT_LISTS: { statusType: StatusType; name: string }[] = [
  { statusType: StatusType.Brief, name: 'Brief' },
  { statusType: StatusType.Ideation, name: 'Lên ý tưởng' },
  { statusType: StatusType.Production, name: 'Sản xuất' },
  { statusType: StatusType.InternalReview, name: 'Duyệt nội bộ' },
  { statusType: StatusType.ClientReview, name: 'Khách duyệt' },
  { statusType: StatusType.Revision, name: 'Chỉnh sửa' },
  { statusType: StatusType.Scheduled, name: 'Lên lịch đăng' },
  { statusType: StatusType.Done, name: 'Hoàn thành' },
];

/** Cột nhân viên không được thả task vào (chỉ Admin/Leader) */
export const STAFF_LOCKED_STATUSES: StatusType[] = [
  StatusType.ClientReview,
  StatusType.Scheduled,
  StatusType.Done,
];

/** Trạng thái nhân viên có thể bấm "Nộp duyệt" */
export const SUBMITTABLE_STATUSES: StatusType[] = [
  StatusType.Brief,
  StatusType.Ideation,
  StatusType.Production,
  StatusType.Revision,
];

export enum AcceptanceStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
}

export enum ApprovalStatus {
  None = 'none',
  PendingInternal = 'pending_internal',
  PendingClient = 'pending_client',
  ChangesRequested = 'changes_requested',
  Approved = 'approved',
}

export enum ReviewResult {
  Approved = 'approved',
  ChangesRequested = 'changes_requested',
}

export enum ReviewSource {
  Internal = 'internal',
  Client = 'client',
}

export enum CommentVisibility {
  Internal = 'internal',
  Client = 'client',
}

/** Loại sự kiện ghi vào activity log */
export enum ActivityType {
  ProjectCreated = 'project.created',
  ProjectUpdated = 'project.updated',
  ProjectLeadersChanged = 'project.leaders_changed',
  ProjectMembersChanged = 'project.members_changed',
  ProjectArchived = 'project.archived',
  TaskCreated = 'task.created',
  TaskUpdated = 'task.updated',
  TaskAssigned = 'task.assigned',
  TaskAccepted = 'task.accepted',
  TaskDeclined = 'task.declined',
  TaskSubmitted = 'task.submitted',
  TaskReviewed = 'task.reviewed',
  TaskClientReviewed = 'task.client_reviewed',
  TaskMoved = 'task.moved',
  TaskChecklistUpdated = 'task.checklist_updated',
  TaskArchived = 'task.archived',
}
