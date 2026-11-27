import { Controller, Get, Headers, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CatalogService } from './catalog.service.js';
import type { ModelSchedule } from './catalog.service.js';

@Controller({ path: 'catalog', version: '1' })
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /** Full catalog. Honors If-None-Match so unchanged catalogs cost one 304. */
  @Get()
  getCatalog(
    @Headers('if-none-match') ifNoneMatch: string | undefined,
    @Res() res: Response,
  ): void {
    const { catalog, etag } = this.catalogService.getCatalog();
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    if (ifNoneMatch === etag) {
      res.status(304).end();
      return;
    }
    res.status(200).json(catalog);
  }

  @Get('version')
  getVersion() {
    return this.catalogService.getVersion();
  }

  @Get('models/:modelId')
  getModel(@Param('modelId') modelId: string): ModelSchedule {
    return this.catalogService.getModelSchedule(modelId);
  }
}
