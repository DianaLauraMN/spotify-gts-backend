import { Request, Response, json } from "express";
import axios, { all } from "axios";
import { ApiControllerInterface } from "../interfaces/ApiController.interface";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f'; // Reemplaza con tu client ID de Spotify
const clientSecret = '8149dd56104c4123a59401f51c8c2340'; // Reemplaza con tu client secret de Spotify
const redirectUri = 'http://localhost:3000/callback'; // Reemplaza con tu URL de redireccionamiento
let ACCESS_TOKEN: string;

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

            ACCESS_TOKEN = authResponse.data.access_token;
            // Redirigir al frontend con la información de autenticación
            res.redirect(`http://localhost:5173?token=${ACCESS_TOKEN}`);
        } catch (error) {
            console.log("Error while getting Access Token");

        }
    }

    async getUserData(req: Request, res: Response) {
        try {
            const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                },
            });
            const user = {
                id: profileResponse.data.id,
                name: profileResponse.data.display_name,
                email: profileResponse.data.email,
                href: profileResponse.data.href
            }
            res.json(user);
        } catch (error) {
            console.error('Error while getting current user information');
            console.error(error);
        }
    }

    async getArtistById(req: Request, res: Response) {
        const artistId = req.params.artistId;
        try {
            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            });
            const artist = transformSingleItem('artist', artistResponse.data);
            res.json(artist);
        } catch (error) {
            console.log("Error while getting Artist by Id");
            console.log(error);
        }
    }

    async getTrackById(req: Request, res: Response) {
        const trackId = req.params.trackId;
        try {
            const trackResponse = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            });
            const track = transformSingleItem('track', trackResponse.data);
            res.json(track);
        } catch (error) {
            console.log("Error while getting Track by Id");
            console.log(error);
        }
    }

    async getItemTracks(req: Request, res: Response) {
        const itemName = req.params.itemName;
        try {
            const tracks = await getGenericItem('track', itemName, 50);
            res.json(tracks);
        } catch (error) {
            console.log("Error while getting Item Tracks: " + itemName);
            console.log(error);
        }
    }

    async getItemArtists(req: Request, res: Response) {
        const itemName = req.params.itemName;
        try {
            const artists = await getGenericItem('artist', itemName, 50);
            res.json(artists);
        } catch (error) {
            console.log("Error while getting Item Artists: " + itemName);
            console.log(error);
        }
    }

    async getUserTopTracks(req: Request, res: Response) {
        try {
            const topTracks = await loadTopTracks();
            const topTracksMapped = await mapData('track', topTracks);
            res.json(topTracksMapped);
        } catch (error) {
            console.log("Error while getting Top User Tracks");
            console.log(error);
        }
    }

    async getUserTopArtists(req: Request, res: Response) {
        try {
            const topArtists = await loadTopArtists();
            const topArtistsMapped = await mapData('artist', topArtists);
            res.json(topArtistsMapped);
        } catch (error) {
            console.log('Error while getting Top Playlists of current user');
            console.log(error);
        }
    }

    async getUserPlaylists(req: Request, res: Response) {
        try {
            const playlistsResponse = await axios.get('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                },
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
            const allTracks = await getPlaylistsTracks(playlistsId);
            const allTracksMapped = await mapData('track', allTracks);
            res.json(allTracksMapped);
        } catch (error) {
            console.log('Error while getting current user playlists (owned and followed)');
            console.log(error);
        }
    }

    async getUserSavedTracks(req: Request, res: Response) {
        try {
            const savedTracksResponse = await axios.get('https://api.spotify.com/v1/me/tracks', {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                },
                params: {
                    market: 'ES',
                    limit: 50,
                    offset: 0,
                }
            });

            const savedTracks = savedTracksResponse.data.items.map((item: {
                track: {
                    id: string; name: string; artists: any; album: any; duration_ms: any;
                    external_urls: { spotify: any }; popularity: any; preview_url: any, type: any
                };
            }) => {
                return {
                    id: item.track.id,
                    name: item.track.name,
                    artists: item.track.artists,
                    album: item.track.album,
                    duration_ms: item.track.duration_ms,
                    external_urls: item.track.external_urls.spotify,
                    popularity: item.track.popularity,
                    preview_url: item.track.preview_url,
                    type: item.track.type,
                };
            });

            res.json(savedTracks);
        } catch (error) {
            console.log('Error while getting user saved Tracks');
            console.log(error);
        }
    }

    async getArtistTopTracks(req: Request, res: Response) {
        const itemName = req.params.itemName;
        try {
            const artists = await getGenericItem('artist', itemName, 50);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());
            const topTracksResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                },
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
            const allTracksResponse = await axios.get(`https://api.spotify.com/v1/search`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                },
                params: {
                    q: `artist:"${artistName}"`,
                    type: 'track',
                    limit: 50,
                    offset: 0,
                }
            });
            const allTracks = await mapData('track', allTracksResponse.data.tracks.items);
            res.json(allTracks);
        } catch (error) {
            console.log('Error while getting tracks by the Artists: ' + artistName);
            console.log(error);
        }
    }

    async getUserRecommendations(req: Request, res: Response) {
        try { // [{},{},{}...]
            const topArtists = await loadTopArtists(); //falta sacar de los primeros 5 sus id - arr[] de obj{}
            const topTracks = await loadTopTracks();
            const genresSeeds = await loadGenresSeeds();

            const topFiveArtist = getSubsetArray(topArtists, 5);
            const topFiveTracks = getSubsetArray(topTracks, 5);

            const topFiveArtistsId = topFiveArtist.map(item => item.id);
            const topFiveTracksId = topFiveTracks.map(item => item.id);

            const commaSeparatedArtistsIds = topFiveArtistsId.join(',');
            const commaSeparatedTracksIds = topFiveTracksId.join(',');

            const artistRecommendations = await getItemRecommendations('artist', commaSeparatedArtistsIds, 20);
            const genresRecommendations = await getItemRecommendations('genres', 'classical,country', 20);
            const tracksRecommendations = await getItemRecommendations('tracks', commaSeparatedTracksIds, 20);

            const artistRecommendationsMapped = await mapData('track', artistRecommendations.tracks);
            const genresRecommendationsMapped = await mapData('track', genresRecommendations.tracks);
            const tracksRecommendationsMapped = await mapData('track', tracksRecommendations.tracks);

            const allRecommendations = [...artistRecommendationsMapped, ...genresRecommendationsMapped, ...tracksRecommendationsMapped];
            res.json(allRecommendations);
        } catch (error) {
            console.log('Error while getting Spotify Recommendations for the current user');
            console.log(error);
        }
    }

    async getUserTopGenres(req: Request, res: Response) {
        const genreName = req.params.genreName;
        try {
            const genres = await getGenericItem('playlist', genreName, 2);
            res.json(genres);
        } catch (error) {
            console.log('Error while getting user top genres');
            console.log(error);
        }
    }
}

