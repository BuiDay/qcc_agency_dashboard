// Danh sách hành động dùng cho phân quyền: can(actor, action, ctx)

export enum Action {
  WorkspaceUpdate = 'workspace.update',
  MemberManage = 'member.manage',
  ClientManage = 'client.manage',

  ProjectView = 'project.view',
  ProjectCreate = 'project.create',
  ProjectUpdate = 'project.update',
  ProjectAssignLeader = 'project.assign_leader',
  ProjectManageMembers = 'project.manage_members',
  ProjectArchive = 'project.archive',

  TaskView = 'task.view',
  TaskCreate = 'task.create',
  TaskUpdate = 'task.update', // sửa tiêu đề, brief, deadline, nhãn
  TaskAssign = 'task.assign',
  TaskAccept = 'task.accept',
  TaskDecline = 'task.decline',
  TaskChecklist = 'task.checklist',
  TaskSubmit = 'task.submit',
  TaskReview = 'task.review', // duyệt nội bộ
  TaskClientReview = 'task.client_review', // ghi nhận kết quả khách duyệt
  TaskMove = 'task.move',
  TaskArchive = 'task.archive',
  TaskDelete = 'task.delete', // xoá vĩnh viễn, chỉ admin
}
