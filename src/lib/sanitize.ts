import { Effect } from 'effect'
import { SanitizeInputError } from './errors.js'

const INJECTION_PATTERNS: ReadonlyArray<string> = [
	'tampilkan\\s+(system|prompt|api|key|secret|token|password|connection|database|config|konfigurasi)',
	'show\\s+me\\s+(the|your|system|prompt|api|key|secret|token|password|connection|database|config)',
	'reveal\\s+(system|prompt|api|key|secret|config)',
	'print\\s+(system|prompt|api|key|secret|config)',
	'expose\\s+(system|prompt|api|key|secret|config)',
	'dump\\s+(system|prompt|config|environment|env)',
	'system\\s+prompt',
	'system\\s+instruction',
	'api\\s+key',
	'connection\\s+string',
	'database\\s+connection',
	'ignore\\s+previous',
	'ignore\\s+above',
	'abaikan\\s+(sebelumnya|instruksi|perintah)',
	'override\\s+(previous|instructions|prompt|perintah)',
	'bypass\\s+(security|filter|sanitization)',
	'i\\s+am\\s+(the|your)\\s+(developer|admin|creator|owner)',
	'saya\\s+(adalah|ini)\\s+(developer|admin|pengembang)',
	'sebagai\\s+(admin|developer|pengembang)',
]

const isInjectionSentence = (sentence: string): boolean =>
	INJECTION_PATTERNS.some((p) => new RegExp(p, 'i').test(sentence))

const stripStructural = (query: string): string =>
	query
		.replace(/[\r\n]/g, ' ')
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
		.replace(/\s{2,}/g, ' ')
		.trim()

const removeInjectionSentences = (query: string): string =>
	query
		.split(/[.!?;]/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0)
		.filter((s) => !isInjectionSentence(s))
		.join('. ')
		.trim()

const MAX_QUERY_LENGTH = 200
const MAX_TITLE_LENGTH = 100

export const sanitizeQuery = (raw: string): Effect.Effect<string, SanitizeInputError> =>
	Effect.gen(function* () {
		const cleaned = stripStructural(removeInjectionSentences(stripStructural(raw)))

		const result =
			cleaned.length > MAX_QUERY_LENGTH
				? cleaned.slice(0, MAX_QUERY_LENGTH).trimEnd()
				: cleaned

		if (result.length === 0) {
			return yield* Effect.fail(
				new SanitizeInputError({
					detail: 'Query hanya mengandung instruksi yang tidak relevan dengan rekomendasi game',
				}),
			)
		}

		return result
	})

export const sanitizeTitle = (raw: string): Effect.Effect<string, SanitizeInputError> =>
	Effect.gen(function* () {
		const cleaned = stripStructural(removeInjectionSentences(stripStructural(raw)))

		const result =
			cleaned.length > MAX_TITLE_LENGTH
				? cleaned.slice(0, MAX_TITLE_LENGTH).trimEnd()
				: cleaned

		if (result.length === 0) {
			return yield* Effect.fail(
				new SanitizeInputError({
					detail: 'Judul game hanya mengandung instruksi yang tidak relevan',
				}),
			)
		}

		return result
	})
