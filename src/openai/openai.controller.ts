import { Body, Controller, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('chat')
  async chat(@Body('prompt') prompt: string) {
    const result = await this.openaiService.chat(prompt);
    return { result };
  }
}
