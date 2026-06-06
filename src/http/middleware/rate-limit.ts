import { Headers, HttpMiddleware, HttpServerRequest, HttpServerResponse } from '@effect/platform'
import { Clock, Effect, MutableRef, Option } from 'effect'

interface RateLimitEntry {
	count: number
	windowStart: number
}

const WINDOW_MS = 60_000
const MAX_REQUESTS = 60

const getClientIp = (request: HttpServerRequest.HttpServerRequest): string =>
	Headers.get(request.headers, 'x-forwarded-for').pipe(
		Option.orElse(() => Headers.get(request.headers, 'x-real-ip')),
		Option.getOrElse(() => 'unknown'),
	)

const counters = MutableRef.make<Map<string, RateLimitEntry>>(new Map())

export const rateLimitMiddleware = HttpMiddleware.make((app) =>
	Effect.gen(function* () {
		const request = yield* HttpServerRequest.HttpServerRequest
		const ip = getClientIp(request)
		const now = yield* Clock.currentTimeMillis
		const map = MutableRef.get(counters)
		const entry = map.get(ip)
		const withinWindow = entry !== undefined && now < entry.windowStart + WINDOW_MS

		if (withinWindow && entry.count >= MAX_REQUESTS) {
			yield* Effect.logWarning(`rate limit exceeded for IP: ${ip}`)
			return yield* HttpServerResponse.json(
				{
					error: 'RateLimitError',
					message: 'Rate limit exceeded. Please try again later.',
				},
				{ status: 429 },
			)
		}

		MutableRef.set(
			counters,
			new Map(map).set(ip, {
				count: withinWindow ? entry.count + 1 : 1,
				windowStart: withinWindow ? entry.windowStart : now,
			}),
		)

		return yield* app
	}),
)
