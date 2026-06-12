import { Schema } from 'effect'

export const LlmHighlightSchema = Schema.Struct({
	game_title: Schema.String,
	reason: Schema.String,
})

export const LlmExplanationSchema = Schema.Struct({
	intro: Schema.String,
	highlights: Schema.Array(LlmHighlightSchema),
	conclusion: Schema.String,
})

export type LlmExplanation = Schema.Schema.Type<typeof LlmExplanationSchema>

export const GameRecommendation = Schema.Struct({
	app_id: Schema.Number,
	title: Schema.String,
	rating: Schema.Number,
	desc_sentence: Schema.String,
	tags_clean: Schema.String,
	similarity_score: Schema.Number,
	header_image: Schema.String,
})

export type GameRecommendation = Schema.Schema.Type<typeof GameRecommendation>

export const RecommendResponse = Schema.Struct({
	message: Schema.String,
	data: Schema.Struct({
		input_game: Schema.String,
		status: Schema.String,
		recommendations: Schema.Array(GameRecommendation),
		llm_response: Schema.NullOr(LlmExplanationSchema),
	}),
})

export type RecommendResponse = Schema.Schema.Type<typeof RecommendResponse>

export const RecommendByQueryResponse = Schema.Struct({
	message: Schema.String,
	data: Schema.Struct({
		query: Schema.String,
		status: Schema.String,
		recommendations: Schema.Array(GameRecommendation),
		llm_response: Schema.NullOr(LlmExplanationSchema),
	}),
})

export type RecommendByQueryResponse = Schema.Schema.Type<typeof RecommendByQueryResponse>
