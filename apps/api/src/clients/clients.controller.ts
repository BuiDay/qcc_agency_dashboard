import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, CurrentActor } from '../common/actor';
import { CreateClientDto, ListClientsQuery, UpdateClientDto } from './client.dto';
import { ClientsService } from './clients.service';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  list(@CurrentActor() actor: Actor, @Query() query: ListClientsQuery) {
    return this.service.list(actor, query);
  }

  @Get(':id')
  get(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.get(actor, id);
  }

  /** Tạo khách hàng (admin) */
  @Post()
  create(@CurrentActor() actor: Actor, @Body() dto: CreateClientDto) {
    return this.service.create(actor, dto);
  }

  @Patch(':id')
  update(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(actor, id, dto);
  }

  @Post(':id/archive')
  archive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setArchived(actor, id, true);
  }

  @Post(':id/unarchive')
  unarchive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setArchived(actor, id, false);
  }
}
