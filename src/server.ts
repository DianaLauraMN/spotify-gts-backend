import express, { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import cors from 'cors';

const app = express();
const PORT = 3000;

const clientId = '34a5174f68d8473ebb3a54a85d0b5d8f';
const clientSecret = '8a1d456aa6844dcc932716458b402747';

app.use(cors({
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200,
}));


app.get('/api/artist/:artistName', async (req: Request, res: Response) => {
  try {
    const { artistName } = req.params;
    // Obtener el access token utilizando el client ID y client secret
    const authResponse = await axios.post<any>(
      'https://accounts.spotify.com/api/token',
      null,
      {
        params: {
          grant_type: 'client_credentials',
        },
        headers: {
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
            'base64'
          )}`,
        },
      }
    );
    const accessToken = authResponse.data.access_token;

    // Buscar los álbumes del artista por su nombre
    const searchResponse = await axios.get<any>('https://api.spotify.com/v1/search', {
      params: {
        q: `artist:"${artistName}"`,
        type: 'track',
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    //Obtiene todos los tracks de la response
    const tracks = searchResponse.data.tracks.items;
    if (tracks.length === 0) {
      return res.status(404).json({ error: 'Canciones no encontradas' });
    }

    const trackData = tracks.map((track: any) => ({
      name: track.name,
      uri: track.uri
    }));

    // Obtener la información necesaria de los tracks y retornarla como un arreglo de strings
    //const trackNames = tracks.map((track: any) => track.name);
    //res.json(trackNames);
    res.json(trackData);

  } catch (error) {
    console.error('Error al obtener los álbumes:', error);
    res.status(500).json({ error: 'Error al obtener los álbumes' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});
