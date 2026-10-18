import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'is-public';
export const Public = (): MethodDecorator => SetMetadata(IS_PUBLIC, true);
