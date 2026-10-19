import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { Member, MemberSchema } from './member.schema';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [UsersModule, MongooseModule.forFeature([{ name: Member.name, schema: MemberSchema }])],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService, MongooseModule],
})
export class MembersModule {}
