import axios from "axios";
import { Request, Response } from "express";
import { ApiAuthInterface } from "../../interfaces/ApiAuth.interface";

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f';
const clientSecret = '8149dd56104c4123a59401f51c8c2340';
const redirectUri = 'http://localhost:3000/callback';

class ApiAuthController implements ApiAuthInterface{
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

}


export default ApiAuthController;