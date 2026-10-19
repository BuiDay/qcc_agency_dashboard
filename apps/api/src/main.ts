import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ErrorCode } from '@qcc/shared';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  // Cho phép frontend gửi cookie đăng nhập
  app.enableCors({ origin: config.get('WEB_ORIGIN', 'http://localhost:3000'), credentials: true });

  // Kiểm tra dữ liệu gửi lên theo DTO; lỗi trả mã VALIDATION_FAILED + chi tiết
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: ErrorCode.ValidationFailed,
          message: 'Dữ liệu không hợp lệ',
          details: errors.map((e) => ({ field: e.property, errors: Object.values(e.constraints ?? {}) })),
        }),
    }),
  );

  // Swagger: http://localhost:4000/docs
  const swagger = new DocumentBuilder()
    .setTitle('QCC Agency API')
    .setDescription('API quản lý task cho agency. Đăng nhập ở /auth/login, copy accessToken vào nút Authorize.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  // Áp Bearer cho mọi route để nút Authorize có tác dụng
  document.security = [{ bearer: [] }];
  SwaggerModule.setup('docs', app, document, { jsonDocumentUrl: 'docs/json' });

  const port = Number(config.get('PORT', 4000));
  await app.listen(port);
  console.log(`API chạy tại http://localhost:${port} · Swagger: http://localhost:${port}/docs`);
}

bootstrap();
