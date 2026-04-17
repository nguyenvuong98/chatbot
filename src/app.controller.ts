import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { CV_TOPICS_OPTIONS } from './constants/constants';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('chat')
  renderChat() {
    return {
      title: 'Chatbot',
    };
  }

  @Get('/embed')
  @Render('embed')
  getPage() {
    return {
      topics: CV_TOPICS_OPTIONS,
      items: [''], // init 1 dòng
    };
  }
  @Get('auth')
  @Render('auth')
  renderAuth() {
    return {
      title: 'Auth',
    };
  }
}
