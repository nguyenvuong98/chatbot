import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get port(): number {
    return Number(this.configService.get<number>('PORT', 3000));
  }

  get appEnv(): string {
    return this.configService.get<string>('APP_ENV') || 'development';
  }

  get databaseQdrantInfo() {
    return {
      url: this.configService.get<string>('QDRANT_URI'),
      apiKey: this.configService.get<string>('QDRANT_API_KEY'),
    };
  }
}
