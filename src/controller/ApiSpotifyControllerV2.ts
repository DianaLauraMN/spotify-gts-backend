import axios from "axios";
import { Request, Response, json } from "express";
import { ApiControllerInterface } from "../interfaces/ApiController.interface";
import User from "../entities/user/User";
import UserAdapter from "../entities/user/UserAdapter";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import Artist from "../entities/artist/Artist";
import ArtistAdapter from "../entities/artist/ArtistAdapter";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f'; // Reemplaza con tu client ID de Spotify
const clientSecret = '8149dd56104c4123a59401f51c8c2340'; // Reemplaza con tu client secret de Spotify
const redirectUri = 'http://localhost:3000/callback'; // Reemplaza con tu URL de redireccionamiento

class ApiSpotifyControllerV2 implements ApiControllerInterface {


    async getAuthentication(req: Request, res: Response) {
        try {
            const scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'playlist-read-collaborative', 'playlist-read-private', 'user-library-read', 'user-follow-read'];
            const authorizeUrl =
                'https://accounts.spotify.com/authorize?' +
                new URLSearchParams({
                    response_type: 'code',
                    client_id: clientId,
                    scope: scopes.join(' '),
                    redirect_uri: redirectUri,
                    state: 'state123',
                });
            res.redirect(authorizeUrl);
        } catch (error) {
            console.log("Error while authentication");
        }
    }

    async getCallback(req: Request, res: Response) {
        const code = req.query.code as string;
        try {
            const authResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirectUri,
                    client_id: clientId,
                    client_secret: clientSecret,
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );
            const accessToken = authResponse.data.access_token;
            res.json({ token: accessToken });
        } catch (error) {
            console.log("Error while getting Access Token");
        }
    }

    async getUserData(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': superToken },
            });
            const user: User = UserAdapter.adaptUser(profileResponse.data);
            res.json(user);
        } catch (error) {
            console.error('Error while getting current user information');
            console.error(error);
        }
    }

    async getArtistById(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const artistId = req.params.artistId;
        try {
            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: { 'Authorization': superToken }
            });
            const artist: Artist = ArtistAdapter.adaptArtist(artistResponse.data);
            res.json(artist);
        } catch (error) {
            console.log("Error while getting Artist by Id");
            console.log(error);
        }
    }

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

    async getArtistsByName(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const artists = await getTypedItemByType('artist', itemName, 50, superToken);
            res.json(artists);
        } catch (error) {
            console.log("Error while getting Artists by its name");
            console.log(error);
        }
    }

    async getUserTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topTracksList = await loadTopTracks(superToken);
            const topTracks = getTracksListsTyped(topTracksList);
            res.json(topTracks);
        } catch (error) {
            console.log("Error while getting User Top Tracks");
            console.log(error);
        }
    }

    async getUserTopArtists(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtistsList = await loadTopArtists(50, superToken);
            const topArtists = getArtistsListTyped(topArtistsList);
            res.json(topArtists);
        } catch (error) {
            console.log('Error while getting User Top Playlists');
            console.log(error);
        }
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

            const tracksList = savedTracksResponse.data.items.map((item: { track: any; }) => item.track);
            const savedTracks = getTracksListsTyped(tracksList);
            res.json(savedTracks);
        } catch (error) {
            console.log('Error while getting user saved Tracks');
            console.log(error);
        }
    }

    async getArtistTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const artists = await getTypedItemByType('artist', itemName, 50, superToken);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());
            const artistTopTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: { 'Authorization': superToken },
                params: {
                    market: 'ES',
                }
            });
            const artistTopTracks = getTracksListsTyped(artistTopTracksResponse.data.tracks);
            res.json(artistTopTracks);
        } catch (error) {
            console.log('Error while getting tracks by the Artists: ' + itemName);
            console.log(error);
        }
    }

    async getAllArtistTracks(req: Request, res: Response) {
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

    async getTracksByGenre(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const genreName = req.params.genreName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const genres = await getTypedItemByType('playlist', genreName, 2, superToken);
            res.json(genres);
        } catch (error) {
            console.log('Error while getting tracks by genre');
            console.log(error);
        }
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

async function getUserTopGenresSeeds(topArtists: any[], superToken: string) {
    const artistsGenresLists = topArtists.map(artist => artist.genres); // top user generos con repeticiones
    const artistsGenresList = artistsGenresLists.flatMap(arr => arr); //combina todos los generos de dif arreglos en un solo arreglo de generos
    const sortedTopUserGenres = await sortUserTopGenresSeeds(artistsGenresList, superToken);
    return sortedTopUserGenres;
}

async function sortUserTopGenresSeeds(genresList: any[], superToken: string) {
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

async function getTypedItemByType(type: string, itemName: string, limit: number, superToken: string) {
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
            if (type === 'artist') {
                itemsMapped = getArtistsListTyped(itemResponse.data.artists.items);
            } else if (type === 'track') {
                itemsMapped = getTracksListsTyped(itemResponse.data.tracks.items);
            } else if (type === 'playlist') {
                const playlistsId = itemResponse.data.playlists.items.map((playlist: { id: any }) => playlist.id);
                itemsMapped = await getPlaylistsTracksTyped(playlistsId, superToken);
            }
            return itemsMapped;
        }
    } catch (error) {
        console.log(`Error while getting ${type} for ${itemName}: ` + itemName);
        console.log(error);
    }
}

function getArtistsListTyped(items: any[]): Artist[] {
    const typedArtists: Artist[] = items.map(item => ArtistAdapter.adaptArtist(item));
    return typedArtists;
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

async function loadTopArtists(limit: number, superToken: string) {
    try {
        const topArtistsResponse = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=${limit}&offset=0`, {
            headers: { 'Authorization': superToken }
        });
        return topArtistsResponse.data.items;
    } catch (error) {
        console.log('Error while loading Top Artist of current user');
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

export default ApiSpotifyControllerV2;