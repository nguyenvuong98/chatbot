import { Module } from '@nestjs/common';
import { QdrantClientService } from './qdrant.service';
import { QdrantController } from './qdrant.controller';

@Module({
  controllers: [QdrantController],
  providers: [QdrantClientService],
  exports: [QdrantClientService],
})
export class QDrantModule {}
