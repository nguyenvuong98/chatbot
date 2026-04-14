import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';

@Injectable()
export class QdrantClientService implements OnModuleInit {
  private client!: QdrantClient;

  constructor() {}

  async onModuleInit(): Promise<void> {
    await this.initializeClient();
  }

  private initializeClient(): void {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URI,
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  // ✅ Create collection (safe: ignore if exists)
  async createCollection(collectionName: string) {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        c => c.name === collectionName,
      );

      if (exists) {
        console.log(`Collection ${collectionName} already exists`);
        return;
      }

      await this.client.createCollection(collectionName, {
        vectors: {
          size: 1536,
          distance: 'Cosine',
        },
      });

      console.log(`Collection ${collectionName} created`);
    } catch (e) {
      console.error('createCollection error:', e);
    }
  }

  // ✅ Insert vector (dynamic id)
  async insertVector(
    collectionName: string,
    vectors: number[][] | number[],
    texts: string[],
  ) {
    try {
      await this.client.upsert(collectionName, {
        points: vectors.map((vector, i) => ({
          id: Date.now() + i,
          vector: vector, // ✅ single vector
          payload: {
            content: texts[i], // ✅ single string
          },
        })),
      });

      console.log('Inserted');
    } catch (e) {
      console.error('insertVector error:', e);
    }
  }

  // ✅ Search vector (use input vector)
  async searchVector(collectionName: string, vector: number[]) {
    try {
      const result = await this.client.search(collectionName, {
        vector,
        limit: 3,
      });

      return result;
    } catch (e) {
      console.error('searchVector error:', e);
      return [];
    }
  }
}
