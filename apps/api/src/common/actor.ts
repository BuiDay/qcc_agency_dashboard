import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { WorkspaceRole } from '@qcc/shared';

/** Người đang gọi API, gắn vào request bởi JwtAuthGuard */
export interface Actor {
  userId: string;
  memberId: string;
  workspaceId: string;
  role: WorkspaceRole;
}

/** Lấy actor trong controller: method(@CurrentActor() actor: Actor) */
export const CurrentActor = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): Actor => ctx.switchToHttp().getRequest().actor,
);

/** Đánh dấu route không cần đăng nhập */
export const IS_PUBLIC = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC, true);
