import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, CurrentActor } from '../common/actor';
import { UpdateModulesDto, UpdateWorkspaceDto } from './workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspace')
@Controller('workspace')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  /** Thông tin agency hiện tại */
  @Get()
  get(@CurrentActor() actor: Actor) {
    return this.service.get(actor);
  }

  /** Sửa tên, logo, cài đặt (admin) */
  @Patch()
  update(@CurrentActor() actor: Actor, @Body() dto: UpdateWorkspaceDto) {
    return this.service.update(actor, dto);
  }

  /** Bật/tắt module mở rộng (admin) */
  @Patch('modules')
  updateModules(@CurrentActor() actor: Actor, @Body() dto: UpdateModulesDto) {
    return this.service.updateModules(actor, dto);
  }
}
