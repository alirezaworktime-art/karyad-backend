import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CatalogService } from '../catalog/catalog.service.js';

/** Polled by load balancers and uptime monitors, so never rate limited. */
@SkipThrottle()
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
