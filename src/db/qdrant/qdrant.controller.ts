import { Body, Controller, Post } from '@nestjs/common';
import { QdrantClientService } from './qdrant.service';
import { CursorDto, DeleteByIdsDto } from './qdrant.dto';

@Controller('qdrant')
export class QdrantController {
  constructor(private readonly qdrantClientService: QdrantClientService) {}

  @Post('/get-by-cursor')
  async getByCursor(@Body() input: CursorDto) {
    const result = await this.qdrantClientService.getByCursor(input);
    return { result };
  }

  @Post('/delete-by-ids')
  async deleteByIds(@Body() input: DeleteByIdsDto) {
    const result = await this.qdrantClientService.deleteManyByIds(input);
    return { result };
  }
}
