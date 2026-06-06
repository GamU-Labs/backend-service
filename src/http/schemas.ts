import { Schema } from 'effect'

export const RecommendQuerySchema = Schema.Struct({
	judul: Schema.String.pipe(
		Schema.minLength(1),
		Schema.maxLength(100)
	),
	topN: Schema.optionalWith(Schema.NumberFromString, { default: () => 5 }),
})

export type RecommendQuery = Schema.Schema.Type<typeof RecommendQuerySchema>
