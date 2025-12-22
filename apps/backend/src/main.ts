import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // グローバルプレフィックスを設定
  app.setGlobalPrefix('api/v1');
  
  // CORS 有効化
  app.enableCors({
    origin: '*', // 開発環境では全てのオリジンを許可
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  // 全リクエストに対して DTO バリデーションを自動実行
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,   // クエリやパラメータを DTO に変換
    }),
  );

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 Backend listening on http://localhost:${port}`);
}
bootstrap();
