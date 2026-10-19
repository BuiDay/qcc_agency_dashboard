import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Action, ErrorCode } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { notFound } from '../common/app-exception';
import { toObjectId } from '../common/object-id';
import { PolicyService } from '../permissions/policy.service';
import { CreateClientDto, ListClientsQuery, UpdateClientDto } from './client.dto';
import { Client } from './client.schema';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly clients: Model<Client>,
    private readonly policy: PolicyService,
  ) {}

  list(actor: Actor, query: ListClientsQuery) {
    const filter: Record<string, unknown> = { workspaceId: actor.workspaceId };
    if (query.includeArchived !== 'true') filter.archived = false;
    return this.clients.find(filter).sort({ name: 1 }).lean();
  }

  /** Lấy khách hàng trong workspace của actor, không có thì báo CLIENT_NOT_FOUND */
  async get(actor: Actor, id: string) {
    const client = await this.clients
      .findOne({ _id: toObjectId(id, ErrorCode.ClientNotFound), workspaceId: actor.workspaceId })
      .lean();
    if (!client) throw notFound(ErrorCode.ClientNotFound);
    return client;
  }

  create(actor: Actor, dto: CreateClientDto) {
    this.policy.assert(actor, Action.ClientManage);
    return this.clients.create({ ...dto, workspaceId: new Types.ObjectId(actor.workspaceId) });
  }

  async update(actor: Actor, id: string, dto: UpdateClientDto) {
    this.policy.assert(actor, Action.ClientManage);
    return this.updateFields(actor, id, { ...dto });
  }

  async setArchived(actor: Actor, id: string, archived: boolean) {
    this.policy.assert(actor, Action.ClientManage);
    return this.updateFields(actor, id, { archived });
  }

  private async updateFields(actor: Actor, id: string, set: Record<string, unknown>) {
    const client = await this.clients
      .findOneAndUpdate(
        { _id: toObjectId(id, ErrorCode.ClientNotFound), workspaceId: actor.workspaceId },
        { $set: set },
        { new: true },
      )
      .lean();
    if (!client) throw notFound(ErrorCode.ClientNotFound);
    return client;
  }
}
