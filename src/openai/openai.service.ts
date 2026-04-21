import { Injectable } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { QdrantClientService } from 'src/db/qdrant/qdrant.service';
import { ImportVectorDto } from './openai.dto';
import { classifyQuestion } from 'src/constants/constants';

@Injectable()
export class OpenaiService {
  private chatModel: ChatOpenAI;
  private structureModel: ChatOpenAI;
  private embeddingModel: OpenAIEmbeddings;
  private COLLECTION = 'pdf_collection';

  constructor(private qdrantService: QdrantClientService) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    // ✅ Chat model
    this.chatModel = new ChatOpenAI({
      model: 'gpt-4o-mini',
      streaming: true,
      temperature: 0.7,
      apiKey,
    });

    this.structureModel = new ChatOpenAI({
      model: 'gpt-4o',
      temperature: 0,
      apiKey,
    });

    // ✅ Embedding model (IMPORTANT for Qdrant)
    this.embeddingModel = new OpenAIEmbeddings({
      apiKey,
      model: 'text-embedding-3-small', // 1536 dimensions
    });
  }

  // =========================
  // 💬 CHAT
  // =========================
  async chat(prompt: string): Promise<string> {
    const response = await this.chatModel.invoke([
      new SystemMessage('You are a helpful assistant'),
      new HumanMessage(prompt),
    ]);

    return response.content as string;
  }

  cleanJson(text: string) {
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }
  async invokeStructure(prompt: string): Promise<string> {
    const response = await this.structureModel.invoke([
      new SystemMessage('You are a helpful assistant'),
      new HumanMessage(prompt),
    ]);

    return JSON.parse(this.cleanJson(response.content as string));
  }
  async *chatStream(question: string): AsyncGenerator<string> {
    const stream = await this.chatModel.stream([
      new SystemMessage(
        'You are a job candidate answering interview questions about your own CV',
      ),
      new HumanMessage(question),
    ]);

    for await (const chunk of stream) {
      const content = chunk.content;
      if (typeof content === 'string') {
        yield content;
      } else if (Array.isArray(content)) {
        yield content.map((c: any) => c.text || '').join('');
      }
    }
  }

  async createVecterCollection(collectionName) {
    return this.qdrantService.createCollection(collectionName);
  }
  /**
   * 🔥 Embed single text and store into Qdrant
   */
  async embedAndStore(dto: ImportVectorDto) {
    const items = dto.items;

    if (!items || !items.length) {
      throw new Error('items is empty');
    }

    // 1. Lấy content
    const texts = items.map((i: any) => i.content.trim());

    // 2. Embed (batch)
    const vectors = await this.embeddingModel.embedDocuments(texts);

    // 3. Map sang format Qdrant
    const points = items.map((item, index) => ({
      id: crypto.randomUUID(), // hoặc tự generate
      vector: vectors[index],
      payload: {
        content: item.content,
        ...(item.metadata || {}),
      },
    }));

    // 4. Insert
    await this.qdrantService.insertVector(this.COLLECTION, points);

    return {
      count: points.length,
    };
  }

  // =========================
  // 🧠 EMBEDDING (single)
  // =========================
  async embedQuery(text: string): Promise<number[]> {
    if (!text) throw new Error('Text is empty');

    return this.embeddingModel.embedQuery(text);
  }

  // =========================
  // 🧠 EMBEDDING (batch)
  // =========================
  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!texts?.length) throw new Error('Texts array is empty');

    return this.embeddingModel.embedDocuments(texts);
  }
}
