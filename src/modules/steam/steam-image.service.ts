import { Context, Effect, Layer } from 'effect'
import { SqlClient } from '@effect/sql/SqlClient'
import { SqlError } from '@effect/sql/SqlError'

import type { SimilarityEntry } from '../../data/games.js'
import { SteamImageError } from '../../lib/errors.js'

export interface SteamImageResult {
	readonly header_image: string
}

export interface SteamImageService {
	readonly getImages: (
		recommendations: ReadonlyArray<SimilarityEntry>,
	) => Effect.Effect<ReadonlyMap<number, SteamImageResult>, SteamImageError | SqlError>
}

export const SteamImageService = Context.GenericTag<SteamImageService>('SteamImageService')

const STEAM_API_BASE = 'https://store.steampowered.com/api/appdetails'

interface SteamAppDetailsResponse {
	success: boolean
	data?: {
		name?: string
		header_image?: string
	}
}

interface FetchedImage {
	readonly appId: number
	readonly result: SteamImageResult
}

const fetchFromSteamApi = (appId: number): Effect.Effect<FetchedImage, SteamImageError> =>
	Effect.gen(function* () {
		const url = `${STEAM_API_BASE}?appids=${appId}&cc=us`

		const response = yield* Effect.tryPromise({
			try: () => fetch(url),
			catch: (e) =>
				new SteamImageError({
					message: `Gagal fetch Steam API: ${(e as Error).message}`,
					appId,
				}),
		})

		if (!response.ok) {
			return yield* Effect.fail(
				new SteamImageError({
					message: `Steam API returned ${response.status}`,
					appId,
				}),
			)
		}

		const json = yield* Effect.tryPromise({
			try: () => response.json() as Promise<Record<string, SteamAppDetailsResponse>>,
			catch: (e) =>
				new SteamImageError({
					message: `Gagal parse Steam API response: ${(e as Error).message}`,
					appId,
				}),
		})

		const appData = json[String(appId)]

		if (!appData?.success || !appData?.data?.header_image) {
			return yield* Effect.fail(
				new SteamImageError({
					message: `Game ${appId} tidak ditemukan di Steam`,
					appId,
				}),
			)
		}

		return { appId, result: { header_image: appData.data.header_image } }
	})

const fallbackImage = (appId: number): FetchedImage => ({
	appId,
	result: { header_image: '' },
})

export const SteamImageServiceLive: Layer.Layer<SteamImageService, SqlError, SqlClient> =
	Layer.effect(
		SteamImageService,
		Effect.gen(function* () {
			const sql = yield* SqlClient

			yield* sql`
			CREATE TABLE IF NOT EXISTS game_images (
				app_id INTEGER PRIMARY KEY,
				name TEXT,
				header_image TEXT NOT NULL,
				updated_at INTEGER NOT NULL
			)
		`

			const getImages: SteamImageService['getImages'] = (
				recommendations: ReadonlyArray<SimilarityEntry>,
			) =>
				Effect.gen(function* () {
					if (recommendations.length === 0) {
						return new Map<number, SteamImageResult>()
					}

					const appIds = recommendations.map((r) => r.app_id)
					const cachedRows = yield* sql`
					SELECT app_id, header_image FROM game_images WHERE app_id IN (${appIds})
				`

					const cached = new Map<number, SteamImageResult>()
					for (const row of cachedRows) {
						cached.set(row.app_id as number, {
							header_image: row.header_image as string,
						})
					}

					const missing = appIds.filter((id) => !cached.has(id))

					if (missing.length === 0) {
						return cached
					}

					const fetched = yield* Effect.all(
						missing.map((appId) =>
							Effect.catchAll(fetchFromSteamApi(appId), () =>
								Effect.succeed(fallbackImage(appId)),
							),
						),
						{ concurrency: 3 },
					)

					const now = Date.now()
					yield* Effect.all(
						fetched
							.filter((f) => f.result.header_image !== '')
							.map(
								(f) =>
									sql`
								INSERT OR REPLACE INTO game_images (app_id, name, header_image, updated_at)
								VALUES (${f.appId}, '', ${f.result.header_image}, ${now})
							`,
							),
						{ concurrency: 5 },
					)

					for (const f of fetched) {
						cached.set(f.appId, f.result)
					}

					return cached
				})

			return { getImages }
		}),
	)
