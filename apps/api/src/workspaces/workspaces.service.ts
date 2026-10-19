import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Action } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { notFound } from '../common/app-exception';
import { PolicyService } from '../permissions/policy.service';
import { UpdateModulesDto, UpdateWorkspaceDto } from './workspace.dto';
import { Workspace } from './workspace.schema';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
    private readonly policy: PolicyService,
  ) {}

  async get(actor: Actor) {
    const ws = await this.workspaces.findById(actor.workspaceId).lean();
    if (!ws) throw notFound();
    return ws;
  }

  async update(actor: Actor, dto: UpdateWorkspaceDto) {
    this.policy.assert(actor, Action.WorkspaceUpdate);
    const set: Record<string, unknown> = {};
    if (dto.name !== undefined) set.name = dto.name;
    if (dto.logo !== undefined) set.logo = dto.logo;
    for (const [k, v] of Object.entries(dto.settings ?? {})) set[`settings.${k}`] = v;
    return this.workspaces.findByIdAndUpdate(actor.workspaceId, { $set: set }, { new: true }).lean();
  }

  async updateModules(actor: Actor, dto: UpdateModulesDto) {
    this.policy.assert(actor, Action.WorkspaceUpdate);
    const set: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(dto)) if (v !== undefined) set[`modules.${k}`] = v;
    return this.workspaces.findByIdAndUpdate(actor.workspaceId, { $set: set }, { new: true }).lean();
  }
}
