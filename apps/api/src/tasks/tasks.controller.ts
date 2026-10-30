import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Action } from '@qcc/shared';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { Actor } from '../common/interfaces/actor.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import {
  DeclineTaskDto,
  ReviewTaskDto,
  SubmitTaskDto,
} from './dto/task-action.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiCookieAuth('qcc_access')
@Controller('tasks')
@UseGuards(PermissionGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @RequirePermission(Action.TasksCreate)
  create(@CurrentActor() actor: Actor, @Body() dto: CreateTaskDto) {
    return this.tasks.create(actor, dto);
  }

  @Get()
  @RequirePermission(Action.TasksRead)
  list(@CurrentActor() actor: Actor, @Query() query: ListTasksQueryDto) {
    return this.tasks.list(actor, query);
  }

  @Get(':id')
  @RequirePermission(Action.TasksRead)
  get(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.tasks.get(actor, id);
  }

  @Patch(':id')
  @RequirePermission(Action.TasksUpdate)
  update(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(actor, id, dto);
  }

  @Post(':id/archive')
  @RequirePermission(Action.TasksArchive)
  archive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.tasks.archive(actor, id);
  }

  @Post(':id/accept')
  @RequirePermission(Action.TasksAccept)
  accept(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.tasks.accept(actor, id);
  }

  @Post(':id/decline')
  @RequirePermission(Action.TasksDecline)
  decline(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: DeclineTaskDto,
  ) {
    return this.tasks.decline(actor, id, dto.reason);
  }

  @Post(':id/submit')
  @RequirePermission(Action.TasksSubmit)
  submit(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: SubmitTaskDto,
  ) {
    return this.tasks.submit(actor, id, dto.note);
  }

  @Post(':id/review')
  @RequirePermission(Action.TasksReview)
  review(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: ReviewTaskDto,
  ) {
    return this.tasks.review(actor, id, dto);
  }

  @Post(':id/client-review')
  @RequirePermission(Action.TasksClientReview)
  clientReview(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: ReviewTaskDto,
  ) {
    return this.tasks.clientReview(actor, id, dto);
  }

  @Post(':id/move')
  @RequirePermission(Action.TasksMove)
  move(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
  ) {
    return this.tasks.move(actor, id, dto);
  }
}
