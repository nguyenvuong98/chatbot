import { Module } from '@nestjs/common';
import { QdrantClientService } from './qdrant.service';

@Module({
  providers: [QdrantClientService],
  exports: [QdrantClientService],
})
export class QDrantModule {}
