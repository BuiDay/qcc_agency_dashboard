import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Action } from '@qcc/shared';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Actor } from '../common/interfaces/actor.interface';
import { PermissionGuard } from '../common/guards/permission.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth('qcc_access')
@Controller('users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @RequirePermission(Action.UserRead)
  getCurrent(@CurrentActor() actor: Actor) {
    return this.users.getCurrent(actor);
  }
}
