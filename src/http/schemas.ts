import { Schema } from 'effect'
/* 
This is the schema for the query parameters of the /recommend endpoint.
It expects a 'judul' parameter which is a string with a minimum length of 1 and a maximum length of 100.
It also has an optional 'topN' parameter which is a number that can be provided as a string, with a default value of 5 if not provided.
*/
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
