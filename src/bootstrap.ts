import { INestApplication, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import helmet from 'helmet';
import type { Env } from './config/env.js';

/**
 * Shared HTTP setup, used by main.ts and by the e2e tests so tests exercise
 * exactly the configuration that runs in production.
 */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  const trustProxyHops = config.get('TRUST_PROXY_HOPS', { infer: true });
  if (trustProxyHops > 0) {
    (app as NestExpressApplication).set('trust proxy', trustProxyHops);
  }

  app.use(helmet());
  app.use(compression());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.enableCors();
  // Lets the process finish in-flight requests on SIGTERM, so rolling
  // deploys and restarts drop no requests.
  app.enableShutdownHooks();
  return app;
}
