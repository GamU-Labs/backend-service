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
