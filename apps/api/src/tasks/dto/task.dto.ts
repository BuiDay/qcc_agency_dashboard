import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ReviewResult, StatusType } from '@qcc/shared';

export class NewChecklistItemDto {
  @IsString() @MaxLength(300)
  text: string;

  @IsOptional() @IsMongoId()
  assigneeId?: string;

  @IsOptional() @IsDateString()
  dueDate?: string;
}

export class CreateTaskDto {
  @IsString() @MaxLength(200)
  title: string;

  @IsOptional() @IsString() @MaxLength(20000)
  description?: string;

  /** Cột ban đầu; bỏ trống = cột Brief */
  @IsOptional() @IsMongoId()
  listId?: string;

  /** Người chịu trách nhiệm chính (memberId) */
  @IsOptional() @IsMongoId()
  ownerId?: string;

  @IsOptional() @IsArray() @IsMongoId({ each: true }) @ArrayMaxSize(20)
  collaboratorIds?: string[];

  @IsOptional() @IsArray() @IsMongoId({ each: true })
  labelIds?: string[];

  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => NewChecklistItemDto) @ArrayMaxSize(100)
  checklist?: NewChecklistItemDto[];

  @IsOptional() @IsBoolean()
  clientVisible?: boolean;
}

/** Sửa nội dung task (leader). Giao việc dùng /assign, đổi cột dùng /move. */
export class UpdateTaskDto {
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @IsOptional() @IsString() @MaxLength(20000)
  description?: string;

  @IsOptional() @IsArray() @IsMongoId({ each: true })
  labelIds?: string[];

  /** null để xoá ngày */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString()
  startDate?: string | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString()
  dueDate?: string | null;

  @IsOptional() @IsBoolean()
  clientVisible?: boolean;
}

export class AssignTaskDto {
  /** null = bỏ người phụ trách */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsMongoId()
  ownerId?: string | null;

  @IsOptional() @IsArray() @IsMongoId({ each: true }) @ArrayMaxSize(20)
  collaboratorIds?: string[];
}

export class DeclineTaskDto {
  /** Lý do báo bận, tối thiểu 5 ký tự */
  @IsOptional() @IsString() @MaxLength(1000)
  reason?: string;
}

export class ReviewTaskDto {
  @IsEnum(ReviewResult)
  result: ReviewResult;

  /** Bắt buộc khi yêu cầu sửa */
  @IsOptional() @IsString() @MaxLength(5000)
  note?: string;
}

/**
 * Kéo thả. Chỉ cần gửi cột đích và thẻ nằm ngay phía trên (prevTaskId)
 * hoặc ngay phía dưới (nextTaskId). Không gửi cả hai = thả xuống cuối cột.
 */
export class MoveTaskDto {
  @IsMongoId()
  listId: string;

  @IsOptional() @IsMongoId()
  prevTaskId?: string;

  @IsOptional() @IsMongoId()
  nextTaskId?: string;
}

export class UpdateChecklistItemDto {
  @IsOptional() @IsString() @MaxLength(300)
  text?: string;

  @IsOptional() @IsBoolean()
  done?: boolean;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsMongoId()
  assigneeId?: string | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsDateString()
  dueDate?: string | null;
}

export class ListTasksQuery {
  @IsOptional() @IsMongoId()
  ownerId?: string;

  @IsOptional() @IsMongoId()
  listId?: string;

  @IsOptional() @IsEnum(StatusType)
  statusType?: StatusType;

  /** Hạn chót trước ngày này (lọc task sắp đến hạn) */
  @IsOptional() @IsDateString()
  dueBefore?: string;

  @IsOptional() @IsBooleanString()
  includeArchived?: string;
}
