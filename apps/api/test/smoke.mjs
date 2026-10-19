// Kiểm thử end-to-end qua HTTP thật (54 kịch bản).
// Chạy: pnpm seed:reset, bật API (pnpm dev:api), rồi: pnpm test:smoke
// Lưu ý: kịch bản khoá tài khoản ads@qcc.local ở cuối → chạy lại thì pnpm seed:reset trước.
const BASE = process.env.API_URL ?? 'http://localhost:4000';
let pass = 0, fail = 0;
const ok = (cond, label, extra) => {
  if (cond) { pass++; console.log('  ✓', label); }
  else { fail++; console.log('  ✗', label, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); }
};
async function call(token, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data, headers: res.headers };
}
const login = async (email) => (await call(null, 'POST', '/auth/login', { email, password: '123456' })).data.accessToken;

const admin = await login('admin@qcc.local');
const leader = await login('leader.a@qcc.local');
const content = await login('content@qcc.local');
const design = await login('design@qcc.local');
const outsider = await login('ads@qcc.local');
ok(admin && leader && content && design && outsider, 'đăng nhập 5 tài khoản');

console.log('Auth');
let r = await call(null, 'POST', '/auth/login', { email: 'admin@qcc.local', password: 'sai-mat-khau' });
ok(r.status === 401 && r.data.code === 'INVALID_CREDENTIALS', 'sai mật khẩu → INVALID_CREDENTIALS', r.data);
r = await call(null, 'GET', '/projects');
ok(r.status === 401 && r.data.code === 'UNAUTHORIZED', 'không có token → UNAUTHORIZED');
const loginRes = await fetch(BASE + '/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'leader.a@qcc.local', password: '123456' }) });
const cookies = loginRes.headers.getSetCookie();
ok(cookies.some((c) => c.startsWith('access_token=') && c.includes('HttpOnly')), 'login set cookie httpOnly');
const meByCookie = await fetch(BASE + '/auth/me', { headers: { cookie: cookies.map((c) => c.split(';')[0]).join('; ') } });
ok(meByCookie.status === 200 && (await meByCookie.json()).userId.email === 'leader.a@qcc.local', '/auth/me bằng cookie');
const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));
const refreshed = await fetch(BASE + '/auth/refresh', { method: 'POST', headers: { cookie: refreshCookie.split(';')[0] } });
ok(refreshed.status === 200 && (await refreshed.json()).accessToken, 'refresh token cấp access token mới');

const members = (await call(admin, 'GET', '/members')).data;
const mid = (email) => members.find((m) => m.userId.email === email)._id;
ok(members.length === 7, 'GET /members trả 7 nhân sự');
ok((await call(admin, 'GET', '/members?skill=design')).data.length === 1, 'lọc nhân sự theo chuyên môn');

console.log('Khách hàng & dự án');
r = await call(leader, 'POST', '/clients', { name: 'Khách mới' });
ok(r.status === 403, 'leader không tạo được khách hàng');
const client = (await call(admin, 'POST', '/clients', { name: 'Trà sữa Mây', contactInfo: { phone: '0901' } })).data;
ok(client._id, 'admin tạo khách hàng');

r = await call(leader, 'POST', '/projects', { clientId: client._id, name: 'X' });
ok(r.status === 403 && r.data.code === 'FORBIDDEN', 'leader không tạo được dự án');
r = await call(admin, 'POST', '/projects', {
  clientId: client._id, name: 'Social tháng 12', leaderIds: [mid('leader.a@qcc.local')],
  memberIds: [mid('content@qcc.local'), mid('design@qcc.local')],
});
const project = r.data;
ok(r.status === 201 && project.lists?.length === 8, 'admin tạo dự án → tự có 8 cột', r.data);
const listOf = (s) => project.lists.find((l) => l.statusType === s)._id;
ok(project.lists.map((l) => l.statusType).join() === 'brief,ideation,production,internal_review,client_review,revision,scheduled,done', 'thứ tự cột đúng quy trình');

ok((await call(outsider, 'GET', `/projects/${project._id}`)).status === 200, 'nhân viên ngoài dự án vẫn xem được');
ok((await call(content, 'PATCH', `/projects/${project._id}`, { name: 'đổi' })).status === 403, 'nhân viên không sửa được dự án');
ok((await call(leader, 'PATCH', `/projects/${project._id}/lists/${listOf('brief')}`, { name: 'Yêu cầu' })).data.name === 'Yêu cầu', 'leader đổi tên cột');
ok((await call(leader, 'PUT', `/projects/${project._id}/leaders`, { leaderIds: [] })).status === 403, 'leader không tự gán leader');

