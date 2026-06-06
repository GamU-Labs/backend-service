import { HttpServerResponse } from '@effect/platform'

export const appResponseSuccess = <T>(data: T, message = 'Success') =>
	HttpServerResponse.json({ message, data }, { status: 200 })

export const appResponseError = (
	status: number,
	message: string,
	error: string,
	details?: Record<string, unknown>,
) =>
	HttpServerResponse.json(
		{ message, error, ...(details !== undefined ? { details } : {}) },
		{ status },
	)
