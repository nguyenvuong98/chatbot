import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenaiModule } from './openai/openai.module';
import { ConfigModule } from '@nestjs/config';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [OpenaiModule, ConfigModule.forRoot(), PdfModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
