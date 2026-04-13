import { ChatOpenAI } from '@langchain/openai';
import { Injectable } from '@nestjs/common';
import { HumanMessage, SystemMessage } from 'langchain';

@Injectable()
export class OpenaiService {
  private model: ChatOpenAI;

  constructor() {
    console.log('process.env.OPENAI_API_KEY', process.env.OPENAI_API_KEY);
    this.model = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chat(prompt: string): Promise<string> {
    const response = await this.model.invoke([
      new SystemMessage('You are a helpful assistant'),
      new HumanMessage(prompt),
    ]);

    return response.content as string;
  }
}
