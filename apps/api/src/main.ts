import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { AppModule } from './app.module';

loadEnv({ path: resolve(__dirname, '../../../.env') });
loadEnv({ path: resolve(__dirname, '../../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  });

  const swagger = new DocumentBuilder()
    .setTitle('Payment Checkout API')
    .setDescription(
      'Domain API (Phase 3) — products, customers, deliveries, transactions, pay, payment webhooks',
    )
    .setVersion('0.3.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = process.env.API_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
