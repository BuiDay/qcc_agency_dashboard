import { TaskReviewResult } from '@qcc/shared';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class DeclineTaskDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;
}

export class SubmitTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class ReviewTaskDto {
  @IsEnum(TaskReviewResult)
  result!: TaskReviewResult;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
