import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, CurrentActor } from '../common/actor';
import {
  CreateProjectDto,
  ListProjectsQuery,
  RenameListDto,
  SetLeadersDto,
  SetMembersDto,
  UpdateProjectDto,
} from './project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  /** Danh sách dự án. ?clientId= lọc theo khách, ?mine=true chỉ dự án của tôi */
  @Get()
  list(@CurrentActor() actor: Actor, @Query() query: ListProjectsQuery) {
    return this.service.list(actor, query);
  }

  /** Chi tiết dự án + các cột */
  @Get(':id')
  get(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.getWithLists(actor, id);
  }

  /** Tạo dự án, tự tạo 8 cột mặc định (admin) */
  @Post()
  create(@CurrentActor() actor: Actor, @Body() dto: CreateProjectDto) {
    return this.service.create(actor, dto);
  }

  /** Sửa thông tin dự án (admin, leader) */
  @Patch(':id')
  update(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(actor, id, dto);
  }

  /** Gán leader (admin) */
  @Put(':id/leaders')
  setLeaders(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: SetLeadersDto) {
    return this.service.setLeaders(actor, id, dto);
  }

  /** Cập nhật thành viên (admin, leader) */
  @Put(':id/members')
  setMembers(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: SetMembersDto) {
    return this.service.setMembers(actor, id, dto);
  }

  /** Đổi tên cột (admin, leader) */
  @Patch(':id/lists/:listId')
  renameList(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Param('listId') listId: string,
    @Body() dto: RenameListDto,
  ) {
    return this.service.renameList(actor, id, listId, dto);
  }

  /** Lưu trữ dự án (admin) */
  @Post(':id/archive')
  archive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setArchived(actor, id, true);
  }

  @Post(':id/unarchive')
  unarchive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setArchived(actor, id, false);
  }

  /** Lịch sử hoạt động của dự án */
  @Get(':id/activities')
  activities(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.activitiesOf(actor, id);
  }
}
