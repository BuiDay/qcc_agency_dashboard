import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { Action, ErrorCode, MemberStatus, WorkspaceRole } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { AppException, notFound } from '../common/app-exception';
import { toObjectId } from '../common/object-id';
import { PolicyService } from '../permissions/policy.service';
import { User } from '../users/user.schema';
import { CreateMemberDto, ListMembersQuery, UpdateMemberDto } from './member.dto';
import { Member } from './member.schema';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name) private readonly members: Model<Member>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly policy: PolicyService,
  ) {}

  /** Danh sách nhân sự kèm tên/email (mọi nhân sự nội bộ xem được để giao việc) */
  async list(actor: Actor, query: ListMembersQuery) {
    const filter: Record<string, unknown> = { workspaceId: actor.workspaceId };
    if (query.skill) filter.skills = query.skill;
    if (query.role) filter.role = query.role;
    else filter.role = { $ne: WorkspaceRole.Client };
    return this.members.find(filter).populate('userId', 'email name avatar').sort({ createdAt: 1 }).lean();
  }

  async create(actor: Actor, dto: CreateMemberDto) {
    this.policy.assert(actor, Action.MemberManage);
    const email = dto.email.toLowerCase().trim();
    let user = await this.users.findOne({ email });
    if (user) {
      const exists = await this.members.exists({ workspaceId: actor.workspaceId, userId: user._id });
      if (exists) throw new AppException(ErrorCode.EmailTaken, HttpStatus.CONFLICT);
    } else {
      user = await this.users.create({ email, name: dto.name, passwordHash: await bcrypt.hash(dto.password, 10) });
    }
    const member = await this.members.create({
      workspaceId: new Types.ObjectId(actor.workspaceId),
      userId: user._id,
      role: dto.role,
      skills: dto.skills ?? [],
    });
    return this.members.findById(member._id).populate('userId', 'email name avatar').lean();
  }

  async update(actor: Actor, id: string, dto: UpdateMemberDto) {
    this.policy.assert(actor, Action.MemberManage);
    const member = await this.members
      .findOneAndUpdate({ _id: toObjectId(id), workspaceId: actor.workspaceId }, { $set: dto }, { new: true })
      .populate('userId', 'email name avatar')
      .lean();
    if (!member) throw notFound();
    return member;
  }

  /** Khoá tài khoản (nghỉ việc): không đăng nhập được, dữ liệu cũ giữ nguyên */
  async setStatus(actor: Actor, id: string, status: MemberStatus) {
    this.policy.assert(actor, Action.MemberManage);
    if (id === actor.memberId) throw new AppException(ErrorCode.Forbidden, HttpStatus.FORBIDDEN, 'Không tự khoá chính mình');
    const member = await this.members
      .findOneAndUpdate({ _id: toObjectId(id), workspaceId: actor.workspaceId }, { $set: { status } }, { new: true })
      .lean();
    if (!member) throw notFound();
    return member;
  }

  /** Kiểm tra các memberId thuộc workspace và đang hoạt động (dùng khi gán leader/thành viên) */
  async assertActiveStaff(actor: Actor, ids: string[]): Promise<Types.ObjectId[]> {
    const unique = [...new Set(ids)];
    const objectIds = unique.map((id) => toObjectId(id));
    const count = await this.members.countDocuments({
      _id: { $in: objectIds },
      workspaceId: actor.workspaceId,
      status: MemberStatus.Active,
      role: { $ne: WorkspaceRole.Client },
    });
    if (count !== unique.length) throw new AppException(ErrorCode.ValidationFailed, HttpStatus.BAD_REQUEST, 'Có nhân sự không hợp lệ');
    return objectIds;
  }
}
