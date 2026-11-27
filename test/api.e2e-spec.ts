import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/bootstrap.js';

describe('Karyad API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = configureApp(
      moduleRef.createNestApplication(),
    ) as INestApplication<App>;
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health reports ok with the catalog version', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.catalogVersion).toMatch(/^\d{4}\.\d{2}\.\d{2}/);
  });

  it('GET /api/v1/catalog returns the catalog with an ETag', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog')
      .expect(200);
    expect(res.headers.etag).toBeDefined();
    expect(res.body.vehicleGroups.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/catalog answers 304 when the ETag matches', async () => {
    const first = await request(app.getHttpServer()).get('/api/v1/catalog');
    await request(app.getHttpServer())
      .get('/api/v1/catalog')
      .set('If-None-Match', first.headers.etag)
      .expect(304);
  });

  it('GET /api/v1/catalog/models/:id returns that model schedule', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/catalog/models/quick')
      .expect(200);
    expect(res.body.modelNameFa).toBe('کوییک');
    expect(res.body.group.items.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/catalog/models/:id answers 404 for unknown models', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/catalog/models/not-a-car')
      .expect(404);
  });

  it('GET /api/v1/app-version returns android version info', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/app-version?platform=android')
      .expect(200);
    expect(res.body).toMatchObject({ platform: 'android' });
  });

  it('GET /api/v1/app-version rejects unknown platforms', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/app-version?platform=symbian')
      .expect(400);
  });
});
