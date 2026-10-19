// Tạo dữ liệu mẫu: `pnpm seed` (hoặc `pnpm seed:reset` để xoá dữ liệu cũ trước)
// Tài khoản mẫu: mật khẩu chung 123456
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Connection, Model, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AcceptanceStatus, DEFAULT_LISTS, StatusType, WorkspaceRole } from '@qcc/shared';
import { AppModule } from './app.module';
import { positionBetween } from './common/position';
import { Client } from './clients/client.schema';
import { Member } from './members/member.schema';
import { List } from './projects/list.schema';
import { Project } from './projects/project.schema';
import { Task } from './tasks/task.schema';
import { User } from './users/user.schema';
import { Workspace } from './workspaces/workspace.schema';

const PASSWORD = '123456';

const PEOPLE = [
  { key: 'admin', email: 'admin@qcc.local', name: 'Quản trị viên', role: WorkspaceRole.Admin, skills: [] },
  { key: 'leaderA', email: 'leader.a@qcc.local', name: 'Trần Leader A', role: WorkspaceRole.Staff, skills: ['content'] },
  { key: 'leaderB', email: 'leader.b@qcc.local', name: 'Lê Leader B', role: WorkspaceRole.Staff, skills: ['execution'] },
  { key: 'design', email: 'design@qcc.local', name: 'Phạm Designer', role: WorkspaceRole.Staff, skills: ['design'] },
  { key: 'video', email: 'video@qcc.local', name: 'Hoàng Editor', role: WorkspaceRole.Staff, skills: ['video_edit'] },
  { key: 'content', email: 'content@qcc.local', name: 'Vũ Content', role: WorkspaceRole.Staff, skills: ['content'] },
  { key: 'ads', email: 'ads@qcc.local', name: 'Đỗ Thực thi', role: WorkspaceRole.Staff, skills: ['execution'] },
] as const;

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const model = <T>(name: string) => app.get<Model<T>>(getModelToken(name));
  const workspaces = model<Workspace>(Workspace.name);
  const users = model<User>(User.name);
  const members = model<Member>(Member.name);
  const clients = model<Client>(Client.name);
  const projects = model<Project>(Project.name);
  const lists = model<List>(List.name);
  const tasks = model<Task>(Task.name);

  if (process.argv.includes('--reset')) {
    await app.get<Connection>(getConnectionToken()).dropDatabase();
    console.log('Đã xoá dữ liệu cũ');
  } else if (await workspaces.exists({})) {
    console.log('Đã có dữ liệu. Chạy `pnpm seed:reset` nếu muốn tạo lại từ đầu.');
    await app.close();
    return;
  }

  const ws = await workspaces.create({ name: 'QCC Agency' });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const m: Record<string, Types.ObjectId> = {};
  for (const p of PEOPLE) {
    const user = await users.create({ email: p.email, name: p.name, passwordHash });
    const member = await members.create({ workspaceId: ws._id, userId: user._id, role: p.role, skills: [...p.skills] });
    m[p.key] = member._id;
  }

  const [cafe, spa] = await clients.create([
    { workspaceId: ws._id, name: 'Cà phê Mộc', contactInfo: { contactName: 'Chị Hoa', phone: '0900000001' } },
    { workspaceId: ws._id, name: 'Spa Lavender', contactInfo: { contactName: 'Anh Nam', phone: '0900000002' } },
  ]);

  // Tạo dự án + 8 cột mặc định, trả về map statusType → listId
  const makeProject = async (data: Partial<Project>) => {
    const project = await projects.create({ workspaceId: ws._id, ...data });
    let pos: string | null = null;
    const created = await lists.insertMany(
      DEFAULT_LISTS.map((l) => {
        pos = positionBetween(pos, null);
        return { workspaceId: ws._id, projectId: project._id, name: l.name, statusType: l.statusType, position: pos };
      }),
    );
    const byStatus = Object.fromEntries(created.map((l) => [l.statusType, l._id])) as Record<StatusType, Types.ObjectId>;
    return { project, byStatus };
  };

  const social = await makeProject({
    clientId: cafe._id,
    name: 'Social tháng 11 - Cà phê Mộc',
    serviceType: 'social',
    leaderIds: [m.leaderA],
    memberIds: [m.design, m.content, m.video],
  });
  const ads = await makeProject({
    clientId: spa._id,
    name: 'Chạy ads khai trương - Spa Lavender',
    serviceType: 'ads',
    leaderIds: [m.leaderB],
    memberIds: [m.design, m.ads],
  });

  const day = (n: number) => new Date(Date.now() + n * 86400000);
  const lastPos: Record<string, string | null> = {};
  const task = (p: typeof social, statusType: StatusType, data: Partial<Task>) => {
    const listId = p.byStatus[statusType];
    lastPos[listId.toString()] = positionBetween(lastPos[listId.toString()] ?? null, null);
    return {
      workspaceId: ws._id,
      clientId: p.project.clientId,
      projectId: p.project._id,
      listId,
      statusType,
      position: lastPos[listId.toString()],
      statusChangedAt: statusType === StatusType.ClientReview ? day(-4) : new Date(),
      createdBy: p.project.leaderIds[0],
      acceptance: { status: statusType === StatusType.Brief ? AcceptanceStatus.Pending : AcceptanceStatus.Accepted },
      ...data,
    };
  };

  await tasks.insertMany([
    task(social, StatusType.Brief, {
      title: 'Bài post ra mắt menu mùa đông',
      description: 'Giới thiệu 3 món mới, tone ấm áp.',
      ownerId: m.content,
      collaboratorIds: [m.design],
      dueDate: day(3),
      checklist: [
        { text: 'Viết caption', assigneeId: m.content },
        { text: 'Thiết kế 3 ảnh', assigneeId: m.design },
      ] as never,
    }),
    task(social, StatusType.Production, { title: 'Video reels pha chế', ownerId: m.video, dueDate: day(1) }),
    task(social, StatusType.InternalReview, { title: 'Banner fanpage tháng 11', ownerId: m.design, dueDate: day(2) }),
    task(social, StatusType.ClientReview, { title: 'Album ảnh không gian quán', ownerId: m.design, dueDate: day(-1) }),
    task(social, StatusType.Revision, { title: 'Bài post Black Friday', ownerId: m.content, revisionCount: 1, dueDate: day(2) }),
    task(ads, StatusType.Brief, { title: 'Bộ ảnh quảng cáo khai trương', ownerId: m.design, dueDate: day(4) }),
    task(ads, StatusType.Production, { title: 'Setup chiến dịch Facebook Ads', ownerId: m.ads, dueDate: day(2) }),
    task(ads, StatusType.Done, { title: 'Nghiên cứu đối thủ', ownerId: m.ads, completedAt: day(-2) }),
  ]);

  console.log('Đã tạo dữ liệu mẫu. Đăng nhập với mật khẩu', PASSWORD);
  for (const p of PEOPLE) console.log(`  ${p.email.padEnd(22)} ${p.name}`);
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
