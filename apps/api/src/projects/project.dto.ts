import { IsArray, IsBooleanString, IsDateString, IsMongoId, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @IsMongoId()
  clientId: string;

  @IsString() @MaxLength(150)
  name: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  /** social, ads, video, seo, branding... */
  @IsOptional() @IsString() @MaxLength(40)
  serviceType?: string;

  /** Leader của dự án (memberId) */
  @IsOptional() @IsArray() @IsMongoId({ each: true })
  leaderIds?: string[];

  @IsOptional() @IsArray() @IsMongoId({ each: true })
  memberIds?: string[];

  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateProjectDto {
  @IsOptional() @IsString() @MaxLength(150)
  name?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(40)
  serviceType?: string;

  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

export class SetLeadersDto {
  @IsArray() @IsMongoId({ each: true })
  leaderIds: string[];
}

export class SetMembersDto {
  @IsArray() @IsMongoId({ each: true })
  memberIds: string[];
}

export class RenameListDto {
  @IsString() @MaxLength(60)
  name: string;
}

export class ListProjectsQuery {
  @IsOptional() @IsMongoId()
  clientId?: string;

  /** "true": chỉ dự án tôi là leader hoặc thành viên */
  @IsOptional() @IsBooleanString()
  mine?: string;

  @IsOptional() @IsBooleanString()
  includeArchived?: string;
}
