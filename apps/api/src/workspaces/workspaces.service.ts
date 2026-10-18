import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@qcc/shared';
import { Model } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { Workspace } from './schemas/workspace.schema';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
  ) {}

  async getCurrent(actor: Actor) {
    const workspace = await this.workspaces
      .findById(actor.workspaceId)
      .select('_id name modules createdAt updatedAt')
      .lean();
    if (!workspace) throw new NotFoundException(ErrorCode.NotFound);
    return workspace;
  }
}
