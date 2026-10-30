import { ArrayNotEmpty, ArrayUnique, IsArray, IsMongoId } from 'class-validator';

export class AddProjectMembersDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsMongoId({ each: true })
  memberIds!: string[];
}
