import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service.js';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      catalogVersion: this.catalogService.getVersion().catalogVersion,
    };
  }
}
