import { Body, Controller, Post } from '@nestjs/common';
import { OpenaiService } from './openai.service';
import { ImportVectorDto } from './openai.dto';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('chat')
  async chat(@Body('prompt') prompt: string) {
    const result = await this.openaiService.chat(prompt);
    return { result };
  }

  @Post('embed')
  async embedContent(@Body() input: ImportVectorDto) {
    await this.openaiService.embedAndStore(input);
    return { message: 'embedded successfully' };
  }

  @Post('create-collection')
  async createCollection(@Body('collectionName') collectionName: string) {
    return await this.openaiService.createVecterCollection(collectionName);
  }
}
