import { Request, Response } from "express";
import axios from "axios";

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f'; // Reemplaza con tu client ID de Spotify
const clientSecret = '8149dd56104c4123a59401f51c8c2340'; // Reemplaza con tu client secret de Spotify
const redirectUri = 'http://localhost:3000/callback'; // Reemplaza con tu URL de redireccionamiento
let ACCESS_TOKEN: string;


class ApiSpotifyController {

    async getAuthentication(req: Request, res: Response) {
        try {
            const scopes = ['user-read-private', 'user-read-email']; // Define los alcances de permisos que necesitas
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


    async getArtistTracksById(req: Request, res: Response) {
        const artistId = req.params.artistId;
        try {
            const artistResponse = await axios.get(`https://api.spotify.com/v1/artists/${artistId}`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`
                }
            });
            res.json(artistResponse.data);
        } catch (error) {
            console.log("Error while getting artist by Id");
            console.log(error);
        }
    }

}

export default ApiSpotifyController;