import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CursorDto {
  @ApiPropertyOptional({
    example: 'cv_collection',
    description: 'Tên collection trong Qdrant',
  })
  @IsString()
  collectionName!: string;

  @ApiPropertyOptional({
    example: 10,
    description: 'Số lượng record mỗi lần fetch',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'eyJvZmZzZXQiOjEyMzQ1Nn0=', // base64 cursor
    description: 'Cursor (next_page_offset) encode base64',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    example: {
      must: [
        {
          key: 'type',
          match: { value: 'cv' },
        },
      ],
    },
    description: 'Filter theo payload Qdrant',
  })
  @IsOptional()
  @IsObject()
  filter?: Record<string, any>;

  @ApiPropertyOptional({
    example: false,
    description: 'Có trả về vector embedding hay không',
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  withVector?: boolean = false;
}

export class DeleteByIdsDto {
  @ApiProperty({
    example: 'cv_collection',
  })
  @IsString()
  collectionName!: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Danh sách ID (string hoặc number)',
  })
  @IsArray()
  @ArrayNotEmpty()
  ids!: (string | number)[];
}
