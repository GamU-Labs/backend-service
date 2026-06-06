export function buildPrompt(inputGame: string, recommendations: ReadonlyArray<{ title: string; rating: string; similarity_score: number; tags_clean: string; desc_sentence: string }>): string {
	const recLines = recommendations
		.map(
			(r, i) =>
				`${i + 1}. ${r.title} (Rating: ${r.rating}, Similarity: ${r.similarity_score.toFixed(2)})\n   Tags: ${r.tags_clean}\n   Deskripsi: ${r.desc_sentence}`,
		)
		.join('\n')

	return (
		`Kamu adalah asisten rekomendasi game yang ramah dan informatif.\n\n` +
		`Pengguna menyukai game bernama "${inputGame}".\n` +
		`Sistem rekomendasi telah menemukan ${recommendations.length} game berikut yang mirip:\n\n` +
		`${recLines}\n\n` +
		`Tugasmu:\n` +
		`1. Berikan pengantar singkat mengapa game-game ini cocok untuk penggemar "${inputGame}".\n` +
		`2. Jelaskan masing-masing game secara ringkas dan menarik (1-2 kalimat per game).\n` +
		`3. Tutup dengan satu kalimat rekomendasi terbaik pilihan kamu.\n\n` +
		`Gunakan Bahasa Indonesia yang santai dan engaging.`
	)
}
