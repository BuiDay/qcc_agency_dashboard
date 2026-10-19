import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Action } from '@qcc/shared';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { Actor } from '../common/interfaces/actor.interface';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';

@ApiTags('members')
@ApiCookieAuth('qcc_access')
@Controller('members')
@UseGuards(PermissionGuard)
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  @RequirePermission(Action.MembersRead)
  list(@CurrentActor() actor: Actor) {
    return this.members.list(actor);
  }

  @Post()
  @RequirePermission(Action.MembersCreate)
  create(@CurrentActor() actor: Actor, @Body() dto: CreateMemberDto) {
    return this.members.create(actor, dto);
  }

  @Patch(':id')
  @RequirePermission(Action.MembersUpdate)
  update(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.members.update(actor, id, dto);
  }
}