async function getGenericItem(type: string, itemName: string, limit: number) {
    let itemsMapped: any[''];
    try {
        const itemResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            },
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
                itemsMapped = await mapData(type, itemResponse.data.artists.items);
            } else if (type === 'track') {
                itemsMapped = await mapData(type, itemResponse.data.tracks.items);
            } else if (type === 'playlist') {
                //itemsMapped = itemResponse.data.playlists.items.map((item: { id: any }) => item.id);
                const playlistsId = itemResponse.data.playlists.items.map((playlist: { id: any }) => {
                    return { id: playlist.id };
                });
                const genreTracks = await getPlaylistsTracks(playlistsId);
                if (genreTracks) itemsMapped = await mapData('track', genreTracks);
            }
            return itemsMapped;
        }

    } catch (error) {
        console.log(`Error while getting ${type} for ${itemName}: ` + itemName);
        console.log(error);
    }
}

async function mapData(type: string, obj: any) {
    let items: any;
    if (type === 'artist') {
        items = obj.map((artist: { id: any; name: any; external_urls: { spotify: any; }; images: any; popularity: any; type: any; genres: any; }) => {
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
        items = obj.map((item: { id: any; name: any; artists: any; album: any; duration_ms: any; external_urls: { spotify: any; }; popularity: any; preview_url: any; type: any; }) => {
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

    return items;
}

function transformSingleItem(type: string, item: any) {
    if (type === 'artist') {
        return {
            id: item.id,
            name: item.name,
            images: item.images,
            external_urls: item.external_urls,
            popularity: item.popularity,
            type: item.type,
            genres: item.genres,
        }
    } else if (type === 'track') {
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
        }
    }
}

async function getItemRecommendations(type: string, itemList: string, limit: number) {
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
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            },
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

async function loadTopArtists() {
    try {
        const topArtistsResponse = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50&offset=0`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        });
        return topArtistsResponse.data.items;
    } catch (error) {
        console.log('Error while loading Top Playlists of current user');
        console.log(error);
    }
}

async function loadTopTracks() {
    try {
        const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50&offset=0`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        });
        return topTracksResponse.data.items;
    } catch (error) {
        console.log("Error while loading Top User Tracks");
        console.log(error);
    }
}

async function loadGenresSeeds() {
    try {
        const genresSeedsResponse = await axios.get(`https://api.spotify.com/v1/recommendations/available-genre-seeds`, {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`
            }
        });
        return genresSeedsResponse.data.genres;
    } catch (error) {
        console.log("Error while loading genres seeds");
        console.log(error);
    }
}

async function getPlaylistsTracks(playlistsId: any[]) {
    try {
        const allTracks: any[] = [];
        const promises = playlistsId.map(async (playlistIterador) => {
            const id = playlistIterador.id;
            const playlistsResponse = await axios.get(`https://api.spotify.com/v1/playlists/${id}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }, params: {
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