import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { ErrorCode, MemberStatus, WorkspaceRole } from '@qcc/shared';
import type { Actor } from '../common/actor';
import { AppException } from '../common/app-exception';
import { Member } from '../members/member.schema';
import { User } from '../users/user.schema';

export interface TokenPayload {
  sub: string; // userId
  mid: string; // memberId
  wid: string; // workspaceId
}

const unauthorized = (code = ErrorCode.Unauthorized) => new AppException(code, HttpStatus.UNAUTHORIZED);

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Member.name) private readonly members: Model<Member>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw unauthorized(ErrorCode.InvalidCredentials);
    }
    // MVP chỉ có 1 agency: lấy member đầu tiên của user
    const member = await this.members.findOne({ userId: user._id }).sort({ createdAt: 1 });
    if (!member) throw unauthorized(ErrorCode.InvalidCredentials);
    if (member.status !== MemberStatus.Active) throw unauthorized(ErrorCode.MemberDisabled);

    const payload: TokenPayload = { sub: user.id, mid: member.id, wid: member.workspaceId.toString() };
    return { ...(await this.issueTokens(payload)), me: await this.me(payload) };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw unauthorized();
    const payload = await this.verify(refreshToken, 'refresh');
    await this.loadActor(payload); // member bị khoá thì không cấp token mới
    return this.issueTokens({ sub: payload.sub, mid: payload.mid, wid: payload.wid });
  }

  /** Kiểm tra access token + member còn hoạt động → Actor. Dùng trong JwtAuthGuard. */
  async authenticate(accessToken: string): Promise<Actor> {
    return this.loadActor(await this.verify(accessToken, 'access'));
  }

  async me(payload: TokenPayload) {
    const member = await this.members.findById(payload.mid).populate('userId', 'email name avatar').lean();
    return member;
  }

  private async loadActor(payload: TokenPayload): Promise<Actor> {
    // Đọc role từ DB mỗi request để đổi quyền / khoá tài khoản có hiệu lực ngay
    const member = await this.members.findById(payload.mid).lean();
    if (!member || member.status !== MemberStatus.Active) throw unauthorized(ErrorCode.MemberDisabled);
    return {
      userId: payload.sub,
      memberId: payload.mid,
      workspaceId: member.workspaceId.toString(),
      role: member.role as WorkspaceRole,
    };
  }

  private async verify(token: string, kind: 'access' | 'refresh'): Promise<TokenPayload> {
    try {
      return await this.jwt.verifyAsync<TokenPayload>(token, { secret: this.secret(kind) });
    } catch {
      throw unauthorized();
    }
  }

  private async issueTokens(payload: TokenPayload) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.secret('access'),
      expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.secret('refresh'),
      expiresIn: this.config.get('JWT_REFRESH_TTL', '7d'),
    });
    return { accessToken, refreshToken };
  }

  private secret(kind: 'access' | 'refresh'): string {
    return this.config.getOrThrow(kind === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET');
  }
}
