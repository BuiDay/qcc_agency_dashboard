import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '../clients/clients.module';
import { MembersModule } from '../members/members.module';
import { List, ListSchema } from './list.schema';
import { Project, ProjectSchema } from './project.schema';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [
    ClientsModule,
    MembersModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: List.name, schema: ListSchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService, MongooseModule],
})
export class ProjectsModule {}
