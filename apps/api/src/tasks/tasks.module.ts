import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../database/database.module';
import { ProjectsModule } from '../projects/projects.module';
import { Activity, ActivitySchema } from './schemas/activity.schema';
import { Task, TaskSchema } from './schemas/task.schema';
import { TaskWorkflowService } from './task-workflow.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [
    DatabaseModule,
    ProjectsModule,
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Activity.name, schema: ActivitySchema },
    ]),
  ],
  controllers: [TasksController],
  providers: [TasksService, TaskWorkflowService],
})
export class TasksModule {}
