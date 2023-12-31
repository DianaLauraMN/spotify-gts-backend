import axios from "axios";
import { getArtistsListTyped, getTypedArtistsByName, loadTopArtists } from "../controller/api/ApiSpotifyArtistsController";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import Artist from "../entities/artist/Artist";

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
            const tracksByName = await getTypedItemTracksByType('track', itemName, 50, access_token);
            return tracksByName;
        } catch (error) {
            console.log("Error while getting Tracks by its name");
            console.log(error);
        }
    }

    async getUserTopTracks(access_token: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const userTopTracks = await loadTopTracks(access_token);
            const userTopTracksTyped = getTracksListsTyped(userTopTracks);
            return userTopTracksTyped;
        } catch (error) {
            console.log("Error while getting user Top Tracks");
            console.log(error);
        }
    }

    async getUserSavedTracks(access_token: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: { 'Authorization': access_token },
                params: {
                    market: 'ES',
                    limit: 50,
                    offset: 0,
                }
            });
            const userSavedTracks = savedTracksResponse.data.items.map((item: { track: any; }) => item.track);
            const userSavedTracksTyped = getTracksListsTyped(userSavedTracks);
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
            const allTracksTyped = await getPlaylistsTracksTyped(playlistsId, access_token);
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
            const artistTopTracksTyped = getTracksListsTyped(artistTopTracksResponse.data.tracks);
            return artistTopTracksTyped;
        } catch (error) {
            console.log('Error while getting Top Tracks by the Artists: ' + itemName);
            console.log(error);
        }
    }

    async getArtistAllTracks(access_token: string | undefined, artistName: string): Promise<Track[] | undefined> {
        try {
            const allArtistTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': access_token },
                params: {
                    q: `artist:"${artistName}"`,
                    type: 'track',
                    limit: 50,
                    offset: 0,
                }
            });
            const artistTracksTyped = getTracksListsTyped(allArtistTracksResponse.data.tracks.items);
            return artistTracksTyped;
        } catch (error) {
            console.log('Error while getting Tracks by the Artists: ' + artistName);
            console.log(error);
        }
    }

    async getUserRecommendations(access_token: string | undefined) {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const topArtists = await loadTopArtists(10, access_token);
            const topTracks = await loadTopTracks(access_token);
            const topGenres = await getUserTopGenresSeeds(topArtists, access_token);

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

            const artistRecommendationsTyped = getTracksListsTyped(artistRecommendations.tracks);
            const genresRecommendationsTyped = getTracksListsTyped(genresRecommendations.tracks);
            const tracksRecommendationsTyped = getTracksListsTyped(tracksRecommendationS.tracks);

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
            const userTopArtists = await loadTopArtists(3, access_token);
            const userTopGenres = await getUserTopGenresSeeds(userTopArtists, access_token);

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

    async getTracksByGenre(access_token: string, genreName: string): Promise<Track[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const genreTracks = await getTypedItemTracksByType('playlist', genreName, 1, access_token);
            const genreTracksLimited = genreTracks.slice(0, 15);
            return genreTracksLimited;
        } catch (error) {
            console.log('Error while getting tracks by genre ' + genreName);
            console.log(error);
        }
    }


    async getUserTopGenres(access_token: string | undefined): Promise<string[] | undefined> {
        try {
            if (!access_token) throw console.error('Error, token expected');
            const topArtistsList = await loadTopArtists(10, access_token);
            const topArtists = getArtistsListTyped(topArtistsList);
            const sortedTopUserGenres = await getUserTopGenresSeeds(topArtists, access_token);
            return sortedTopUserGenres;
        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
    }

}

async function getUserTopGenresSeeds(userTopArtists: any[], access_token: string): Promise<string[]> {
    const artistsGenresLists = userTopArtists.map(artist => artist.genres); // top user generos con repeticiones
    const artistsGenresList = artistsGenresLists.flatMap(arr => arr); //combina todos los generos de dif arreglos en un solo arreglo de generos
    const sortedTopUserGenres = await sortUserTopGenresSeeds(artistsGenresList, access_token);
    const transformedArray = sortedTopUserGenres.map((string) => {
        return formatString(string);
    });
    return transformedArray;
}

function formatString(text: string): string {
    const lowercaseString = text.toLowerCase();
    const capitalizedString = lowercaseString.charAt(0).toUpperCase() + lowercaseString.slice(1);
    return capitalizedString;
}

