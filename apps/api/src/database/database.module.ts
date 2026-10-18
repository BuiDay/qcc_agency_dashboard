import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Member, MemberSchema } from '../members/schemas/member.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Workspace, WorkspaceSchema } from '../workspaces/schemas/workspace.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Member.name, schema: MemberSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
