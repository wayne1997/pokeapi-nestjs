import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1/'); //Configura un prefijo en el directorio.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true, //Transforma la informacion de los dtos a los tipos deseados
    transformOptions: {
      enableImplicitConversion: true,
    }
  }));
  await app.listen(process.env.PORT);
}
bootstrap();
