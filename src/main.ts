import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new PrismaClientExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Taskify API')
    .setDescription('The Taskify API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const configService = app.get<ConfigService>(ConfigService);
  const port = configService.get<number>('app.port') || 3000;

  await app.listen(port, () => {
    logger.log(`Application is running on PORT ${port}`);
    logger.log(`Swagger UI is available on http://localhost:${port}/swagger`);
  });
}
void bootstrap();
