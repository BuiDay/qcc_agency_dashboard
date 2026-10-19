import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Action } from '@qcc/shared';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionGuard } from '../common/guards/permission.guard';
import { Actor } from '../common/interfaces/actor.interface';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiCookieAuth('qcc_access')
@Controller('workspaces')
@UseGuards(PermissionGuard)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get('current')
  @RequirePermission(Action.WorkspaceRead)
  getCurrent(@CurrentActor() actor: Actor) {
    return this.workspaces.getCurrent(actor);
  }
}
