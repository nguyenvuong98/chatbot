import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { CursorDto, DeleteByIdsDto } from './qdrant.dto';

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
        (c) => c.name === collectionName,
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

      await this.client.createPayloadIndex(collectionName, {
        field_name: 'type',
        field_schema: 'keyword',
      });

      await this.client.createPayloadIndex(collectionName, {
        field_name: 'tags',
        field_schema: 'keyword',
      });
      console.log(`Collection ${collectionName} created`);
    } catch (e) {
      console.error('createCollection error:', e);
    }
  }

  // ✅ Insert vector (dynamic id)
  async insertVector(
    collectionName: string,
    points: {
      id: string | number;
      vector: number[];
      payload?: Record<string, any>;
    }[],
  ) {
    try {
      if (!points || !points.length) {
        throw new Error('points is empty');
      }

      await this.client.upsert(collectionName, {
        points,
      });

      console.log(`Inserted ${points.length} vectors`);
    } catch (e) {
      console.error('insertVector error:', e);
      throw e;
    }
  }

  // ✅ Search vector (use input vector)
  async searchVector(collectionName: string, vector: number[], topic: string) {
    try {
      const result = await this.client.search(collectionName, {
        vector,
        limit: 3,
        filter: {
          must: [{ key: 'type', match: { value: topic } }],
        },
      });

      return result;
    } catch (e) {
      console.error('searchVector error:', e);
      return [];
    }
  }

  async getByCursor(input: CursorDto) {
    const {
      collectionName,
      limit = 10,
      cursor = null,
      filter,
      withVector,
    } = input;
    const res = await this.client.scroll(collectionName, {
      limit,
      offset: cursor,
      filter,
      with_payload: true,
      with_vector: withVector,
    });

    return {
      data: res.points,
      nextCursor: res.next_page_offset ?? null,
      hasNext: !!res.next_page_offset,
    };
  }

  deleteManyByIds(input: DeleteByIdsDto) {
    const { collectionName, ids } = input;
    return this.client.delete(collectionName, {
      points: ids,
    });
  }
}
