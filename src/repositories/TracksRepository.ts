import axios from "axios";
import { getArtistsListTyped, getTypedArtistsByName, loadTopArtists } from "../controller/api/ApiSpotifyArtistsController";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import Artist from "../entities/artist/Artist";
import { TimeRange } from "../enums/TimeRange";
import TypeManager from "../typeManager/typeManager";
import PlaylistManager from "../controller/levelsLogic/PlaylistManager";

class TracksRepository {

    async getTrackById(access_token: string | undefined, trackId: string): Promise<Track | undefined> {
        try {
            const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': access_token }
            });
            const track: Track = TrackAdapter.adaptTrack(trackResponse.data);
            return track;
        } catch (error) {
            console.log("Error while getting Track by Id");
            console.log(error);
        }
    }

    async getTracksByName(access_token: string | undefined, itemName: string): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const tracksByName = await this.getTracksTyped('track', itemName, 50, access_token);
            return tracksByName;
        } catch (error) {
            console.log("Error while getting Tracks by its name");
            console.log(error);
        }
    }

    async getUserTopTracks(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const userTopTracks = await loadUserTopTracks(access_token, offset, limit, time_range);
            const typeManager = new TypeManager();
            const userTopTracksTyped = typeManager.typeTrackList(userTopTracks);
            return userTopTracksTyped;
        } catch (error) {
            console.log("Error while getting user Top Tracks");
            console.log(error);
        }
    }

    async getUserSavedTracks(access_token: string | undefined, offset: number, limit: number): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: { 'Authorization': access_token },
                params: {
                    market: 'ES',
                    limit,
                    offset,
                }
            });
            const userSavedTracks = savedTracksResponse.data.items.map((item: { track: any; }) => item.track);
            const typeManager = new TypeManager();
            const userSavedTracksTyped = typeManager.typeTrackList(userSavedTracks);
            return userSavedTracksTyped;
        } catch (error) {
            console.log('Error while getting user Saved Tracks');
            console.log(error);
        }
    }

    async getUserPlaylistsTracks(access_token: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: { 'Authorization': access_token },
                params: {
                    limit: 50,
                    offset: 0,
                }
            });
            const playlistsId = playlistsResponse.data.items.map((playlist: { id: any }) => playlist.id);
            // const allTracksTyped = await getPlaylistsTracksTyped(playlistsId, access_token);
            const allTracksTyped = await this.getPlaylistsTracksTyped(playlistsId, access_token);
            return allTracksTyped;
        } catch (error) {
            console.log('Error while getting current user Playlists (owned and followed)');
            console.log(error);
        }
    }

    async getArtistTopTracks(access_token: string | undefined, itemName: string): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const artists = await getTypedArtistsByName(itemName, 50, access_token);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());
            const artistTopTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: { 'Authorization': access_token },
                params: {
                    market: 'ES',
                }
            });
            const typeManager = new TypeManager();
            const artistTopTracksTyped = typeManager.typeTrackList(artistTopTracksResponse.data.tracks);
            return artistTopTracksTyped;
        } catch (error) {
            console.log('Error while getting Top Tracks by the Artists: ' + itemName);
            console.log(error);
        }
    }

    async getArtistAllTracks(access_token: string | undefined, artistName: string, offset: number, limit: number): Promise<Track[] | undefined> {
        try {
            const allArtistTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': access_token },
                params: {
                    q: `artist:${artistName}`,
                    type: 'track',
                    limit,
                    offset,
                }
            });
            const typeManager = new TypeManager();
            const artistTracksTyped = typeManager.typeTrackList(allArtistTracksResponse.data.tracks.items);
            return artistTracksTyped;
        } catch (error) {
            console.log('Error while getting Tracks by the Artists: ' + artistName);
            console.log(error);
        }
    }

    async getUserRecommendations(access_token: string | undefined, offset: number, limit: number, time_range: TimeRange): Promise<Track[]> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const topArtists = await loadTopArtists(0, 10, access_token);
            const topTracks = await loadUserTopTracks(access_token, offset, limit, time_range);
            const topGenres = this.getUserTopGenresSeeds(topArtists);

            const topFiveArtist = getSubsetArray(topArtists, 5);
            const topFiveTracks = getSubsetArray(topTracks, 5);
            const topFiveGenres = getSubsetArray(topGenres, 5);

            const topFiveArtistsId = topFiveArtist.map(item => item.id);
            const topFiveTracksId = topFiveTracks.map(item => item.id);

            const commaSeparatedArtistsIds = topFiveArtistsId.join(',');
            const commaSeparatedTracksIds = topFiveTracksId.join(',');
            const commaSeparatedGenresIds = topFiveGenres.join(',');

            const artistRecommendations = await getItemRecommendations('artist', commaSeparatedArtistsIds, 20, access_token);
            const genresRecommendations = await getItemRecommendations('genres', commaSeparatedGenresIds, 20, access_token);
            const tracksRecommendationS = await getItemRecommendations('tracks', commaSeparatedTracksIds, 20, access_token);

            const typeManager = new TypeManager();
            const artistRecommendationsTyped = typeManager.typeTrackList(artistRecommendations.tracks);
            const genresRecommendationsTyped = typeManager.typeTrackList(genresRecommendations.tracks);
            const tracksRecommendationsTyped = typeManager.typeTrackList(tracksRecommendationS.tracks);

            const allRecommendationsTyped = [...artistRecommendationsTyped, ...tracksRecommendationsTyped, ...genresRecommendationsTyped];
            return allRecommendationsTyped;
        } catch (error) {
            console.log('Error while getting Spotify Recommendations for the current user');
            console.log(error);
        }
    }


    async getUserTopGenresTracks(access_token: string | undefined): Promise<Track[] | undefined> {
        let userTopGenresTracks: Track[] = [];
        try {
            if (!access_token) throw console.error('Error, token expected');
            const userTopArtists = await loadTopArtists(0, 3, access_token);
            const userTopGenres = this.getUserTopGenresSeeds(userTopArtists);

            for (const genre of userTopGenres) {
                const genreTracksTyped = await this.getTracksByGenre(access_token, genre);
                userTopGenresTracks.push(...genreTracksTyped);
            }
            return userTopGenresTracks;
        } catch (error) {
            console.log('Error while getting Tracks by user Top Genres');
            console.log(error);
        }
    }

    async getTracksByGenre(access_token: string, genreName: string): Promise<Track[]> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            let genreTracks = await this.getTracksTyped('playlist', genreName, 3, access_token);

            if (genreTracks !== undefined) {
                const playlistManager = new PlaylistManager();
                genreTracks = playlistManager.shuffleTracksByFisherYates(genreTracks);

                this.filterTracksBySpotifyGenre(genreTracks);

                const genreTracksLimited = genreTracks.slice(0, 50);
                return genreTracksLimited;
            }
        } catch (error) {
            console.log('Error while getting tracks by genre ' + genreName);
            console.log(error);
        }
    }

    async getTracksTyped(type: string, itemName: string, limit: number, access_token: string): Promise<Track[] | undefined> {
        let itemsMapped: any[''];
        const typeManager = new TypeManager();
        try {
            const itemResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': access_token },
                params: {
                    q: itemName,
                    type: type,
                    market: 'ES',
                    limit: limit,
                    offset: 0,
                }
            });
            if (itemResponse && itemResponse.data) {
                if (type === 'track' && itemResponse.data.tracks.items) {
                    itemsMapped = typeManager.typeTrackList(itemResponse.data.tracks.items);
                } else if (type === 'playlist' && itemResponse.data.playlists.items) {
                    const playlistsId = itemResponse.data.playlists.items.map((playlist: { id: string }) => playlist.id);
                    itemsMapped = await this.getPlaylistsTracksTyped(playlistsId, access_token);
                }
                return itemsMapped;
            }
        } catch (error) {
            console.log(`Error while getting ${type}:` + itemName);
            console.log(error);
        }
    }

    async getPlaylistAllTracks(access_token: string | undefined, playlistId: string): Promise<Track[]> {
        try {
            let allPlaylistTracks: Track[];
            const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: { 'Authorization': access_token },
                params: { market: 'ES,US,MX' }
            });
            if (playlistsResponse && playlistsResponse.data.tracks && playlistsResponse.data.tracks.items) {
                const arr: any[] = playlistsResponse.data.tracks.items;
                arr.forEach(item => {
                    const { track } = item;
                    console.log(track);
                    allPlaylistTracks.push(TrackAdapter.adaptTrack(track));
                });
            }
            if (allPlaylistTracks.length > 0) {
                return allPlaylistTracks;
            }
        } catch (error) {
            console.log('Error while getting playlist ' + playlistId + ' all Tracks');
            console.log(error);
        }
    }

    async getPlaylistsTracksTyped(playlistsId: string[], access_token: string): Promise<Track[]> {
        try {
            const allTracks: Track[] = [];
            for (const playlistId of playlistsId) {
                try {
                    const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                        headers: { 'Authorization': access_token },
                        params: { market: 'ES' }
                    });

                    if (playlistsResponse && playlistsResponse.data && playlistsResponse.data.tracks) {
                        const playlistTracks: Track[] = playlistsResponse.data.tracks.items.map((item: any) => item.track);
                        allTracks.push(...playlistTracks);
                    }
                } catch (error) {
                    console.error(`Error obteniendo tracks para la playlist ${playlistId}:`, error);
                }
            }

            if (allTracks.length > 0) {
                const allTracksTyped: Track[] = this.getValidTracks(allTracks);
                if (allTracksTyped.length > 0) {
                    return allTracksTyped;
                }
            }
            return allTracks;
        } catch (error) {
            console.log(error);
        }
    }


    getValidTracks(tracks: any[]): Track[] {
        const validTracks = tracks.filter((track: { id?: string | null }) => track && track.id !== null);
        const typeManager = new TypeManager();
        const allTracksTyped: Track[] = typeManager.typeTrackList(validTracks);

        return allTracksTyped.length > 0 ? allTracksTyped : [];
    }

    getSpotifyGenresSeedsCopy() {
        return ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal", "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british", "cantopop", "chicago-house", "children", "chill", "classical", "club", "comedy", "country", "dance", "dancehall", "death-metal", "deep-house", "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep", "edm", "electro", "electronic", "emo", "folk", "forro", "french", "funk", "garage", "german", "gospel", "goth", "grindcore", "groove", "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm", "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin", "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore", "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera", "pagode", "party", "philippines-opm", "piano", "pop", "pop-film", "post-dubstep", "power-pop", "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad", "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish", "study", "summer", "swedish", "synth-pop", "tango", "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"];
    }

    isSpotifyGenre(genre: string): boolean {
        const genreFormatted = genre.toLowerCase().replace(/[^a-z]/g, '');
        const spotifyGenres = this.getSpotifyGenresSeedsCopy();

        return spotifyGenres.map(spotifyGenre => spotifyGenre.toLowerCase().replace(/[^a-z]/g, '')).includes(genreFormatted);
    }

    filterTracksBySpotifyGenre(tracks: Track[]): Track[] {

        tracks.forEach(track => {
            const { artists } = track;
            if (artists?.length > 0) {

                artists.forEach(artist => {
                    const { id, genres } = artist;

                    console.log('Artista: ' + artist.name);

                    //BUSCAR ARTISTA POR ID REFACTOR para obtener de ese nuevo objeto Artist ,los generos del artista y poder comparar

                    if (genres?.length > 0) {
                        genres.forEach(genre => {
                            const isInSeeds = this.isSpotifyGenre(genre);
                            console.log(`¿${genre} está en las semillas? ${isInSeeds ? 'Sí' : 'No'}`);
                        });
                    } else {
                        console.log('genres empty');
                        console.log('id: ' + id);

                    }

                })
            } else {
                console.log("artists empty");

            }
        });

        return
    }

    getGenresByName(genre: string) {
        const searchTerm = genre.toLowerCase();
        const genres = this.getSpotifyGenresSeedsCopy();
        const suggestions = genres.filter(genre => genre.toLowerCase().includes(searchTerm));
        return suggestions.sort((a, b) => this.similarityScore(searchTerm, b) - this.similarityScore(searchTerm, a));
    }

    async getUserTopGenres(access_token: string | undefined): Promise<string[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const topArtistsList = await loadTopArtists(0, 10, access_token);
            const topArtists = getArtistsListTyped(topArtistsList);
            const sortedTopUserGenres = this.getUserTopGenresSeeds(topArtists);
            return sortedTopUserGenres;
        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
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
        const typeManager = new TypeManager();
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

}












