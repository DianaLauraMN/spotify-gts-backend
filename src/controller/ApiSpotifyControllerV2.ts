import axios from "axios";
import { Request, Response, json } from "express";
import { ApiControllerInterface } from "../interfaces/ApiController.interface";
import User from "../entities/user/User";
import UserAdapter from "../entities/user/UserAdapter";
import Track from "../entities/track/Track";
import TrackAdapter from "../entities/track/TrackAdapter";
import Artist from "../entities/artist/Artist";
import ArtistAdapter from "../entities/artist/ArtistAdapter";

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f'; // Reemplaza con tu client ID de Spotify
const clientSecret = '8149dd56104c4123a59401f51c8c2340'; // Reemplaza con tu client secret de Spotify
const redirectUri = 'http://localhost:3000/callback'; // Reemplaza con tu URL de redireccionamiento

class ApiSpotifyControllerV2 implements ApiControllerInterface {


    async getAuthentication(req: Request, res: Response) {
        try {
            const scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'playlist-read-collaborative', 'playlist-read-private', 'user-library-read']; // Define los alcances de permisos que necesitas
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
        try {
            const superToken = req.headers.authorization;
            const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                headers: { 'Authorization': superToken },
            });

            const userItem: User = UserAdapter.adaptUser(profileResponse.data);
            res.json(userItem);
        } catch (error) {
            console.error('Error while getting current user information');
            console.error(error);
        }
    }

    async getArtistById(req: Request, res: Response) {
        try {
            const superToken = req.headers.authorization;
            const artistId = req.params.artistId;
            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: { 'Authorization': superToken }
            });
            const artistItem: Artist = ArtistAdapter.adaptArtist(artistResponse.data);
            res.json(artistItem);
        } catch (error) {
            console.log("Error while getting Artist by Id");
            console.log(error);
        }
    }

    async getTrackById(req: Request, res: Response) {
        const trackId = req.params.trackId;
        try {
            const superToken = req.headers.authorization;
            const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: { 'Authorization': superToken }
            });
            const trackItem: Track = TrackAdapter.adaptTrack(trackResponse.data);
            res.json(trackItem);
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
            const tracks = await getItemByType('track', itemName, 50, superToken);
            res.json(tracks);
        } catch (error) {
            console.log("Error while getting Item Tracks");
            console.log(error);
        }
    }

    async getArtistsByName(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const itemName = req.params.itemName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const artists = await getItemByType('artist', itemName, 50, superToken);
            res.json(artists);
        } catch (error) {
            console.log("Error while getting Item Artists");
            console.log(error);
        }
    }

    async getUserTopTracks(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topTracks = await loadTopTracks(superToken);
            const topTracksTyped = typeTracksLists(topTracks);
            res.json(topTracksTyped);
        } catch (error) {
            console.log("Error while getting Top User Tracks");
            console.log(error);
        }
    }

    async getUserTopArtists(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtists = await loadTopArtists(superToken);
            const topArtistsTyped = typeArtistsLists(topArtists);
            res.json(topArtistsTyped);
        } catch (error) {
            console.log('Error while getting Top Playlists of current user');
            console.log(error);
        }
    }

    async getUserPlaylists(req: Request, res: Response) {
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

            const playlistsId = playlistsResponse.data.items.map((playlist: { id: any }) => {
                return {
                    id: playlist.id,
                };
            });
            const allTracks = await getPlaylistsTracks(playlistsId, superToken);
            const allTracksMapped = typeTracksLists(allTracks);
            res.json(allTracksMapped);
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

            const trackObjects = savedTracksResponse.data.items.map((item: { track: any; }) => item.track);
            const savedTracksTyped = typeTracksLists(trackObjects);
            res.json(savedTracksTyped);
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
            const artists = await getItemByType('artist', itemName, 50, superToken);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());

            const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: { 'Authorization': superToken },
                params: {
                    market: 'ES',
                }
            });
            const tracks = await mapData('track', topTracksResponse.data.tracks);
            res.json(tracks);
        } catch (error) {
            console.log('Error while getting tracks by the Artists: ' + itemName);
            console.log(error);
        }
    }

    async getArtistAllTracks(req: Request, res: Response) {
        const artistName = req.params.artistName;
        try {
            const superToken = req.headers.authorization;
            const allTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: { 'Authorization': superToken },
                params: {
                    q: `artist:"${artistName}"`,
                    type: 'track',
                    limit: 50,
                    offset: 0,
                }
            });
            const allTracks = typeTracksLists(allTracksResponse.data.tracks.items);
            res.json(allTracks);
        } catch (error) {
            console.log('Error while getting tracks by the Artists: ' + artistName);
            console.log(error);
        }
    }

    async getUserRecommendations(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const topArtists = await loadTopArtists(superToken);
            const topTracks = await loadTopTracks(superToken);        

            const topFiveArtist = getSubsetArray(topArtists, 5);
            const topFiveTracks = getSubsetArray(topTracks, 5);

            const topFiveArtistsId = topFiveArtist.map(item => item.id);
            const topFiveTracksId = topFiveTracks.map(item => item.id);

            const commaSeparatedArtistsIds = topFiveArtistsId.join(',');
            const commaSeparatedTracksIds = topFiveTracksId.join(',');

            const artistRecommendations = await getItemRecommendations('artist', commaSeparatedArtistsIds, 20, superToken);
            //const genresRecommendations = await getItemRecommendations('genres', 'anime', 20, superToken);
            const tracksRecommendations = await getItemRecommendations('tracks', commaSeparatedTracksIds, 20, superToken);

            const artistRecommendationsMapped = typeTracksLists(artistRecommendations.tracks);
            //const genresRecommendationsMapped = typeTracksLists(genresRecommendations.tracks);
            const tracksRecommendationsMapped = typeTracksLists(tracksRecommendations.tracks);

            const allRecommendations = [...artistRecommendationsMapped, ...tracksRecommendationsMapped]; //...genresRecommendationsMapped incluir cuando obtenga los generos mas escuchados del usuario
            res.json(allRecommendations);
        } catch (error) {
            console.log('Error while getting Spotify Recommendations for the current user');
            console.log(error);
        }
    }

    async getUserTopGenres(req: Request, res: Response) {
        const superToken = req.headers.authorization;
        const genreName = req.params.genreName;
        try {
            if (!superToken) throw console.error('Error, token expected');
            const genres = await getItemByType('playlist', genreName, 2, superToken);
            res.json(genres);

        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
    }
}

