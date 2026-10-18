import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Actor } from '../interfaces/actor.interface';

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): Actor =>
    context.switchToHttp().getRequest<{ user: Actor }>().user,
);
