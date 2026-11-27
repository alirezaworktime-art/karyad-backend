import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { catalogSchema } from './catalog.schema.js';

const catalogPath = resolve('catalog/maintenance-catalog.json');

async function loadRawCatalog(): Promise<Record<string, any>> {
  return JSON.parse(await readFile(catalogPath, 'utf8'));
}

describe('maintenance catalog file', () => {
  it('passes schema and cross-reference validation', async () => {
    const result = catalogSchema.safeParse(await loadRawCatalog());
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  it('gives every replace item a normal or severe interval', async () => {
    const catalog = catalogSchema.parse(await loadRawCatalog());
    const missing = catalog.vehicleGroups.flatMap((group) =>
      group.items
        .filter(
          (item) => item.action === 'replace' && !item.normal && !item.severe,
        )
        .map((item) => `${group.id}/${item.partId}`),
    );
    expect(missing).toEqual([]);
  });

  it('never makes a severe interval longer than the normal one', async () => {
    const catalog = catalogSchema.parse(await loadRawCatalog());
    const violations: string[] = [];
    for (const group of catalog.vehicleGroups) {
      for (const item of group.items) {
        const { normal, severe } = item;
        if (!normal || !severe) continue;
        if (normal.km && severe.km && severe.km > normal.km) {
          violations.push(`${group.id}/${item.partId} km`);
        }
        if (normal.months && severe.months && severe.months > normal.months) {
          violations.push(`${group.id}/${item.partId} months`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});

describe('catalogSchema cross-references', () => {
  it('rejects an item pointing at an unknown part', async () => {
    const raw = await loadRawCatalog();
    raw.vehicleGroups[0].items[0].partId = 'does_not_exist';
    expect(catalogSchema.safeParse(raw).success).toBe(false);
  });

  it('rejects a model listed in two groups', async () => {
    const raw = await loadRawCatalog();
    raw.vehicleGroups[1].models.push({ ...raw.vehicleGroups[0].models[0] });
    expect(catalogSchema.safeParse(raw).success).toBe(false);
  });

  it('rejects an interval with neither km nor months', async () => {
    const raw = await loadRawCatalog();
    raw.vehicleGroups[0].items[0].normal = {};
    expect(catalogSchema.safeParse(raw).success).toBe(false);
  });
});
