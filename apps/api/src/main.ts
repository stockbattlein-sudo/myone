import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Cookie parser (httpOnly auth cookies) ──
  app.use(cookieParser());

  // ── Global prefix ──────────────────────────
  app.setGlobalPrefix('api');

  // ── CORS (origin from env, never hardcoded) ─
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // ── Global exception filter ────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Start ──────────────────────────────────
  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 StockBattle API running on http://localhost:${port}/api`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
