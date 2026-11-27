import { z } from 'zod';

/**
 * Shape of catalog/maintenance-catalog.json — the single source of truth for
 * per-model maintenance intervals. The mobile app bundles a snapshot of the
 * same file and checks this service for newer versions.
 */

const intervalSchema = z
  .object({
    km: z.number().int().positive().optional(),
    months: z.number().int().positive().optional(),
  })
  .strict()
  .refine((value) => value.km !== undefined || value.months !== undefined, {
    message: 'An interval needs km, months, or both',
  });

export const confidenceSchema = z.enum(['official', 'inferred', 'unverified']);

export const maintenanceActionSchema = z.enum([
  'replace',
  'inspect',
  'perform',
]);

const maintenanceItemSchema = z
  .object({
    partId: z.string().min(1),
    action: maintenanceActionSchema,
    normal: intervalSchema.optional(),
    severe: intervalSchema.optional(),
    confidence: confidenceSchema.optional(),
    noteFa: z.string().min(1).optional(),
  })
  .strict();

const vehicleModelSchema = z
  .object({ id: z.string().min(1), nameFa: z.string().min(1) })
  .strict();

const vehicleGroupSchema = z
  .object({
    id: z.string().min(1),
    makerId: z.string().min(1),
    models: z.array(vehicleModelSchema).min(1),
    confidence: confidenceSchema,
    sourceFa: z.string().min(1),
    items: z.array(maintenanceItemSchema).min(1),
  })
  .strict();

export const catalogSchema = z
  .object({
    schemaVersion: z.literal(1),
    catalogVersion: z.string().regex(/^\d{4}\.\d{2}\.\d{2}(\.\d+)?$/),
    locale: z.string(),
    rules: z.object({
      severeConditionsFa: z.string(),
      dueRuleFa: z.string(),
    }),
    makers: z
      .array(
        z
          .object({
            id: z.string().min(1),
            nameFa: z.string().min(1),
            roadsidePhone: z.string().regex(/^\d{3,8}$/),
          })
          .strict(),
      )
      .min(1),
    parts: z
      .array(
        z.object({ id: z.string().min(1), nameFa: z.string().min(1) }).strict(),
      )
      .min(1),
    vehicleGroups: z.array(vehicleGroupSchema).min(1),
  })
  .strict()
  .superRefine((catalog, ctx) => {
    const partIds = new Set(catalog.parts.map((part) => part.id));
    const makerIds = new Set(catalog.makers.map((maker) => maker.id));
    const seenModels = new Set<string>();

    catalog.vehicleGroups.forEach((group, groupIndex) => {
      if (!makerIds.has(group.makerId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['vehicleGroups', groupIndex, 'makerId'],
          message: `Unknown maker "${group.makerId}"`,
        });
      }
      group.models.forEach((model, modelIndex) => {
        if (seenModels.has(model.id)) {
          ctx.addIssue({
            code: 'custom',
            path: ['vehicleGroups', groupIndex, 'models', modelIndex, 'id'],
            message: `Model "${model.id}" appears in more than one group`,
          });
        }
        seenModels.add(model.id);
      });
      group.items.forEach((item, itemIndex) => {
        if (!partIds.has(item.partId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['vehicleGroups', groupIndex, 'items', itemIndex, 'partId'],
            message: `Unknown part "${item.partId}"`,
          });
        }
      });
    });
  });

export type Catalog = z.infer<typeof catalogSchema>;
export type VehicleGroup = Catalog['vehicleGroups'][number];
export type MaintenanceItem = VehicleGroup['items'][number];
