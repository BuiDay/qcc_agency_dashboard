import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, CurrentActor } from '../common/actor';
import {
  AssignTaskDto,
  CreateTaskDto,
  DeclineTaskDto,
  ListTasksQuery,
  MoveTaskDto,
  NewChecklistItemDto,
  ReviewTaskDto,
  UpdateChecklistItemDto,
  UpdateTaskDto,
} from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@Controller()
export class TasksController {
  constructor(private readonly service: TasksService) {}

  // ----- Task trong dự án -----

  /** Danh sách task của dự án (để vẽ bảng Kanban) */
  @Get('projects/:projectId/tasks')
  list(@CurrentActor() actor: Actor, @Param('projectId') projectId: string, @Query() q: ListTasksQuery) {
    return this.service.listByProject(actor, projectId, q);
  }

  /** Tạo task (admin, leader). Mặc định nằm ở cột Brief. */
  @Post('projects/:projectId/tasks')
  create(@CurrentActor() actor: Actor, @Param('projectId') projectId: string, @Body() dto: CreateTaskDto) {
    return this.service.create(actor, projectId, dto);
  }

  // ----- Task -----

  /** Việc của tôi: task tôi phụ trách / phối hợp / có mục checklist, chưa hoàn thành */
  @Get('tasks/my')
  my(@CurrentActor() actor: Actor) {
    return this.service.myTasks(actor);
  }

  @Get('tasks/:id')
  get(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.get(actor, id);
  }

  /** Sửa tiêu đề, brief, ngày, nhãn (admin, leader) */
  @Patch('tasks/:id')
  update(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(actor, id, dto);
  }

  /** Giao / đổi người phụ trách, người phối hợp (admin, leader) */
  @Post('tasks/:id/assign')
  @HttpCode(200)
  assign(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: AssignTaskDto) {
    return this.service.assign(actor, id, dto);
  }

  /** Nhân viên tiếp nhận task */
  @Post('tasks/:id/accept')
  @HttpCode(200)
  accept(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.accept(actor, id);
  }

  /** Nhân viên báo bận (bắt buộc lý do) */
  @Post('tasks/:id/decline')
  @HttpCode(200)
  decline(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: DeclineTaskDto) {
    return this.service.decline(actor, id, dto);
  }

  /** Nộp duyệt → cột Duyệt nội bộ */
  @Post('tasks/:id/submit')
  @HttpCode(200)
  submit(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.submit(actor, id);
  }

  /** Leader duyệt nội bộ: approved → Khách duyệt; changes_requested → Chỉnh sửa */
  @Post('tasks/:id/review')
  @HttpCode(200)
  review(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: ReviewTaskDto) {
    return this.service.review(actor, id, dto);
  }

  /** Ghi nhận khách duyệt: approved → Lên lịch đăng; changes_requested → Chỉnh sửa */
  @Post('tasks/:id/client-review')
  @HttpCode(200)
  clientReview(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: ReviewTaskDto) {
    return this.service.clientReview(actor, id, dto);
  }

  /** Kéo thả sang cột khác / đổi thứ tự */
  @Post('tasks/:id/move')
  @HttpCode(200)
  move(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: MoveTaskDto) {
    return this.service.move(actor, id, dto);
  }

  @Post('tasks/:id/archive')
  @HttpCode(200)
  archive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setArchived(actor, id, true);
  }

  @Post('tasks/:id/unarchive')
  @HttpCode(200)
  unarchive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.setArchived(actor, id, false);
  }

  /** Lịch sử hoạt động của task */
  @Get('tasks/:id/activities')
  activities(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.service.activitiesOf(actor, id);
  }

  // ----- Checklist -----

  @Post('tasks/:id/checklist')
  addChecklist(@CurrentActor() actor: Actor, @Param('id') id: string, @Body() dto: NewChecklistItemDto) {
    return this.service.addChecklistItem(actor, id, dto);
  }

  @Patch('tasks/:id/checklist/:itemId')
  updateChecklist(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ) {
    return this.service.updateChecklistItem(actor, id, itemId, dto);
  }

  @Delete('tasks/:id/checklist/:itemId')
  removeChecklist(@CurrentActor() actor: Actor, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeChecklistItem(actor, id, itemId);
  }
}
