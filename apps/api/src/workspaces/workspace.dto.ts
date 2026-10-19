import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class UpdateWorkspaceSettingsDto {
  @IsOptional() @IsInt() @Min(1) @Max(30)
  clientReviewWarnDays?: number;

  @IsOptional() @IsString()
  timezone?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string;

  @IsOptional() @IsString()
  logo?: string;

  @IsOptional() @ValidateNested() @Type(() => UpdateWorkspaceSettingsDto)
  settings?: UpdateWorkspaceSettingsDto;
}

export class UpdateModulesDto {
  @IsOptional() @IsBoolean() clientPortal?: boolean;
  @IsOptional() @IsBoolean() timeTracking?: boolean;
  @IsOptional() @IsBoolean() contracts?: boolean;
  @IsOptional() @IsBoolean() automation?: boolean;
  @IsOptional() @IsBoolean() ai?: boolean;
}
