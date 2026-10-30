export enum TaskStatusType {
  Brief = 'brief',
  Ideation = 'ideation',
  Production = 'production',
  InternalReview = 'internal_review',
  ClientReview = 'client_review',
  Revision = 'revision',
  Scheduled = 'scheduled',
  Done = 'done',
}

export enum AcceptanceStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Declined = 'declined',
}

export enum TaskReviewResult {
  Approved = 'approved',
  RevisionRequired = 'revision_required',
}

export enum TaskApprovalStatus {
  Pending = 'pending',
  Approved = 'approved',
  RevisionRequired = 'revision_required',
}
