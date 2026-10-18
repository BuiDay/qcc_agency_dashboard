import 'reflect-metadata';
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MemberSchema } from '../members/schemas/member.schema';
import { UserSchema } from '../users/schemas/user.schema';
import { WorkspaceSchema } from '../workspaces/schemas/workspace.schema';

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  const email = process.env.SEED_ADMIN_EMAIL;
  const name = process.env.SEED_ADMIN_NAME ?? 'Quản trị viên';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!uri || !email || !password || password.length < 12) {
    throw new Error(
      'Cần MONGODB_URI, SEED_ADMIN_EMAIL và SEED_ADMIN_PASSWORD (tối thiểu 12 ký tự).',
    );
  }

  await mongoose.connect(uri);
  try {
    const users = mongoose.model('User', UserSchema);
    const workspaces = mongoose.model('Workspace', WorkspaceSchema);
    const members = mongoose.model('Member', MemberSchema);
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new Error(`Email ${email} đã tồn tại; seed không ghi đè dữ liệu.`);
    }

    const workspace = await workspaces.create({
      name: process.env.SEED_WORKSPACE_NAME ?? 'QCC Agency',
    });
    const user = await users.create({
      email: email.toLowerCase(),
      name,
      passwordHash: await bcrypt.hash(password, 12),
    });
    await members.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: 'admin',
    });
    console.info(`Đã tạo workspace "${workspace.name}" và admin ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

void seed().catch((error: unknown) => {
  console.error('Seed thất bại:', error);
  process.exitCode = 1;
});
