import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { Member } from '../src/members/schemas/member.schema';
import { User } from '../src/users/schemas/user.schema';
import { AuthService } from '../src/auth/auth.service';

describe('AuthService refresh', () => {
  const userId = new Types.ObjectId();
  const memberId = new Types.ObjectId();
  const workspaceId = new Types.ObjectId();
  const refreshSecret = 'test-refresh-secret';

  it('finds membership by id then validates user/workspace claims', async () => {
    const member = {
      userId,
      workspaceId,
      active: true,
    };
    const members = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(member),
      }),
    } as unknown as Model<Member>;
    const users = {
      findOne: jest.fn().mockResolvedValue({ _id: userId }),
    } as unknown as Model<User>;
    const jwt = {
      verifyAsync: jest.fn().mockResolvedValue({
        sub: userId.toString(),
        memberId: memberId.toString(),
        workspaceId: workspaceId.toString(),
      }),
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh'),
    } as unknown as JwtService;
    const config = {
      getOrThrow: jest.fn().mockReturnValue(refreshSecret),
    } as unknown as ConfigService;
    const service = new AuthService(users, members, jwt, config);

    await expect(service.refresh('refresh-token')).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(members.findById).toHaveBeenCalledWith(memberId.toString());
    expect(users.findOne).toHaveBeenCalledWith({
      _id: userId.toString(),
      active: true,
    });
  });
});
