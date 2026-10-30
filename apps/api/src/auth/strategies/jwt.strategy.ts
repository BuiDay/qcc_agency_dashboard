import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ErrorCode } from '@qcc/shared';
import { InjectModel } from '@nestjs/mongoose';
import { Strategy } from 'passport-jwt';
import { Model, Types } from 'mongoose';
import { Actor } from '../../common/interfaces/actor.interface';
import { Member } from '../../members/schemas/member.schema';

interface JwtRequest {
  cookies?: Record<string, string>;
  headers?: { authorization?: string };
}

export function extractAccessToken(request: JwtRequest): string | null {
  const authorization = request.headers?.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (match) return match[1];

  return request.cookies?.qcc_access ?? null;
}

interface JwtPayload {
  sub: string;
  memberId: string;
  workspaceId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectModel(Member.name) private readonly members: Model<Member>,
  ) {
    super({
      jwtFromRequest: extractAccessToken,
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<Actor> {
    if (
      !Types.ObjectId.isValid(payload.sub) ||
      !Types.ObjectId.isValid(payload.memberId) ||
      !Types.ObjectId.isValid(payload.workspaceId)
    ) {
      throw new UnauthorizedException(ErrorCode.Unauthorized);
    }
    const member = await this.members.findById(payload.memberId).lean();
    if (
      !member ||
      member.userId.toString() !== payload.sub ||
      member.workspaceId.toString() !== payload.workspaceId ||
      !member.active
    ) {
      throw new UnauthorizedException(ErrorCode.Unauthorized);
    }
    return {
      userId: payload.sub,
      memberId: payload.memberId,
      workspaceId: payload.workspaceId,
      role: member.role,
    };
  }
}
