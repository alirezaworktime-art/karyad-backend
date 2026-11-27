import { Injectable, NotFoundException } from '@nestjs/common';
import { CatalogRepository, LoadedCatalog } from './catalog.repository.js';
import type { VehicleGroup } from './domain/catalog.schema.js';

export interface ModelSchedule {
  modelId: string;
  modelNameFa: string;
  makerId: string;
  group: VehicleGroup;
}

@Injectable()
export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  getCatalog(): LoadedCatalog {
    return this.repository.get();
  }

  getVersion(): {
    catalogVersion: string;
    schemaVersion: number;
    etag: string;
  } {
    const { catalog, etag } = this.repository.get();
    return {
      catalogVersion: catalog.catalogVersion,
      schemaVersion: catalog.schemaVersion,
      etag,
    };
  }

  getModelSchedule(modelId: string): ModelSchedule {
    const { catalog } = this.repository.get();
    for (const group of catalog.vehicleGroups) {
      const model = group.models.find((candidate) => candidate.id === modelId);
      if (model) {
        return {
          modelId: model.id,
          modelNameFa: model.nameFa,
          makerId: group.makerId,
          group,
        };
      }
    }
    throw new NotFoundException(`Unknown vehicle model "${modelId}"`);
  }
}
