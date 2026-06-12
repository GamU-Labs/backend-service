import { Schema } from 'effect'

export class GameNotFoundError extends Schema.TaggedError<GameNotFoundError>()(
	'GameNotFoundError',
	{ title: Schema.String },
) {}

export class ModelNotLoadedError extends Schema.TaggedError<ModelNotLoadedError>()(
	'ModelNotLoadedError',
	{ reason: Schema.String },
) {}

export class LlmError extends Schema.TaggedError<LlmError>()('LlmError', {
	message: Schema.String,
}) {}

export class InvalidInputError extends Schema.TaggedError<InvalidInputError>()(
	'InvalidInputError',
	{ detail: Schema.String },
) {}

export class SanitizeInputError extends Schema.TaggedError<SanitizeInputError>()(
	'SanitizeInputError',
	{ detail: Schema.String },
) {}

export class RateLimitError extends Schema.TaggedError<RateLimitError>()('RateLimitError', {
	ip: Schema.String,
}) {}

export class MLServiceError extends Schema.TaggedError<MLServiceError>()('MLServiceError', {
	message: Schema.String,
}) {}

export class SteamImageError extends Schema.TaggedError<SteamImageError>()('SteamImageError', {
	message: Schema.String,
	appId: Schema.Number,
}) {}
