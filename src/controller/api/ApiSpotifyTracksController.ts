import axios from "axios";
import { Request, Response } from "express";
import Track from "../../entities/track/Track";
import TrackAdapter from "../../entities/track/TrackAdapter";
import Artist from "../../entities/artist/Artist";
import ArtistAdapter from "../../entities/artist/ArtistAdapter";
import { ApiTracksInterface } from "../../interfaces/ApiTracks.interface";
import TracksRepository from "../../repositories/TracksRepository";
import { getArtistsListTyped, loadTopArtists } from "./ApiSpotifyArtistsController";


class ApiTracksController implements ApiTracksInterface {

    async getTrackById(req: Request, res: Response) {
        const trackId = req.params.trackId;
        const superToken = req.headers.authorization;
        try {
            const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': superToken }
            });
            const track: Track = TrackAdapter.adaptTrack(trackResponse.data);
            res.json(track);
        } catch (error) {
            console.log("Error while getting Track by Id");
            console.log(error);
        }
    }

    async getTracksByName(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const tracks = await getTypedItemByType('track', itemName, 50, superToken);
            res.json(tracks);
        } catch (error) {
            console.log("Error while getting Tracks by its name");
            console.log(error);
        }
    }

    async getUserTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const userTopTracks = await tracksRepository.getUserTopTracks(superToken);
        res.json(userTopTracks);
    }

    async getUserPlaylistsTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
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
            const allPlaylistsTracks = await getPlaylistsTracksTyped(playlistsId, superToken);
            res.json(allPlaylistsTracks);
        } catch (error) {
            console.log('Error while getting current user playlists (owned and followed)');
            console.log(error);
        }
    }

    async getUserSavedTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const userSavedTracks = await tracksRepository.getUserSavedTracks(superToken);
        res.json(userSavedTracks);
    }

    async getArtistTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        const tracksRepository = new TracksRepository();
        const artistTopTracks = await tracksRepository.getArtistTopTracks(superToken, itemName);
        res.json(artistTopTracks);
    }

    async getArtistAllTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const artistName = req.params.artistName;
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
            const allArtistTracks = getTracksListsTyped(allArtistTracksResponse.data.tracks.items);
            res.json(allArtistTracks);
        } catch (error) {
            console.log('Error while getting tracks by the Artists: ' + artistName);
            console.log(error);
        }
    }

    async getUserRecommendations(req: Request, res: Response) {
        const superToken = req.headers.authorization;
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

            const artistRecommendationsList = await getItemRecommendations('artist', commaSeparatedArtistsIds, 20, superToken);
            const genresRecommendationsList = await getItemRecommendations('genres', commaSeparatedGenresIds, 20, superToken);
            const tracksRecommendationsList = await getItemRecommendations('tracks', commaSeparatedTracksIds, 20, superToken);

            const artistRecommendations = getTracksListsTyped(artistRecommendationsList.tracks);
            const genresRecommendations = getTracksListsTyped(genresRecommendationsList.tracks);
            const tracksRecommendations = getTracksListsTyped(tracksRecommendationsList.tracks);

            const allRecommendations = [...artistRecommendations, ...tracksRecommendations, ...genresRecommendations];
            res.json(allRecommendations);
        } catch (error) {
            console.log('Error while getting Spotify Recommendations for the current user');
            console.log(error);
        }
    }

    async getUserTopGenresTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const tracksRepository = new TracksRepository();
        const userTopGenresTracks = await tracksRepository.getUserTopGenresTracks(superToken);
        res.json(userTopGenresTracks);
    }

    async getUserTopGenres(req: Request, res: Response): Promise<void> {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtistsList = await loadTopArtists(10, superToken);
            const topArtists = getArtistsListTyped(topArtistsList);
            const sortedTopUserGenres = await getUserTopGenresSeeds(topArtists, superToken);
            res.json(sortedTopUserGenres);
        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
    }
}



export async function getUserTopGenresSeeds(userTopArtists: any[], superToken: string) {
    const artistsGenresLists = userTopArtists.map(artist => artist.genres); // top user generos con repeticiones
    const artistsGenresList = artistsGenresLists.flatMap(arr => arr); //combina todos los generos de dif arreglos en un solo arreglo de generos
    const sortedTopUserGenres = await sortUserTopGenresSeeds(artistsGenresList, superToken);
    const transformedArray = sortedTopUserGenres.map((string) => {
        return formatString(string);
    });
    return transformedArray;
}

export function formatString(text: string) {
    const lowercaseString = text.toLowerCase();
    const capitalizedString = lowercaseString.charAt(0).toUpperCase() + lowercaseString.slice(1);
    return capitalizedString;
}

export async function sortUserTopGenresSeeds(genresList: any[], superToken: string) {
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

export async function getTypedItemByType(type: string, itemName: string, limit: number, superToken: string) {
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
            } else if (type === 'artist') {
                itemsMapped = getArtistsListTyped(itemResponse.data.artists.items);
            }
            return itemsMapped;
        }
    } catch (error) {
        console.log(`Error while getting ${type} for ${itemName}: ` + itemName);
        console.log(error);
    }
}

export function getTracksListsTyped(items: any[]): Track[] {
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

export async function loadTopTracks(superToken: string) {
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

async function getPlaylistsTracksTyped(playlistsId: any[], superToken: string) {
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

export default ApiTracksController;