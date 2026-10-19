import { WorkspaceRole } from '@qcc/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({ enum: WorkspaceRole, enumName: 'WorkspaceRole' })
  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
