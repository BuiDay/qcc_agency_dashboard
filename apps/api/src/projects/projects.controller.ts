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
import { AddProjectMembersDto } from './dto/add-project-members.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiCookieAuth('qcc_access')
@Controller('projects')
@UseGuards(PermissionGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Post()
  @RequirePermission(Action.ProjectsCreate)
  create(@CurrentActor() actor: Actor, @Body() dto: CreateProjectDto) {
    return this.projects.create(actor, dto);
  }

  @Get()
  @RequirePermission(Action.ProjectsRead)
  list(@CurrentActor() actor: Actor) {
    return this.projects.list(actor);
  }

  @Get(':id')
  @RequirePermission(Action.ProjectsRead)
  get(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.projects.get(actor, id);
  }

  @Patch(':id')
  @RequirePermission(Action.ProjectsUpdate)
  update(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(actor, id, dto);
  }

  @Post(':id/members')
  @RequirePermission(Action.ProjectsManageMembers)
  addMembers(
    @CurrentActor() actor: Actor,
    @Param('id') id: string,
    @Body() dto: AddProjectMembersDto,
  ) {
    return this.projects.addMembers(actor, id, dto);
  }

  @Post(':id/archive')
  @RequirePermission(Action.ProjectsArchive)
  archive(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.projects.archive(actor, id);
  }

  @Post(':id/restore')
  @RequirePermission(Action.ProjectsRestore)
  restore(@CurrentActor() actor: Actor, @Param('id') id: string) {
    return this.projects.restore(actor, id);
  }
}
