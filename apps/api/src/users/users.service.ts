import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@qcc/shared';
import { Model } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly users: Model<User>) {}

  async getCurrent(actor: Actor): Promise<Partial<UserDocument>> {
    const user = await this.users
      .findById(actor.userId)
      .select('_id email name avatar createdAt')
      .lean();
    if (!user) throw new NotFoundException(ErrorCode.NotFound);
    return user;
  }
}
