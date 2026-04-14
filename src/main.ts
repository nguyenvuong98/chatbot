import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setBaseViewsDir(path.join(__dirname, '..', 'src/views'));
  app.setViewEngine('ejs');
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
