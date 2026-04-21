import { Controller, Post, Body, Get, Render, Res } from '@nestjs/common';
import { ChatService } from './chat.service';
import type { Response } from 'express';
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body('question') question: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    const stream = await this.chatService.chatStream(question);

    for await (const chunk of stream) {
      res.write(`data: ${chunk}\n\n`);
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  }

  @Post('/derp')
  async chatDerp(@Body('question') question: string) {
    const res = await this.chatService.chatERP(question);
    console.log('res', res);
    return res;
  }

  @Get()
  @Render('chat2')
  renderChat() {
    return {
      title: 'Chatbot',
    };
  }
}
