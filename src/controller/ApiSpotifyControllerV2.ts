import { Request, Response, json } from "express";
import axios from "axios";
import { ApiControllerInterface } from "../interfaces/ApiController.interface";

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f'; // Reemplaza con tu client ID de Spotify
const clientSecret = '8149dd56104c4123a59401f51c8c2340'; // Reemplaza con tu client secret de Spotify
const redirectUri = 'http://localhost:3000/callback'; // Reemplaza con tu URL de redireccionamiento
let ACCESS_TOKEN: string;

class ApiSpotifyControllerV2 implements ApiControllerInterface {


    async getAuthentication(req: Request, res: Response) {
        try {
            const scopes = ['user-read-private', 'user-read-email', 'user-top-read', 'playlist-read-collaborative']; // Define los alcances de permisos que necesitas
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
            const artist = transformItem('artist', artistResponse.data);
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
            const track = transformItem('track', trackResponse.data);
            res.json(track);
        } catch (error) {
            console.log("Error while getting Track by Id");
            console.log(error);
        }
    }

    async getItemTracks(req: Request, res: Response) {
        const itemName = req.params.itemName;
        try {
            const tracks = await getGenericItem('track', itemName);
            res.json(tracks);
        } catch (error) {
            console.log("Error while getting Item Tracks: " + itemName);
            console.log(error);
        }
    }

    async getItemArtists(req: Request, res: Response) {
        const itemName = req.params.itemName;
        try {
            const artists = await getGenericItem('artist', itemName);
            res.json(artists);
        } catch (error) {
            console.log("Error while getting Item Artists: " + itemName);
            console.log(error);
        }
    }

    async getUserTopTracks(req: Request, res: Response) {
        try {
            const topTracksResponse = await axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50&offset=0`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            });
            const tracks = await mapData('track', topTracksResponse.data.items);
            res.json(tracks);
        } catch (error) {
            console.log("Error while getting Top User Tracks: ");
            console.log(error);
        }
    }

    async getUserTopArtists(req: Request, res: Response) {
        try {
            const topArtistsResponse = await axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=50&offset=0`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            });
            const topArtists = await mapData('artist', topArtistsResponse.data.items);
            res.json(topArtists);
        } catch (error) {
            console.log('Error while getting Top Playlists of current user');
            console.log(error);
        }
    }

    async getArtistTopTracks(req: Request, res: Response) {
        const itemName = req.params.itemName;
        try {
            const artists = await getGenericItem('artist', itemName);
            const artistRequired = artists.find((artist: { id: string; name: string; }) => artist.name.toLowerCase() === itemName.toLowerCase());
            const topTracksResponse = await axios.get<any>(`https://api.spotify.com/v1/artists/${artistRequired.id}/top-tracks`, {
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

    async getUserPlaylists(req: Request, res: Response) {
        try {
            const profileResponse = await axios.get('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                },
            });
            const userId = profileResponse.data.id;
            console.log(userId);

            // Obtener las listas de reproducción del usuario y las que sigue
            const userPlaylistsResponse = await axios.get(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                }, params: {
                    limit: 50,
                    offset: 0,
                }
            });
            const playlist = userPlaylistsResponse.data.items.map((playlist: { id: any; name: any; external_urls: { spotify: any; }, tracks: { href: any } }) => {
                return {
                    id: playlist.id,
                    name: playlist.name,
                    external_urls: playlist.external_urls.spotify,
                    tracks: playlist.tracks.href,
                };
            });

            res.json(playlist);
        } catch (error) {
            console.log('Error while getting tracks by the user playlists');
            console.log(error);
        }
    }

}

async function getGenericItem(type: string, itemName: string) {
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
                limit: 50,
                offset: 0,
            }
        });
        if (type === 'artist') {
            itemsMapped = await mapData(type, itemResponse.data.artists.items);
        } else if (type === 'track') {
            itemsMapped = await mapData(type, itemResponse.data.tracks.items);
        }
        return itemsMapped;
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

function transformItem(type: string, item: any) {
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

export default ApiSpotifyControllerV2;