async function getItemByType(type: string, itemName: string, limit: number, superToken: string) {
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
                //itemsMapped = await mapData(type, itemResponse.data.artists.items);
                itemsMapped = typeArtistsLists(itemResponse.data.artists.items);
            } else if (type === 'track') {
                //itemsMapped = await mapData(type, itemResponse.data.tracks.items);
                itemsMapped = typeTracksLists(itemResponse.data.tracks.items);
            } else if (type === 'playlist') {
                //itemsMapped = itemResponse.data.playlists.items.map((item: { id: any }) => item.id);
                const playlistsId = itemResponse.data.playlists.items.map((playlist: { id: any }) => {
                    return { id: playlist.id };
                });
                const genreTracks = await getPlaylistsTracks(playlistsId, superToken);
                if (genreTracks) itemsMapped = await mapData('track', genreTracks);
            }
            return itemsMapped;
        }

    } catch (error) {
        console.log(`Error while getting ${type} for ${itemName}: ` + itemName);
        console.log(error);
    }
}

async function mapData(type: string, items: any) {
    let itemsMapped: any;
    if (type === 'artist') {
        itemsMapped = items.map((artist: { id: any; name: any; external_urls: { spotify: any; }; images: any; popularity: any; type: any; genres: any; }) => {
            return {
                id: artist.id,
                name: artist.name,
                external_urls: artist.external_urls.spotify,
                images: artist.images,
                popularity: artist.popularity,
                type: artist.type,
                genres: artist.genres,
            };
        });
    } else if (type === 'track') {
        itemsMapped = items.map((item: { id: any; name: any; artists: any; album: any; duration_ms: any; external_urls: { spotify: any; }; popularity: any; preview_url: any; type: any; }) => {
            return {
                id: item.id,
                name: item.name,
                artists: item.artists,
                album: item.album,
                duration_ms: item.duration_ms,
                external_urls: item.external_urls.spotify,
                popularity: item.popularity,
                preview_url: item.preview_url,
                type: item.type,
            };
        });
    }

    return itemsMapped;
}

function typeArtistsLists(items: any[]): Artist[] {
    const typedArtists: Artist[] = items.map(item => ArtistAdapter.adaptArtist(item));
    return typedArtists;
}
function typeTracksLists(items: any[]): Track[] {
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
                seed_artists: seedArtist, //A comma separated list of Spotify IDs for seed artists : STRING, up to 5
                seed_genres: seedGenres, //A comma separated list of any genres in the set of available genre seeds. Up to 5 seed
                seed_tracks: seedTracks, //A comma separated list of Spotify IDs for a seed track. Up to 5
            }
        });
        return recommendationsResponse.data;
    } catch (error) {
        console.log('Error while getting Spotify Recommendations for the current user');
        console.log(error);
    }
}

async function loadTopArtists(superToken: string) {
    try {
        const topArtistsResponse = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50&offset=0`, {
            headers: { 'Authorization': superToken }
        });
        return topArtistsResponse.data.items;
    } catch (error) {
        console.log('Error while loading Top Playlists of current user');
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
      // const genresLoaded = await loadAllGenres(superToken); //usar este metodo con esto
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

async function getPlaylistsTracks(playlistsId: any[], superToken: string) {
    try {
        const allTracks: any[] = [];
        const promises = playlistsId.map(async (playlistIterador) => {
            const id = playlistIterador.id;
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
        return allTracks;
    } catch (error) {
        console.log('Error while getting all tracks of the playlist');
        console.log(error);
        throw error;
    }
}

function getSubsetArray(arr: any[], size: number): any[] {
    return arr.slice(0, size);
}

export default ApiSpotifyControllerV2;