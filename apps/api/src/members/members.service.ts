import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@qcc/shared';
import { Model, Types } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { Member } from './schemas/member.schema';
import { UsersService } from '../users/users.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectModel(Member.name) private readonly members: Model<Member>,
    private readonly users: UsersService,
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
    const { member } = await this.users.createInWorkspace(actor, dto);
    return this.members
      .findById(member._id)
      .populate('userId', 'email name avatar')
      .select('-clientIds')
      .lean();
  }

  async update(actor: Actor, memberId: string, dto: UpdateMemberDto) {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new NotFoundException(ErrorCode.NotFound);
    }
    if (
      memberId === actor.memberId &&
      (dto.active === false || (dto.role !== undefined && dto.role !== actor.role))
    ) {
      throw new ForbiddenException(ErrorCode.Forbidden);
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
