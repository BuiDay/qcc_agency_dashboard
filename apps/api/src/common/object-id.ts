import { Types } from 'mongoose';
import { ErrorCode } from '@qcc/shared';
import { notFound } from './app-exception';

/** Chuyển string → ObjectId; id sai định dạng thì coi như không tìm thấy */
export function toObjectId(id: string, code: ErrorCode = ErrorCode.NotFound): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) throw notFound(code);
  return new Types.ObjectId(id);
}

/** So sánh danh sách ObjectId với một id dạng string */
export function hasId(list: (Types.ObjectId | string)[] | undefined, id: string): boolean {
  return !!list?.some((x) => x.toString() === id);
}
