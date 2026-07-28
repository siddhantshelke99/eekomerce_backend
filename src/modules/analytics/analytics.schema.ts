import { Type, Static } from '@sinclair/typebox';

export const TrackSearchBodySchema = Type.Object(
  {
    queryText: Type.String({ minLength: 1, maxLength: 100 }),
    categoryId: Type.Optional(Type.String({ format: 'uuid' })),
    latitude: Type.Number({ minimum: -90, maximum: 90 }),
    longitude: Type.Number({ minimum: -180, maximum: 180 }),
  },
  { additionalProperties: false }
);

export type TrackSearchBody = Static<typeof TrackSearchBodySchema>;

export const DemandInsightResponseSchema = Type.Object({
  queryText: Type.String(),
  searchCount: Type.Number(),
  distanceKm: Type.Number(),
  insightMessage: Type.String(),
});

export const DemandIntelligenceResponseSchema = Type.Object({
  success: Type.Literal(true),
  data: Type.Array(DemandInsightResponseSchema),
});
