const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function fetchCelebDetails(tmdbId) {
  if (!TMDB_API_KEY) return {};
  try {
    const [personRes, creditsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${tmdbId}?api_key=${TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/person/${tmdbId}/combined_credits?api_key=${TMDB_API_KEY}`),
    ]);
    const person = await personRes.json();
    const credits = await creditsRes.json();

    // Top cast credits sorted by popularity, deduplicated by title
    const allWork = [...(credits.cast || [])].sort((a, b) => b.popularity - a.popularity);
    const seen = new Set();
    const knownFor = [];
    for (const item of allWork) {
      const title = item.title || item.name;
      if (!title || seen.has(title)) continue;
      seen.add(title);
      knownFor.push({
        title,
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : null,
        character: item.character || '',
        type: item.media_type || 'movie',
      });
      if (knownFor.length >= 6) break;
    }

    return {
      biography: person.biography || '',
      birthday: person.birthday || null,
      deathday: person.deathday || null,
      placeOfBirth: person.place_of_birth || null,
      alsoKnownAs: (person.also_known_as || []).slice(0, 5),
      knownForDepartment: person.known_for_department || '',
      gender: person.gender ?? null,
      profileImage: person.profile_path
        ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
        : null,
      knownFor,
      imdbId: person.imdb_id || null,
    };
  } catch {
    return {};
  }
}
