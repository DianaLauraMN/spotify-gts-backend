import axios from "axios";
import { getArtistsListTyped, getTypedArtistsByName, loadTopArtists } from "../controller/api/ApiSpotifyArtistsController";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import Artist from "../entities/artist/Artist";

class TracksRepository {

    async getTrackById(superToken: string | undefined, trackId: string): Promise<Track | undefined> {
        try {
            const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': superToken }
            });
            const track: Track = TrackAdapter.adaptTrack(trackResponse.data);
            return track;
        } catch (error) {
            console.log("Error while getting Track by Id");
            console.log(error);
        }
    }

    async getTracksByName(superToken: string | undefined, itemName: string): Promise<Track[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const tracksByName = await getTypedItemTracksByType('track', itemName, 50, superToken);
            return tracksByName;
        } catch (error) {
            console.log("Error while getting Tracks by its name");
            console.log(error);
        }
    }

    async getUserTopTracks(superToken: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const userTopTracks = await loadTopTracks(superToken);
            const userTopTracksTyped = getTracksListsTyped(userTopTracks);
            return userTopTracksTyped;
        } catch (error) {
            console.log("Error while getting user Top Tracks");
            console.log(error);
        }
    }

    async getUserSavedTracks(superToken: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: { 'Authorization': superToken },
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

    async getUserPlaylistsTracks(superToken: string | undefined): Promise<Track[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: { 'Authorization': superToken },
                params: {
                    limit: 50,
                    offset: 0,
                }
            });
            const playlistsId = playlistsResponse.data.items.map((playlist: { id: any }) => playlist.id);
            const allTracksTyped = await getPlaylistsTracksTyped(playlistsId, superToken);
            return allTracksTyped;
        } catch (error) {
            console.log('Error while getting current user Playlists (owned and followed)');
            console.log(error);
        }
    }

    async getArtistTopTracks(superToken: string | undefined, itemName: string): Promise<Track[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const artists = await getTypedArtistsByName(itemName, 50, superToken);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());
            const artistTopTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: { 'Authorization': superToken },
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

    async getArtistAllTracks(superToken: string | undefined, artistName: string): Promise<Track[] | undefined> {
        try {
            const allArtistTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': superToken },
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

    async getUserRecommendations(superToken: string | undefined) {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtists = await loadTopArtists(10, superToken);
            const topTracks = await loadTopTracks(superToken);
            const topGenres = await getUserTopGenresSeeds(topArtists, superToken);

            const topFiveArtist = getSubsetArray(topArtists, 5);
            const topFiveTracks = getSubsetArray(topTracks, 5);
            const topFiveGenres = getSubsetArray(topGenres, 5);

            const topFiveArtistsId = topFiveArtist.map(item => item.id);
            const topFiveTracksId = topFiveTracks.map(item => item.id);

            const commaSeparatedArtistsIds = topFiveArtistsId.join(',');
            const commaSeparatedTracksIds = topFiveTracksId.join(',');
            const commaSeparatedGenresIds = topFiveGenres.join(',');

            const artistRecommendations = await getItemRecommendations('artist', commaSeparatedArtistsIds, 20, superToken);
            const genresRecommendations = await getItemRecommendations('genres', commaSeparatedGenresIds, 20, superToken);
            const tracksRecommendationS = await getItemRecommendations('tracks', commaSeparatedTracksIds, 20, superToken);

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


    async getUserTopGenresTracks(superToken: string | undefined): Promise<Track[] | undefined> {
        let userTopGenresTracks: Track[] = [];
        try {
            if (!superToken) throw console.error('Error, token expected');
            const userTopArtists = await loadTopArtists(10, superToken);
            const userTopGenres = await getUserTopGenresSeeds(userTopArtists, superToken);

            for (const genre of userTopGenres) {
                const genreTracksTyped = await this.getTracksByGenre(superToken, genre);
                userTopGenresTracks.push(...genreTracksTyped);
            }

            return userTopGenresTracks;
        } catch (error) {
            console.log('Error while getting Tracks by user Top Genres');
            console.log(error);
        }
    }

    async getTracksByGenre(superToken: string, genreName: string): Promise<Track[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const genreTracks = await getTypedItemTracksByType('playlist', genreName, 1, superToken);
            const genreTracksLimited = genreTracks.slice(0, 15);
            return genreTracksLimited;
        } catch (error) {
            console.log('Error while getting tracks by genre ' + genreName);
            console.log(error);
        }
    }


    async getUserTopGenres(superToken: string | undefined): Promise<string[] | undefined> {
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtistsList = await loadTopArtists(10, superToken);
            const topArtists = getArtistsListTyped(topArtistsList);
            const sortedTopUserGenres = await getUserTopGenresSeeds(topArtists, superToken);
            return sortedTopUserGenres;
        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
    }

}

async function getUserTopGenresSeeds(userTopArtists: any[], superToken: string): Promise<string[]> {
    const artistsGenresLists = userTopArtists.map(artist => artist.genres); // top user generos con repeticiones
    const artistsGenresList = artistsGenresLists.flatMap(arr => arr); //combina todos los generos de dif arreglos en un solo arreglo de generos
    const sortedTopUserGenres = await sortUserTopGenresSeeds(artistsGenresList, superToken);
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

async function sortUserTopGenresSeeds(genresList: any[], superToken: string): Promise<string[]> {
    const genreCounts: Record<string, number> = {};
    const genresLoaded = await loadAllGenres(superToken);

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
export async function getTypedItemTracksByType(type: string, itemName: string, limit: number, superToken: string): Promise<Track[] | undefined> {
    let itemsMapped: any[''];
    try {
        const itemResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { 'Authorization': superToken },
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
                itemsMapped = await getPlaylistsTracksTyped(playlistsId, superToken);
            }
            return itemsMapped;
        }
    } catch (error) {
        console.log(`Error while getting ${type}:` + itemName);
        console.log(error);
    }
}

function getTracksListsTyped(items: any[]): Track[] {
    const typedTracks: Track[] = items.map(item => TrackAdapter.adaptTrack(item));
    return typedTracks;
}

async function getItemRecommendations(type: string, itemList: string, limit: number, superToken: string) {
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
            headers: { 'Authorization': superToken },
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

async function loadTopTracks(superToken: string) {
    try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50&offset=0`, {
            headers: { 'Authorization': superToken }
        });
        return topTracksResponse.data.items;
    } catch (error) {
        console.log("Error while loading Top User Tracks");
        console.log(error);
    }
}

async function loadAllGenres(superToken: string) {
    try {
        const genresSeedsResponse = await axios.get(`https://api.spotify.com/v1/recommendations/available-genre-seeds`, {
            headers: { 'Authorization': superToken }
        });
        return genresSeedsResponse.data.genres;
    } catch (error) {
        console.log("Error while loading genres seeds");
        console.log(error);
    }
}

async function getPlaylistsTracksTyped(playlistsId: any[], superToken: string): Promise<Track[]> {
    try {
        const allTracks: any[] = [];
        const promises = playlistsId.map(async (playlistIterador) => {
            const id = playlistIterador;
            const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
                headers: { 'Authorization': superToken }, params: {
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

function getSubsetArray(arr: any[], size: number): any[] {
    return arr.length >= size ? arr.slice(0, size) : arr;
}

export default TracksRepository;