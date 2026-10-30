import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@qcc/shared';
import { Model } from 'mongoose';
import { Actor } from '../src/common/interfaces/actor.interface';
import { Member } from '../src/members/schemas/member.schema';
import { MembersService } from '../src/members/members.service';
import { UsersService } from '../src/users/users.service';

describe('MembersService self-protection', () => {
  const actor: Actor = {
    userId: '507f1f77bcf86cd799439011',
    memberId: '507f191e810c19729de860ea',
    workspaceId: '507f1f77bcf86cd799439012',
    role: WorkspaceRole.Admin,
  };

  it.each([
    ['deactivate', { active: false }],
    ['demote', { role: WorkspaceRole.Staff }],
  ])('prevents an admin from using their own account to %s', async (_case, dto) => {
    const members = {} as Model<Member>;
    const users = {} as UsersService;
    const service = new MembersService(members, users);

    await expect(
      service.update(actor, actor.memberId, dto),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
