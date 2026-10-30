import * as bcrypt from 'bcryptjs';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@qcc/shared';
import { Model } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { Member } from '../members/schemas/member.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Member.name) private readonly members: Model<Member>,
  ) {}

  async getCurrent(actor: Actor): Promise<Partial<UserDocument>> {
    const user = await this.users
      .findById(actor.userId)
      .select('_id email name avatar createdAt')
      .lean();
    if (!user) throw new NotFoundException(ErrorCode.NotFound);
    return user;
  }

  async createInWorkspace(actor: Actor, dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.exists({ email })) {
      throw new ConflictException(ErrorCode.Conflict);
    }

    let user: UserDocument;
    try {
      user = await this.users.create({
        email,
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 12),
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(ErrorCode.Conflict);
      }
      throw error;
    }

    try {
      const member = await this.members.create({
        workspaceId: actor.workspaceId,
        userId: user._id,
        role: dto.role,
      });

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          avatar: user.avatar,
        },
        member,
      };
    } catch (error) {
      await this.users.deleteOne({ _id: user._id });
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(ErrorCode.Conflict);
      }
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
