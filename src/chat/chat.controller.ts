import { Controller, Post, Body, Get, Render } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body('question') question: string) {
    const answer = await this.chatService.chat(question);
    return { answer };
  }

  @Get()
  @Render('chat')
  renderChat() {
    return {
      title: 'Chatbot',
    };
  }
}
