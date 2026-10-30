import { Type } from 'class-transformer';
import { TaskStatusType } from '@qcc/shared';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class ListTasksQueryDto {
  @IsMongoId()
  projectId!: string;

  @IsOptional()
  @IsMongoId()
  ownerId?: string;

  @IsOptional()
  @IsEnum(TaskStatusType)
  statusType?: TaskStatusType;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueTo?: Date;
}