async function getItemRecommendations(type: string, itemList: string, limit: number, access_token: string) {
    let seedArtist = "";
    let seedGenres = "";
    let seedTracks = "";
    try {
        if (type === 'artist') {
            seedArtist = itemList;
        } else if (type === 'genres') {
            seedGenres = itemList;
        } else if (type === 'tracks') {
            seedTracks = itemList;
        }
        const recommendationsResponse = await axios.get('https://api.spotify.com/v1/recommendations', {
            headers: { 'Authorization': access_token },
            params: {
                limit: limit,
                market: 'ES',
                seed_artists: seedArtist,
                seed_genres: seedGenres,
                seed_tracks: seedTracks,
            }
        });
        return recommendationsResponse.data;
    } catch (error) {
        console.log('Error while getting Spotify Recommendations for the current user');
        console.log(error);
    }
}

async function loadUserTopTracks(access_token: string, offset: number, limit: number, time_range: TimeRange) {
    try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${limit}&offset=${offset}`, {
            headers: { 'Authorization': access_token }
        });
        return topTracksResponse.data.items;
    } catch (error) {
        console.log("Error while loading Top User Tracks");
        console.log(error);
    }
}

// export async function loadAllGenres(access_token: string) {
//     ///let generesSeeds;
//     // try {
//     //     const genresSeedsResponse = await axios.get(`https://api.spotify.com/v1/recommendations/available-genre-seeds`, {
//     //         headers: { 'Authorization': access_token }
//     //     });

//     //     if (genresSeedsResponse.data.genres) {
//     //         generesSeeds = genresSeedsResponse.data.genres;
//     //     }
//     // } catch (error) {
//     //     generesSeeds = getGenresSeedsCppySpotify().genres;
//     // }
//     // return generesSeeds;
//     return getGenresSeedsCopySpotify().genres;
// }



function getSubsetArray(arr: any[], size: number): any[] {
    return arr.length >= size ? arr.slice(0, size) : arr;
}



export function getTimeRange(time_range: string): TimeRange | undefined {
    switch (time_range) {
        case 'long_term':
            return TimeRange.long_term;
        case 'medium_term':
            return TimeRange.medium_term;
        case 'short_term':
            return TimeRange.short_term;
        default:
            return undefined;
    }
}

export default TracksRepository;