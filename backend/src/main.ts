import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Parse allowed origins from environment
  const configuredOrigins: string[] = [];
  if (process.env.FRONTEND_URL) {
    configuredOrigins.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
  }
  if (process.env.CORS_ORIGINS) {
    const list = process.env.CORS_ORIGINS.split(',').map((o) => o.trim().replace(/\/+$/, ''));
    configuredOrigins.push(...list);
  }

  // Always permit local development ports
  const localOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  const allowedOrigins = Array.from(new Set([...configuredOrigins, ...localOrigins])).filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, Postman, health check requests without origin header
      if (!origin) {
        return callback(null, true);
      }

      // Check explicit allowed origins or wildcard
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }

      // Automatically allow Vercel deployment preview and production domains
      try {
        const parsed = new URL(origin);
        if (parsed.hostname.endsWith('.vercel.app')) {
          return callback(null, true);
        }
      } catch (e) {
        // invalid URL format
      }

      // If FRONTEND_URL is not set yet, be forgiving during initial deployment
      if (allowedOrigins.length === localOrigins.length) {
        return callback(null, true);
      }

      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = Number(process.env.PORT) || 5001;
  await app.listen(port, '0.0.0.0');
  console.log(`ERP Barcode Backend server is running on port ${port}`);
}
bootstrap();

