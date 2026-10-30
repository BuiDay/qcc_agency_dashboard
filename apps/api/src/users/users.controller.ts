import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Action } from '@qcc/shared';
import { CurrentActor } from '../common/decorators/current-actor.decorator';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Actor } from '../common/interfaces/actor.interface';
import { PermissionGuard } from '../common/guards/permission.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(PermissionGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiCookieAuth('qcc_access')
  @ApiBearerAuth()
  @RequirePermission(Action.UserRead)
  getCurrent(@CurrentActor() actor: Actor) {
    return this.users.getCurrent(actor);
  }

  @Post()
  @ApiCookieAuth('qcc_access')
  @ApiBearerAuth()
  @RequirePermission(Action.UserCreate)
  create(@CurrentActor() actor: Actor, @Body() dto: CreateUserDto) {
    return this.users.createInWorkspace(actor, dto);
  }
}