console.log('Tạo & giao task');
r = await call(leader, 'POST', `/projects/${project._id}/tasks`, { description: 'thiếu tiêu đề' });
ok(r.status === 400 && r.data.code === 'VALIDATION_FAILED', 'thiếu tiêu đề → VALIDATION_FAILED', r.data);
r = await call(leader, 'POST', `/projects/${project._id}/tasks`, { title: 'X', ownerId: mid('ads@qcc.local') });
ok(r.status === 400 && r.data.code === 'MEMBER_NOT_IN_PROJECT', 'giao cho người ngoài dự án → MEMBER_NOT_IN_PROJECT', r.data);
ok((await call(content, 'POST', `/projects/${project._id}/tasks`, { title: 'X' })).status === 403, 'nhân viên không tạo task');

r = await call(leader, 'POST', `/projects/${project._id}/tasks`, {
  title: 'Post Noel', ownerId: mid('content@qcc.local'), collaboratorIds: [mid('design@qcc.local')],
  dueDate: '2026-12-20', checklist: [{ text: 'Viết caption', assigneeId: mid('content@qcc.local') }, { text: 'Làm ảnh', assigneeId: mid('design@qcc.local') }],
});
let task = r.data;
ok(r.status === 201 && task.statusType === 'brief' && task.acceptance.status === 'pending', 'leader tạo task → Brief, chờ tiếp nhận', r.data);

const my = (await call(content, 'GET', '/tasks/my')).data;
ok(my.some((t) => t._id === task._id), '"Việc của tôi" của người phụ trách có task');
ok((await call(design, 'GET', '/tasks/my')).data.some((t) => t._id === task._id), '"Việc của tôi" của người phối hợp có task');

console.log('Tiếp nhận / báo bận');
r = await call(outsider, 'POST', `/tasks/${task._id}/accept`);
ok(r.status === 403 && r.data.code === 'TASK_NOT_ASSIGNED', 'người khác không tiếp nhận được');
r = await call(content, 'POST', `/tasks/${task._id}/decline`, { reason: 'bận' });
ok(r.status === 400 && r.data.code === 'DECLINE_REASON_REQUIRED', 'báo bận lý do ngắn → DECLINE_REASON_REQUIRED');
r = await call(content, 'POST', `/tasks/${task._id}/submit`);
ok(r.data.code === 'TASK_NOT_ACCEPTED', 'chưa tiếp nhận không nộp duyệt được');
r = await call(content, 'POST', `/tasks/${task._id}/accept`);
task = r.data;
ok(task.acceptance.status === 'accepted' && task.statusType === 'ideation' && task.listId === listOf('ideation'), 'tiếp nhận → tự sang Lên ý tưởng', r.data);

console.log('Checklist');
const itemDesign = task.checklist.find((c) => c.text === 'Làm ảnh');
r = await call(design, 'PATCH', `/tasks/${task._id}/checklist/${itemDesign._id}`, { done: true });
ok(r.status === 200 && r.data.checklist.find((c) => c._id === itemDesign._id).done === true, 'designer tick mục của mình');
r = await call(design, 'PATCH', `/tasks/${task._id}/checklist/${itemDesign._id}`, { text: 'đổi tên' });
ok(r.status === 403, 'designer không sửa nội dung checklist');
r = await call(outsider, 'PATCH', `/tasks/${task._id}/checklist/${itemDesign._id}`, { done: false });
ok(r.status === 403, 'người ngoài không tick được');

