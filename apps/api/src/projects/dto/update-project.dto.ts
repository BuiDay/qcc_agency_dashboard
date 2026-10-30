import { PartialType, PickType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(
  PickType(CreateProjectDto, ['name', 'serviceType', 'leaderIds'] as const),
) {}
