import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as https from 'https';
import * as passport from 'passport';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  // const httpsOptions = {
  //   // pfx: fs.readFileSync('src/config/keystore.p12'),

  //   pfx: fs.readFileSync('dist/config/keystore.p12'),
  //   passphrase: '123123123',
  // };

  // const app = await NestFactory.create(AppModule, {
  //   httpsOptions,
  // });


  const app = await NestFactory.create(AppModule);


  app.use(passport.initialize());
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 8000;

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  app.setGlobalPrefix('api/v1', { exclude: [''] });

  //ConfigCORS
  app.enableCors(
    {
      "origin": true,
      "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      "preflightContinue": false,
      credentials: true
    }
  );

  //#region Microservices
  const rabbitMQMicroservice = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'pooltable.created',
      queueOptions: { durable: false },
    },
  });

  rabbitMQMicroservice.listen();
  console.log('✅ RabbitMQ Microservice is running...');
  //#endregion

  //#region Swagger
  //ConfigSwagger
  const config = new DocumentBuilder()
    .setTitle('API PoolScoring')
    .setDescription('NestJS API PoolScoring')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/document', app, document);
  //#endregion

  await app.listen(port);
}
bootstrap();
