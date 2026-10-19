import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Action, ErrorCode } from '@qcc/shared';
import { Actor } from '../interfaces/actor.interface';
import { PolicyService } from '../policy/policy.service';
import { REQUIRED_ACTION } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policy: PolicyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const action = this.reflector.getAllAndOverride<Action>(REQUIRED_ACTION, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) return true;
    const actor = context.switchToHttp().getRequest<{ user?: Actor }>().user;
    if (!actor) throw new UnauthorizedException(ErrorCode.Unauthorized);
    return this.policy.can(actor, action, {
      workspaceId: actor.workspaceId,
      ...(action === Action.UserRead ? { userId: actor.userId } : {}),
    });
  }
}
