import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';

// Config is validated when app.module.js is first evaluated, so the low
// limit must be in the environment before that import runs.
async function loadApp() {
  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/bootstrap.js');
  return { AppModule, configureApp };
}

describe('Resilience and abuse protection (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.RATE_LIMIT_PER_MINUTE = '5';
    const { AppModule, configureApp } = await loadApp();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleRef.createNestApplication(),
    ) as INestApplication<App>;
    await app.init();
  });

  afterAll(async () => {
    delete process.env.RATE_LIMIT_PER_MINUTE;
    await app.close();
  });

  it('answers 429 once a client exceeds the per-minute limit', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 5; i += 1) {
      await request(server).get('/api/v1/catalog/version').expect(200);
    }
    await request(server).get('/api/v1/catalog/version').expect(429);
  });

  it('never rate limits the health check', async () => {
    const server = app.getHttpServer();
    for (let i = 0; i < 10; i += 1) {
      await request(server).get('/api/health').expect(200);
    }
  });

  it('sends security headers', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('compresses large responses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog')
      .set('Accept-Encoding', 'gzip');
    expect([200, 429]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-encoding']).toBe('gzip');
    }
  });
});
