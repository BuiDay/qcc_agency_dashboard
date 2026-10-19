import { SetMetadata } from '@nestjs/common';
import { Action } from '@qcc/shared';

export const REQUIRED_ACTION = 'required-action';
export const RequirePermission = (action: Action): MethodDecorator =>
  SetMetadata(REQUIRED_ACTION, action);
