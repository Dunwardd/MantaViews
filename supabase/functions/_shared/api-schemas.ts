import { z } from 'zod';

export const localeSchema = z.enum(['es', 'en']);
export const uuidSchema = z.string().uuid('Debe ser un UUID válido.');
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Ingresa tu correo electrónico.')
  .email('Ingresa un correo válido.')
  .max(254, 'El correo es demasiado largo.')
  .transform((value) => value.toLowerCase());
export const passwordSchema = z
  .string()
  .min(8, 'Usa al menos 8 caracteres.')
  .max(72, 'La contraseña no puede superar 72 caracteres.')
  .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
  .regex(/\d/, 'Incluye al menos un número.');
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Ingresa un nombre de al menos 2 caracteres.')
  .max(80, 'El nombre no puede superar 80 caracteres.');

export const signInSchema = z.object({ email: emailSchema, password: passwordSchema });
export const signUpSchema = signInSchema.extend({ displayName: displayNameSchema });

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(10000).default(0),
});

export const profileUpdateSchema = z
  .object({
    avatar_path: z.string().trim().min(1).max(500).nullable().optional(),
    display_name: displayNameSchema.optional(),
    preferred_language: localeSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Envía al menos un campo.');

export const interestSchema = z.object({
  category_id: z.number().int().positive(),
  user_id: uuidSchema,
  weight: z.number().int().min(1).max(5),
});

export const reviewCreateSchema = z.object({
  comment: z.string().trim().min(3).max(1000),
  place_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  user_id: uuidSchema,
});

export const reviewUpdateSchema = z
  .object({
    comment: z.string().trim().min(3).max(1000).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    status: z.literal('archived').optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Envía al menos un campo.');

export const favoriteSchema = z.object({ place_id: uuidSchema, user_id: uuidSchema });
export const touristVoteSchema = favoriteSchema.extend({ is_touristic: z.boolean() });

export const mantaCoordinateSchema = z.object({
  latitude: z.number().min(-1.2).max(-0.8),
  longitude: z.number().min(-81).max(-80.5),
});

export const placeSuggestionSchema = z.object({
  address: z.string().trim().min(3).max(250),
  category_id: z.number().int().positive(),
  description: z.string().trim().min(20).max(1500),
  evidence_url: z.string().url().startsWith('https://').nullable().optional(),
  latitude: mantaCoordinateSchema.shape.latitude,
  longitude: mantaCoordinateSchema.shape.longitude,
  name: z.string().trim().min(2).max(150),
  submitted_by: uuidSchema,
});

export const imageMetadataSchema = z.object({
  alt_text: z.string().trim().min(3).max(180),
  place_id: uuidSchema,
  review_id: uuidSchema.nullable().optional(),
  storage_path: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpe?g|png|webp)$/i),
  uploader_id: uuidSchema,
});

export const reportSchema = z.object({
  details: z.string().trim().min(3).max(500).nullable().optional(),
  reason: z.enum(['incorrect_information', 'duplicate', 'inappropriate', 'spam', 'other']),
  reporter_id: uuidSchema,
  target_id: uuidSchema,
  target_type: z.enum(['place', 'review', 'image']),
});

export const routePreviewSchema = z.object({
  destination: mantaCoordinateSchema,
  origin: mantaCoordinateSchema,
  profile: z.enum(['foot-walking', 'driving-car', 'cycling-regular']).default('foot-walking'),
});

const placeTranslationSchema = z.object({
  description: z.string().trim().min(20).max(5000),
  name: z.string().trim().min(2).max(150),
  shortDescription: z.string().trim().min(10).max(280),
});

export const adminPlaceSchema = z.object({
  address: z.string().trim().min(3).max(250),
  categoryId: z.number().int().positive(),
  isFeatured: z.boolean().default(false),
  latitude: mantaCoordinateSchema.shape.latitude,
  longitude: mantaCoordinateSchema.shape.longitude,
  openingHours: z.record(z.string(), z.unknown()).default({}),
  phone: z.string().trim().min(7).max(30).nullable().optional(),
  priceLevel: z.number().int().min(0).max(4).nullable().optional(),
  status: z.enum(['pending', 'published', 'archived']).default('pending'),
  translations: z.object({ en: placeTranslationSchema, es: placeTranslationSchema }),
  websiteUrl: z.string().url().startsWith('https://').nullable().optional(),
});

export const adminPlaceUpdateSchema = adminPlaceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Envía al menos un campo.');

export const reviewSuggestionSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  notes: z.string().trim().min(3).max(500).nullable().optional(),
  suggestionId: uuidSchema,
});

export const moderateContentSchema = z.object({
  decision: z.enum(['publish', 'reject', 'archive']),
  notes: z.string().trim().min(3).max(500).nullable().optional(),
  targetId: uuidSchema,
  targetType: z.enum(['review', 'image']),
});

export const resolveReportSchema = z.object({
  moderationAction: z.enum(['none', 'archive_target']).default('none'),
  reportId: uuidSchema,
  resolution: z.enum(['resolved', 'dismissed']),
});

export type AdminPlaceInput = z.infer<typeof adminPlaceSchema>;
export type RoutePreviewInput = z.infer<typeof routePreviewSchema>;
