import axios, { AxiosError } from "axios";
import { Request, Response } from "express";
import { ApiAuthInterface } from "../../interfaces/ApiAuth.interface";
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import * as querystring from 'querystring';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
const SECRET_KEY = process.env.SECRET_KEY

//const redirectUri = 'http://localhost:3000/callback';
//const redirectUri = 'http://localhost:5173/configGame';

class ApiAuthController implements ApiAuthInterface {

    async login(req: Request, res: Response) {
        const scope = 'user-read-private user-read-email user-top-read playlist-read-collaborative playlist-read-private user-library-read user-follow-read';
        res.redirect(`https://accounts.spotify.com/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=${encodeURIComponent(scope)}`);
    };

    async callback(req: Request, res: Response) {
        try {
            const code = req.query.code as string;
            const authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                form: {
                    code,
                    redirect_uri,
                    grant_type: 'authorization_code',
                },
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
                },
                json: true,
            };

            const response = await axios.post(authOptions.url, querystring.stringify(authOptions.form), {
                headers: authOptions.headers,
            });

            const { access_token, refresh_token, expires_in } = response.data;
            res.json({ access_token, refresh_token, expires_in });
        } catch (error) {
            console.error('Error al obtener tokens de Spotify', error);
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            const { refresh_token } = req.query;
            const authOptions = {
                url: 'https://accounts.spotify.com/api/token',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
                },
                params: {
                    grant_type: 'refresh_token',
                    refresh_token: refresh_token
                }
            };

            const response = await axios.post(authOptions.url, null, {
                params: authOptions.params,
                headers: authOptions.headers
            });

            if (response.status === 200) {
                const { access_token, refresh_token, expires_in } = response.data;
                res.json({ access_token, refresh_token, expires_in });
            }
        } catch (error) {
            console.error('Error while renewing access token:', error);
        }
    }

    //sera reemplazado por login
    async initiateAuthentication(req: Request, res: Response) {
        try {
            const scopes = ['user-read-private user-read-email user-top-read playlist-read-collaborative playlist-read-private user-library-read user-follow-read'];
            const authorizeUrl =
                'https://accounts.spotify.com/authorize?' +
                new URLSearchParams({
                    response_type: 'code',
                    client_id: client_id,
                    scope: scopes.join(' '),
                    redirect_uri: redirect_uri,
                    state: 'state123',
                });

            res.redirect(authorizeUrl);

        } catch (error) {
            console.log("Error at initiateAuthentication");
            console.log(error);
        }
    }

    //sera reemplazado por callback
    async handleAuthorizationCode(req: Request, res: Response) {
        const code = req.query.code as string;
        try {
            const authResponse = await axios.post(
                'https://accounts.spotify.com/api/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: redirect_uri,
                    client_id: client_id,
                    client_secret: client_secret,
                }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded', }, }
            );

            const { access_token, refresh_token, expires_in } = authResponse.data;
            // if (access_token && refresh_token && expires_in)
            //     res.json({ access_token, refresh_token, expires_in });
            if (access_token && refresh_token && expires_in) {
                res.set('Access-Control-Allow-Origin', '*'); // Permitir todas las solicitudes
                res.json({ access_token, refresh_token, expires_in });
            }
        } catch (error) {
            res.set('Access-Control-Allow-Origin', '*'); // Permitir todas las solicitudes
            console.log("Error while getting Access Token at handleAuthorizationCode");
            console.log(error);
        }
    }
}


export function generateSecretKey() {

    // Generar 64 bytes aleatorios (secuencia de bytes)
    const bytesAleatorios = crypto.randomBytes(64);

    // Mostrar los bytes aleatorios generados
    console.log('Bytes Aleatorios:', bytesAleatorios);

    // Convertir los bytes a una cadena hexadecimal
    const cadenaHexadecimal = bytesAleatorios.toString('hex');

    // Mostrar la cadena hexadecimal resultante
    console.log('Cadena Hexadecimal:', cadenaHexadecimal);
    //process.env.SECRET_KEY = expires_in;
}

export default ApiAuthController;