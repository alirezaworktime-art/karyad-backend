import { INestApplication, VersioningType } from '@nestjs/common';

/**
 * Shared HTTP setup, used by main.ts and by the e2e tests so tests exercise
 * exactly the configuration that runs in production.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors();
  app.enableShutdownHooks();
  return app;
}
