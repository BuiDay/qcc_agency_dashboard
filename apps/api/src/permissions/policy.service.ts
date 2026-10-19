import { HttpStatus, Injectable } from '@nestjs/common';
import { Action } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { AppException } from '../common/app-exception';
import { can, check, PolicyContext } from './policy';

// Bọc policy.ts để dùng trong service: assert() ném lỗi 403 kèm mã lỗi
@Injectable()
export class PolicyService {
  can(actor: Actor, action: Action, ctx?: PolicyContext): boolean {
    return can(actor, action, ctx);
  }

  assert(actor: Actor, action: Action, ctx?: PolicyContext): void {
    const code = check(actor, action, ctx);
    if (code) throw new AppException(code, HttpStatus.FORBIDDEN);
  }
}
