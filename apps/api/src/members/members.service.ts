import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@qcc/shared';
import { Model, Types } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { Member } from './schemas/member.schema';
import { User } from '../users/schemas/user.schema';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name) private readonly members: Model<Member>,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  async list(actor: Actor) {
    return this.members
      .find({ workspaceId: actor.workspaceId })
      .populate('userId', 'email name avatar')
      .select('-clientIds')
      .sort({ createdAt: 1 })
      .lean();
  }

  async create(actor: Actor, dto: CreateMemberDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ email })) {
      throw new ConflictException(ErrorCode.Conflict);
    }
    const user = await this.users.create({
      email,
      name: dto.name,
      passwordHash: await bcrypt.hash(dto.password, 12),
    });
    try {
      const member = await this.members.create({
        workspaceId: actor.workspaceId,
        userId: user._id,
        role: dto.role,
      });
      return this.members
        .findById(member._id)
        .populate('userId', 'email name avatar')
        .select('-clientIds')
        .lean();
    } catch (error) {
      await this.users.deleteOne({ _id: user._id });
      throw error;
    }
  }

  async update(actor: Actor, memberId: string, dto: UpdateMemberDto) {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new NotFoundException(ErrorCode.NotFound);
    }
    const member = await this.members
      .findOneAndUpdate(
        { _id: memberId, workspaceId: actor.workspaceId },
        { $set: dto },
        { new: true, runValidators: true },
      )
      .populate('userId', 'email name avatar')
      .select('-clientIds')
      .lean();
    if (!member) throw new NotFoundException(ErrorCode.NotFound);
    return member;
  }
}
