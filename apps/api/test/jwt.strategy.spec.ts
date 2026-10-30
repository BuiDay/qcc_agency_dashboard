import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { Member } from '../src/members/schemas/member.schema';
import {
  extractAccessToken,
  JwtStrategy,
} from '../src/auth/strategies/jwt.strategy';

describe('extractAccessToken', () => {
  it('ưu tiên Bearer token mới hơn cookie có thể đã cũ', () => {
    expect(
      extractAccessToken({
        cookies: { qcc_access: 'stale-cookie-token' },
        headers: { authorization: 'Bearer fresh-header-token' },
      }),
    ).toBe('fresh-header-token');
  });

  it('dùng cookie qcc_access khi không có Bearer token', () => {
    expect(
      extractAccessToken({
        cookies: { qcc_access: 'cookie-token' },
      }),
    ).toBe('cookie-token');
  });

  it('đọc Bearer token không phân biệt hoa thường', () => {
    expect(
      extractAccessToken({
        headers: { authorization: 'bearer header-token' },
      }),
    ).toBe('header-token');
  });

  it('bỏ qua Authorization sai định dạng', () => {
    expect(
      extractAccessToken({
        headers: { authorization: 'Basic credentials' },
      }),
    ).toBeNull();
  });
});

describe('JwtStrategy validate', () => {
  const userId = new Types.ObjectId();
  const memberId = new Types.ObjectId();
  const workspaceId = new Types.ObjectId();
  const activeMember = {
    userId,
    workspaceId,
    role: 'admin',
    active: true,
  };

  function createStrategy(member: typeof activeMember | null) {
    const members = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(member),
      }),
    } as unknown as Model<Member>;
    const config = {
      getOrThrow: jest.fn().mockReturnValue('test-access-secret'),
    } as unknown as ConfigService;
    return {
      strategy: new JwtStrategy(config, members),
      members,
    };
  }

  it('authenticates active membership by id and validates its claims', async () => {
    const { strategy, members } = createStrategy(activeMember);

    await expect(
      strategy.validate({
        sub: userId.toString(),
        memberId: memberId.toString(),
        workspaceId: workspaceId.toString(),
      }),
    ).resolves.toEqual({
      userId: userId.toString(),
      memberId: memberId.toString(),
      workspaceId: workspaceId.toString(),
      role: 'admin',
    });
    expect(members.findById).toHaveBeenCalledWith(memberId.toString());
  });

  it.each([
    ['wrong user', { ...activeMember, userId: new Types.ObjectId() }],
    ['wrong workspace', { ...activeMember, workspaceId: new Types.ObjectId() }],
    ['inactive membership', { ...activeMember, active: false }],
    ['missing membership', null],
  ])('rejects %s', async (_reason, member) => {
    const { strategy } = createStrategy(member);

    await expect(
      strategy.validate({
        sub: userId.toString(),
        memberId: memberId.toString(),
        workspaceId: workspaceId.toString(),
      }),
    ).rejects.toMatchObject({ status: 401 });
  });
});
