import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemberStatus } from '@qcc/shared';
import { Actor, CurrentActor } from '../common/actor';
import { CreateMemberDto, ListMembersQuery, UpdateMemberDto } from './member.dto';
import { MembersService } from './members.service';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  /** Danh sách nhân sự, lọc theo chuyên môn ?skill=design */
  @Get()
  list(@CurrentActor() actor: Actor, @Query() query: ListMembersQuery) {
    return this.service.list(actor, query);
  }

  /** Tạo tài khoản nhân sự (admin) */
  @Post()
  create(@CurrentActor() actor: Actor, @Body() dto: CreateMemberDto) {
    return this.service.create(actor, dto);
  }

  /** Đổi role, chuyên môn (admin) */
  @Patch(':id')
  update(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.service.update(actor, id, dto);
  }

  /** Khoá tài khoản (admin) */
  @Post(':id/disable')
  disable(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setStatus(actor, id, MemberStatus.Disabled);
  }

  /** Mở khoá tài khoản (admin) */
  @Post(':id/enable')
  enable(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setStatus(actor, id, MemberStatus.Active);
  }
}
