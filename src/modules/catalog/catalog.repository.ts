import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { Catalog, catalogSchema } from './domain/catalog.schema.js';

export interface LoadedCatalog {
  catalog: Catalog;
  /** Strong ETag of the raw file, so clients can skip unchanged downloads. */
  etag: string;
}

/**
 * Loads and validates the catalog file once at startup. An invalid catalog
 * stops the service from booting rather than serving bad intervals.
 */
@Injectable()
export class CatalogRepository implements OnModuleInit {
  private loaded: LoadedCatalog | undefined;

  constructor(private readonly config: ConfigService<Env, true>) {}

  async onModuleInit(): Promise<void> {
    this.loaded = await CatalogRepository.loadFromFile(
      resolve(this.config.get('CATALOG_PATH', { infer: true })),
    );
  }

  get(): LoadedCatalog {
    if (!this.loaded) {
      throw new Error('Catalog requested before it was loaded');
    }
    return this.loaded;
  }

  static async loadFromFile(path: string): Promise<LoadedCatalog> {
    const raw = await readFile(path, 'utf8');
    const catalog = catalogSchema.parse(JSON.parse(raw));
    const etag = `"${createHash('sha256').update(raw).digest('hex').slice(0, 32)}"`;
    return { catalog, etag };
  }
}
