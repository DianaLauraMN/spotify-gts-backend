import Artist from "../../entities/artist/Artist";
import Track from "../../entities/track/Track";
import ArtistsRepository from "../../repositories/ArtistsRepository";
import typeManager from "../typeManager/instanceTM";

class GenreManager {
    
    getSpotifyGenresSeedsCopy() {
        return ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal", "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british", "cantopop", "chicago-house", "children", "chill", "classical", "club", "comedy", "country", "dance", "dancehall", "death-metal", "deep-house", "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep", "edm", "electro", "electronic", "emo", "folk", "forro", "french", "funk", "garage", "german", "gospel", "goth", "grindcore", "groove", "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm", "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin", "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore", "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera", "pagode", "party", "philippines-opm", "piano", "pop", "pop-film", "post-dubstep", "power-pop", "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad", "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish", "study", "summer", "swedish", "synth-pop", "tango", "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"];
    }

    isSpotifyGenre(genre: string): boolean {
        const genreFormatted = genre.toLowerCase().replace(/[^a-z]/g, '');
        const spotifyGenres = this.getSpotifyGenresSeedsCopy();
        return spotifyGenres.some(spotifyGenre => genreFormatted.includes(spotifyGenre.toLowerCase().replace(/[^a-z]/g, '')));
    }

    sortUserTopGenresSeeds(genresList: any[]): string[] {
        const genreCounts: Record<string, number> = {};
        const genresLoaded = this.getSpotifyGenresSeedsCopy();

        genresList.forEach((genre) => {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });

        //GENEROS QUE AUN NO ENTRAN EN SEEDS Y SON TOP GENEROS DEL USUARIO
        const allUserGenresSorted = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
        //GENEROS SEEDS (GENEROS PERMITIDOS DE SPOTIFY) ORDENADOS DE MAS ESCUCHADOS A MENOS ESCUCHADOS POR EL USUARIO
        const seedsGenresSorted = allUserGenresSorted.filter((genre: string) => genresLoaded.includes(genre));
        return seedsGenresSorted;
    }

    getUserTopGenresSeeds(userTopArtists: any[]): string[] {
        const artistsGenresLists = userTopArtists.map(artist => artist.genres); // top user generos con repeticiones
        const artistsGenresList = artistsGenresLists.flatMap(arr => arr); //combina todos los generos de dif arreglos en un solo arreglo de generos
        const sortedTopUserGenres = this.sortUserTopGenresSeeds(artistsGenresList);
        const transformedArray = sortedTopUserGenres.map((string) => {
            return typeManager.getStringCapitalized(string);
        });
        return transformedArray;
    }

    similarityScore(searchTerm: string, existantGenre: string) {
        const searchTermLowerCase = searchTerm.toLowerCase();
        const existantGenreLowerCase = existantGenre.toLowerCase();
        let similarityScore = 0;

        for (let i = 0; i < searchTermLowerCase.length; i++) {
            if (existantGenreLowerCase.startsWith(searchTermLowerCase.slice(0, i + 1))) {
                similarityScore = i + 1;
            }
        }

        return similarityScore;
    }

    async filterTracksBySpotifyGenre(access_token: string, tracks: Track[]): Promise<Track[]> {
        const validTracks: Track[] = [];

        await Promise.all(tracks.map(async (track) => {
            const { artists } = track;

            if (artists?.length > 0) {
                const artistPromises = artists.map(async (artist) => {
                    const { id } = artist;
                    const artistsRepository = new ArtistsRepository();
                    const artistTyped: Artist = await artistsRepository.getArtistById(access_token, id);

                    if (artistTyped) {
                        const { genres } = artistTyped;

                        if (genres?.some(genre => this.isSpotifyGenre(genre))) {
                            validTracks.push(track);
                        }
                    }
                });

                await Promise.all(artistPromises);
            }
        }));

        return validTracks;
    }
}

export default GenreManager;