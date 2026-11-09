import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { crearExcepcionValidacionEspanol } from './common/utils/spanish-validation.util';

async function bootstrap() {
  const logger = new Logger('TuAutoBootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Asegurar directorio para imágenes locales
  const uploadsDir = join(process.cwd(), 'uploads', 'repuestos');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Servir imágenes públicas en /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 1. Prefijo Global para la API
  app.setGlobalPrefix('api');

  // 2. CORS Seguro: Whitelist estricta para Cloudflare Pages, Localhost y Apps Móviles
  const frontendUrl = process.env.FRONTEND_URL;
  const origenesPermitidos: (string | RegExp)[] = [
    'http://localhost:4200',
    'http://localhost:3000',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:3000',
    'capacitor://localhost',
    'https://localhost',
    /\.pages\.dev$/, // Todos los subdominios legítimos de Cloudflare Pages (ej: tuautobo.pages.dev)
  ];
  if (frontendUrl) {
    origenesPermitidos.push(frontendUrl);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (como apps móviles Android/iOS nativas, Postman, etc.)
      if (!origin) return callback(null, true);

      const permitido = origenesPermitidos.some((permitido) => {
        if (typeof permitido === 'string') return permitido === origin;
        if (permitido instanceof RegExp) return permitido.test(origin);
        return false;
      });

      if (permitido) {
        callback(null, true);
      } else {
        logger.warn(`🚫 CORS Bloqueado para origen no autorizado: ${origin}`);
        callback(new Error(`CORS no permitido para el origen: ${origin}`));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Validación Global estricta de DTOs en Español
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => crearExcepcionValidacionEspanol(errors),
    }),
  );

  // 4. Configuración de Swagger / OpenAPI para la presentación
  const config = new DocumentBuilder()
    .setTitle('TuAuto API — Marketplace Automotriz')
    .setDescription(
      'Documentación técnica del backend modular para TuAuto (Santa Cruz de la Sierra, Bolivia). ' +
      'Incluye catálogo vehicular, matriz comparativa multitienda, chat técnico pre-compra y motor de pagos Escrow con QR Simple.',
    )
    .setVersion('1.0.0')
    .addTag('Vehicles (Catálogo y Garaje)')
    .addTag('Parts (Catálogo & Matriz Comparativa)')
    .addTag('Chat (Validación Técnica Pre-Compra)')
    .addTag('Orders & Escrow (Checkout, QR Simple y Custodia)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'TuAuto API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`=======================================================`);
  logger.log(`🚗 TuAuto Backend iniciado exitosamente en el puerto ${port}`);
  logger.log(`📡 API Base:   http://localhost:${port}/api`);
  logger.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  logger.log(`=======================================================`);
}
bootstrap();
