import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor(), new LoggingInterceptor());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Billboard Management API')
    .setDescription(
      'REST API for the Billboard Management System - Municipality of Maputo. ' +
        'Manages billboards, clients, payments, tariffs, and geospatial data.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management operations')
    .addTag('Clients', 'Client management operations')
    .addTag('Billboards', 'Billboard management and tracking')
    .addTag('Tariff Zones', 'Geographical tariff zones management')
    .addTag('Tariffs', 'Dynamic pricing and tariff management')
    .addTag('Payments', 'Payment processing and validation')
    .addTag('Invoices', 'Invoice and receipt generation')
    .addTag('Notifications', 'In-app and email notifications')
    .addTag('Reports', 'Financial and operational reports')
    .addTag('Geospatial', 'Maps and geolocation endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    customSiteTitle: 'Billboard API - Maputo Municipality',
    customCss: '.swagger-ui .topbar { background-color: #00a651; }',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`
    ╔═══════════════════════════════════════════════════════════╗
    ║   Billboard Management System - Municipality of Maputo     ║
    ║                                                           ║
    ║   🚀 Server running on: http://localhost:${port}           ║
    ║   📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs    ║
    ║   🌍 Environment: ${configService.get('NODE_ENV')}                        ║
    ╚═══════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
