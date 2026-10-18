import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ApiExceptionFilter } from './filters/api-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { PolicyService } from './policy/policy.service';

@Global()
@Module({
  providers: [
    PolicyService,
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [PolicyService],
})
export class CommonModule {}
