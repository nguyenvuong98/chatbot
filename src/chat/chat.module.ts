import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { OpenaiModule } from 'src/openai/openai.module';
import { QDrantModule } from 'src/db/qdrant/qdrant.module';

@Module({
  imports: [OpenaiModule, QDrantModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
