import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsMongoId()
  projectId!: string;

  @IsOptional()
  @IsMongoId()
  clientId?: string;

  @IsMongoId()
  ownerId!: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  collaboratorIds?: string[];

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;
}