async function sortUserTopGenresSeeds(genresList: any[], access_token: string): Promise<string[]> {
    const genreCounts: Record<string, number> = {};
    const genresLoaded = await loadAllGenres(access_token);

    genresList.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });

    //GENEROS QUE AUN NO ENTRAN EN SEEDS Y SON TOP GENEROS DEL USUARIO
    const allUserGenresSorted = Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
    //GENEROS SEEDS (GENEROS PERMITIDOS DE SPOTIFY) ORDENADOS DE MAS ESCUCHADOS A MENOS ESCUCHADOS POR EL USUARIO
    const seedsGenresSorted = allUserGenresSorted.filter((genre: string) => genresLoaded.includes(genre));
    return seedsGenresSorted;
}

function validateItemsType(arr: Track[] | Artist[] | undefined, type: string): boolean {
    let isValid = false;
    switch (type) {
        case 'track':

            isValid = true;
            break;
        case 'artist':

            isValid = true;
            break;
    }
    return isValid;

}
export async function getTypedItemTracksByType(type: string, itemName: string, limit: number, access_token: string): Promise<Track[] | undefined> {
    let itemsMapped: any[''];
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
            if (type === 'track') {
                itemsMapped = getTracksListsTyped(itemResponse.data.tracks.items);
            } else if (type === 'playlist') {
                const playlistsId = itemResponse.data.playlists.items.map((playlist: { id: any }) => playlist.id);
                itemsMapped = await getPlaylistsTracksTyped(playlistsId, access_token);
            }
            return itemsMapped;
        }
    } catch (error) {
        console.log(`Error while getting ${type}:` + itemName);
        console.log(error);
    }
}

function getTracksListsTyped(items: any[]): Track[] {
    let typedTracks: Track[] = [];
    if (items) {
        typedTracks = items.map(item => TrackAdapter.adaptTrack(item));
    }
    return typedTracks;
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

async function loadTopTracks(access_token: string) {
    try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50&offset=0`, {
            headers: { 'Authorization': access_token }
        });
        return topTracksResponse.data.items;
    } catch (error) {
        console.log("Error while loading Top User Tracks");
        console.log(error);
    }
}

async function loadAllGenres(access_token: string) {
    ///let generesSeeds;
    // try {
    //     const genresSeedsResponse = await axios.get(`https://api.spotify.com/v1/recommendations/available-genre-seeds`, {
    //         headers: { 'Authorization': access_token }
    //     });

    //     if (genresSeedsResponse.data.genres) {
    //         generesSeeds = genresSeedsResponse.data.genres;
    //     }
    // } catch (error) {
    //     generesSeeds = getGenresSeedsCppySpotify().genres;
    // }
    // return generesSeeds;
    return getGenresSeedsCppySpotify().genres;
}

async function getPlaylistsTracksTyped(playlistsId: any[], access_token: string): Promise<Track[]> {
    try {
        const allTracks: any[] = [];
        const promises = playlistsId.map(async (playlistIterador) => {
            const id = playlistIterador;
            const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
                headers: { 'Authorization': access_token }, params: {
                    market: 'ES',
                    fields: 'fields=tracks.items(track(name,href,album(name,href)))',
                }
            });
            const tracks = playlistsResponse.data.tracks.items.map((item: { track: any }) => item.track);
            allTracks.push(...tracks);
        });
        await Promise.all(promises);
        const allTracksTyped = getTracksListsTyped(allTracks);
        return allTracksTyped;
    } catch (error) {
        console.log('Error while getting all tracks of the playlist');
        console.log(error);
        throw error;
    }
}

function getGenresSeedsCppySpotify() {
    return { "genres": ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient", "anime", "black-metal", "bluegrass", "blues", "bossanova", "brazil", "breakbeat", "british", "cantopop", "chicago-house", "children", "chill", "classical", "club", "comedy", "country", "dance", "dancehall", "death-metal", "deep-house", "detroit-techno", "disco", "disney", "drum-and-bass", "dub", "dubstep", "edm", "electro", "electronic", "emo", "folk", "forro", "french", "funk", "garage", "german", "gospel", "goth", "grindcore", "groove", "grunge", "guitar", "happy", "hard-rock", "hardcore", "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk", "house", "idm", "indian", "indie", "indie-pop", "industrial", "iranian", "j-dance", "j-idol", "j-pop", "j-rock", "jazz", "k-pop", "kids", "latin", "latino", "malay", "mandopop", "metal", "metal-misc", "metalcore", "minimal-techno", "movies", "mpb", "new-age", "new-release", "opera", "pagode", "party", "philippines-opm", "piano", "pop", "pop-film", "post-dubstep", "power-pop", "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b", "rainy-day", "reggae", "reggaeton", "road-trip", "rock", "rock-n-roll", "rockabilly", "romance", "sad", "salsa", "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska", "sleep", "songwriter", "soul", "soundtracks", "spanish", "study", "summer", "swedish", "synth-pop", "tango", "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"] };
}

function getSubsetArray(arr: any[], size: number): any[] {
    return arr.length >= size ? arr.slice(0, size) : arr;
}

export default TracksRepository;