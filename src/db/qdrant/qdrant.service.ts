import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class QdrantClientService implements OnModuleInit, OnModuleDestroy {
  private client;
  constructor(private configService: AppConfigService,) { }

  async onModuleInit(): Promise<void> {
    await this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = new QdrantClient({
        url: this.configService.databaseQdrantInfo.url,
        apiKey: this.configService.databaseQdrantInfo.apiKey,
      });
    } catch (e) {

    }
  }

  async createCollection(collectionName: string) {
    await this.client.createCollection(collectionName, {
      vectors: {
        size: 1536,
        distance: "Cosine"
      }
    });

    console.log(`Collection ${collectionName} created`);
  }

  async insertVector(collectionName: string, body: any) {
    await this.client.upsert(collectionName, {
      points: [
        {
          id: 1,
          vector: Array(1536).fill(0.5), // demo vector
          payload: body
        }
      ]
    });

    console.log("Inserted");
  }

  async  searchVector(collectionName: string, vector: any) {
  const result = await this.client.search(collectionName, {
    vector: Array(1536).fill(0.5),
    limit: 3
  });

  console.log(result);
}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.close();
    } catch (err) {
      console.error('close')
    }
  }
}