import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DomainHttpModule } from './infrastructure/http/domain-http.module';

@Module({
  imports: [DomainHttpModule],
  controllers: [AppController],
})
export class AppModule {}
