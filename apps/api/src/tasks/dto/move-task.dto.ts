import { TaskStatusType } from '@qcc/shared';
import { IsEnum, IsMongoId, IsOptional } from 'class-validator';

export class MoveTaskDto {
  @IsEnum(TaskStatusType)
  statusType!: TaskStatusType;

  @IsOptional()
  @IsMongoId()
  afterTaskId?: string;

  @IsOptional()
  @IsMongoId()
  beforeTaskId?: string;
}
