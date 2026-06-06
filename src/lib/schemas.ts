import { Schema } from 'effect'

export const GameRecommendation = Schema.Struct({
	title: Schema.String,
	rating: Schema.Number,
	desc_sentence: Schema.String,
	tags_clean: Schema.String,
	similarity_score: Schema.Number,
})

export type GameRecommendation = Schema.Schema.Type<typeof GameRecommendation>

export const RecommendResponse = Schema.Struct({
	message: Schema.String,
	data: Schema.Struct({
		input_game: Schema.String,
		status: Schema.String,
		recommendations: Schema.Array(GameRecommendation),
		llm_response: Schema.String,
	}),
})

export type RecommendResponse = Schema.Schema.Type<typeof RecommendResponse>
