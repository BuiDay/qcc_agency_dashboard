import * as bcrypt from 'bcryptjs';
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@qcc/shared';
import { Model, Types } from 'mongoose';
import { Actor } from '../common/interfaces/actor.interface';
import { Member } from '../members/schemas/member.schema';
import { User } from '../users/schemas/user.schema';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Member.name) private readonly members: Model<Member>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users
      .findOne({ email: dto.email.toLowerCase(), active: true })
      .select('+passwordHash email name avatar');
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException(ErrorCode.Unauthorized);
    }
    const member = await this.members.findOne({
      userId: user._id,
      active: true,
    });
    if (!member) throw new UnauthorizedException(ErrorCode.Unauthorized);

    const payload = {
      sub: user._id.toString(),
      memberId: member._id.toString(),
      workspaceId: member.workspaceId.toString(),
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: 7 * 24 * 60 * 60,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      member: {
        id: member._id.toString(),
        workspaceId: member.workspaceId.toString(),
        role: member.role,
      },
    };
  }

  async refresh(token: string | undefined) {
    if (!token) throw new UnauthorizedException(ErrorCode.Unauthorized);
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    let payload: {
      sub: string;
      memberId: string;
      workspaceId: string;
    };
    try {
      payload = await this.jwt.verifyAsync<{
        sub: string;
        memberId: string;
        workspaceId: string;
      }>(token, {
        secret: refreshSecret,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      if (
        !['TokenExpiredError', 'JsonWebTokenError', 'NotBeforeError'].includes(
          reason,
        )
      ) {
        throw error;
      }
      this.logger.warn(`Refresh JWT verification failed (${reason}).`);
      throw new UnauthorizedException(ErrorCode.Unauthorized);
    }
    if (
      !Types.ObjectId.isValid(payload.sub) ||
      !Types.ObjectId.isValid(payload.memberId) ||
      !Types.ObjectId.isValid(payload.workspaceId)
    ) {
      this.logger.warn('Refresh token rejected: malformed token claims.');
      throw new UnauthorizedException(ErrorCode.Unauthorized);
    }
    const member = await this.members.findById(payload.memberId).lean();
    const user = await this.users.findOne({
      _id: payload.sub,
      active: true,
    });
    const memberMatchesClaims =
      member !== null &&
      member !== undefined &&
      member.userId.toString() === payload.sub &&
      member.workspaceId.toString() === payload.workspaceId &&
      member.active;
    if (!memberMatchesClaims || !user) {
      this.logger.warn(
        `Refresh token account check failed (memberIdExists=${Boolean(member)}, userMatches=${member ? member.userId.toString() === payload.sub : false}, workspaceMatches=${member ? member.workspaceId.toString() === payload.workspaceId : false}, memberActive=${member?.active ?? false}, userActive=${Boolean(user)}).`,
      );
      throw new UnauthorizedException(ErrorCode.Unauthorized);
    }
    const claims = {
      sub: payload.sub,
      memberId: payload.memberId,
      workspaceId: payload.workspaceId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(claims),
      this.jwt.signAsync(claims, {
        secret: refreshSecret,
        expiresIn: 7 * 24 * 60 * 60,
      }),
    ]);
    return { accessToken, refreshToken };
  }

  async current(actor: Actor) {
    const user = await this.users
      .findById(actor.userId)
      .select('_id email name avatar')
      .lean();
    if (!user) throw new UnauthorizedException(ErrorCode.Unauthorized);
    return {
      ...user,
      memberId: actor.memberId,
      role: actor.role,
      workspaceId: actor.workspaceId,
    };
  }
}
