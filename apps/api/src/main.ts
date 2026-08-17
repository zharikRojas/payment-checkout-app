import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadEnv } from 'dotenv';
import helmet from 'helmet';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { parseWebOrigins } from './infrastructure/http/cors-origins';

// dist/main.js and src/main.ts both sit one level below apps/api/
loadEnv({ path: resolve(__dirname, '../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      // Swagger UI needs inline styles/scripts; API JSON does not serve a SPA.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: parseWebOrigins(process.env.WEB_ORIGIN),
  });

  const swagger = new DocumentBuilder()
    .setTitle('Payment Checkout API')
    .setDescription(
      'Domain API — products, customers, deliveries, transactions, pay, payment webhooks',
    )
    .setVersion('0.3.0')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  const port = process.env.API_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
