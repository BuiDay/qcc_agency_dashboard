import { ArrayMaxSize, IsArray, IsEmail, IsEnum, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { WorkspaceRole } from '@qcc/shared';

// MVP: admin tạo tài khoản kèm mật khẩu ban đầu (mời qua email làm sau)
export class CreateMemberDto {
  @IsEmail()
  email: string;

  @IsString() @MinLength(2) @MaxLength(80)
  name: string;

  @IsString() @MinLength(6)
  password: string;

  @IsIn([WorkspaceRole.Admin, WorkspaceRole.Staff])
  role: WorkspaceRole;

  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20)
  skills?: string[];
}

export class UpdateMemberDto {
  @IsOptional() @IsIn([WorkspaceRole.Admin, WorkspaceRole.Staff])
  role?: WorkspaceRole;

  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(20)
  skills?: string[];
}

export class ListMembersQuery {
  @IsOptional() @IsString()
  skill?: string;

  @IsOptional() @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}
