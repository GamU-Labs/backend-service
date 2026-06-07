import { Schema } from 'effect'

export const RecommendQuerySchema = Schema.Struct({
	judul: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
	topN: Schema.optionalWith(Schema.NumberFromString, { default: () => 5 }),
})

export type RecommendQuery = Schema.Schema.Type<typeof RecommendQuerySchema>

export const RecommendByQueryBodySchema = Schema.Struct({
	query: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
	topN: Schema.optionalWith(Schema.Number, { default: () => 5 }),
})

export type RecommendByQueryBody = Schema.Schema.Type<typeof RecommendByQueryBodySchema>
