import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenaiModule } from './openai/openai.module';
import { ConfigModule } from '@nestjs/config';
import { PdfModule } from './pdf/pdf.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [OpenaiModule, ConfigModule.forRoot(), PdfModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
