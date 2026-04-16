import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContentItemDto {
  @ApiProperty({
    example: 'Tôi có 3 năm kinh nghiệm backend với NestJS...',
    description: 'Nội dung text cần embedding',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    example: {
      type: 'experience',
      topic: 'backend',
      tags: ['nestjs', 'nodejs'],
    },
    description: 'Metadata cho từng content',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class ImportVectorDto {
  @ApiProperty({
    type: [ContentItemDto],
    description: 'Danh sách các đoạn content cần import',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentItemDto)
  items!: ContentItemDto[];
}