console.log('Kéo thả & duyệt');
r = await call(content, 'POST', `/tasks/${task._id}/move`, { listId: listOf('done') });
ok(r.status === 403 && r.data.code === 'TASK_COLUMN_LOCKED', 'nhân viên thả vào Hoàn thành → TASK_COLUMN_LOCKED');
r = await call(outsider, 'POST', `/tasks/${task._id}/move`, { listId: listOf('production') });
ok(r.status === 403 && r.data.code === 'FORBIDDEN', 'nhân viên không kéo task của người khác');
r = await call(content, 'POST', `/tasks/${task._id}/move`, { listId: listOf('production') });
ok(r.data.statusType === 'production', 'nhân viên kéo sang Sản xuất');
r = await call(content, 'POST', `/tasks/${task._id}/submit`);
ok(r.data.statusType === 'internal_review' && r.data.approvalStatus === 'pending_internal', 'nộp duyệt → Duyệt nội bộ');
r = await call(content, 'POST', `/tasks/${task._id}/review`, { result: 'approved' });
ok(r.status === 403, 'nhân viên không tự duyệt');
r = await call(leader, 'POST', `/tasks/${task._id}/review`, { result: 'changes_requested' });
ok(r.data.code === 'REVIEW_NOTE_REQUIRED', 'trả về không góp ý → REVIEW_NOTE_REQUIRED');
r = await call(leader, 'POST', `/tasks/${task._id}/review`, { result: 'changes_requested', note: 'Đổi font tiêu đề' });
ok(r.data.statusType === 'revision' && r.data.revisionCount === 1 && r.data.reviewHistory.length === 1, 'trả về → Chỉnh sửa, số lần sửa = 1');
r = await call(content, 'POST', `/tasks/${task._id}/move`, { listId: listOf('internal_review') });
ok(r.data.statusType === 'internal_review', 'nhân viên kéo vào Duyệt nội bộ = nộp duyệt');
r = await call(leader, 'POST', `/tasks/${task._id}/review`, { result: 'approved' });
ok(r.data.statusType === 'client_review' && r.data.listId === listOf('client_review'), 'duyệt đạt → Khách duyệt');
r = await call(content, 'POST', `/tasks/${task._id}/move`, { listId: listOf('revision') });
ok(r.data.code === 'TASK_COLUMN_LOCKED', 'nhân viên không kéo task đang chờ khách ra ngoài');
r = await call(leader, 'POST', `/tasks/${task._id}/client-review`, { result: 'changes_requested', note: 'Khách muốn thêm logo' });
ok(r.data.statusType === 'revision' && r.data.revisionCount === 2 && r.data.reviewHistory.at(-1).source === 'client' && r.data.reviewHistory.length === 3, 'khách yêu cầu sửa → số lần sửa = 2, nguồn client', r.data);
await call(content, 'POST', `/tasks/${task._id}/submit`);
await call(leader, 'POST', `/tasks/${task._id}/review`, { result: 'approved' });
r = await call(leader, 'POST', `/tasks/${task._id}/client-review`, { result: 'approved' });
ok(r.data.statusType === 'scheduled' && r.data.approvalStatus === 'approved', 'khách duyệt → Lên lịch đăng');
r = await call(leader, 'POST', `/tasks/${task._id}/move`, { listId: listOf('done') });
ok(r.data.statusType === 'done' && r.data.completedAt, 'leader kéo sang Hoàn thành, có completedAt');
ok(!(await call(content, 'GET', '/tasks/my')).data.some((t) => t._id === task._id), 'task hoàn thành biến khỏi "Việc của tôi"');

console.log('Sắp xếp thứ tự (fractional indexing)');
const mk = async (title) => (await call(leader, 'POST', `/projects/${project._id}/tasks`, { title })).data;
const a = await mk('A'), b = await mk('B'), c = await mk('C');
await call(leader, 'POST', `/tasks/${c._id}/move`, { listId: listOf('brief'), nextTaskId: a._id });
let order = (await call(leader, 'GET', `/projects/${project._id}/tasks?listId=${listOf('brief')}`)).data.map((t) => t.title).join('');
ok(order === 'CAB', 'kéo C lên đầu → C A B', order);
await call(leader, 'POST', `/tasks/${c._id}/move`, { listId: listOf('brief'), prevTaskId: a._id });
order = (await call(leader, 'GET', `/projects/${project._id}/tasks?listId=${listOf('brief')}`)).data.map((t) => t.title).join('');
ok(order === 'ACB', 'kéo C vào giữa A và B → A C B', order);
await call(leader, 'POST', `/tasks/${a._id}/move`, { listId: listOf('brief') });
order = (await call(leader, 'GET', `/projects/${project._id}/tasks?listId=${listOf('brief')}`)).data.map((t) => t.title).join('');
ok(order === 'CBA', 'kéo A xuống cuối → C B A', order);

console.log('Lịch sử & lưu trữ');
const acts = (await call(content, 'GET', `/tasks/${task._id}/activities`)).data;
ok(acts.length >= 12 && acts.some((x) => x.type === 'task.client_reviewed'), `activity log ghi đủ (${acts.length} sự kiện)`);
ok((await call(content, 'POST', `/tasks/${b._id}/archive`)).status === 403, 'nhân viên không lưu trữ task');
ok((await call(leader, 'POST', `/tasks/${b._id}/archive`)).data.archived === true, 'leader lưu trữ task');
ok((await call(leader, 'PATCH', `/tasks/${b._id}`, { title: 'x' })).data.code === 'TASK_ARCHIVED', 'task đã lưu trữ không sửa được');

console.log('Khoá tài khoản');
await call(admin, 'POST', `/members/${mid('ads@qcc.local')}/disable`);
r = await call(null, 'POST', '/auth/login', { email: 'ads@qcc.local', password: '123456' });
ok(r.status === 401 && r.data.code === 'MEMBER_DISABLED', 'tài khoản bị khoá không đăng nhập được');
r = await call(outsider, 'GET', '/projects');
ok(r.status === 401, 'token cũ của tài khoản bị khoá hết tác dụng ngay');
ok((await call(admin, 'POST', `/members/${mid('admin@qcc.local')}/disable`)).status === 403, 'admin không tự khoá chính mình');

console.log(`\nKết quả: ${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
